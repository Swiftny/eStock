import { randomUUID } from "node:crypto";
import type { HistoryMovement } from "../../estock-history";
import type { PoolClient } from "pg";
import type { Role } from "./auth";
import { ready, withTransaction } from "./db";
import { fail } from "./errors";
import {
  dateOnly,
  fingerprint,
  id,
  integer,
  normalizeName,
  requestId,
  revision,
  str,
} from "./input";

const MAX = Number.MAX_SAFE_INTEGER;

export interface ProductView {
  id: string;
  name: string;
  unit: string;
  stock: number;
  lowStock: boolean;
  version: number;
}

function product(row: Record<string, unknown>): ProductView {
  const stock = Number(row.stock);
  return {
    id: String(row.id),
    name: String(row.official_name),
    unit: String(row.unit),
    stock,
    lowStock: stock < 5,
    version: Number(row.version),
  };
}

export async function getProduct(productId: string, client?: PoolClient): Promise<ProductView> {
  const db = client || (await ready());
  const rows = await db.query("SELECT * FROM estock_products WHERE id=$1 AND archived_at IS NULL", [
    id(productId, "Product ID"),
  ]);
  if (!rows.rows[0]) fail("Product not found.", 404, "NOT_FOUND");
  return product(rows.rows[0]);
}

export async function listProducts(query = ""): Promise<ProductView[]> {
  const db = await ready();
  const q = query.trim();
  if (q.length > 120) fail("Search is too long.");
  const normalized = normalizeName(q);
  const rows = await db.query(
    `SELECT p.* FROM estock_products p
     WHERE p.archived_at IS NULL AND ($1='' OR position($1 in p.normalized_name)>0 OR EXISTS (
       SELECT 1 FROM estock_aliases a WHERE a.product_id=p.id AND position($1 in a.normalized)>0
     ))
     ORDER BY lower(p.official_name),p.id`,
    [normalized],
  );
  return rows.rows.map(product);
}

export async function matchExactProducts(
  name: string,
  client?: PoolClient,
): Promise<ProductView[]> {
  const db = client || (await ready());
  const normalized = normalizeName(name);
  if (!normalized) return [];
  const exact = await db.query(
    `SELECT DISTINCT p.* FROM estock_products p
     LEFT JOIN estock_aliases a ON a.product_id=p.id
     WHERE p.archived_at IS NULL AND (p.normalized_name=$1 OR a.normalized=$1)
     ORDER BY p.id`,
    [normalized],
  );
  return exact.rows.map(product);
}

export async function matchProducts(name: string, client?: PoolClient): Promise<ProductView[]> {
  const db = client || (await ready());
  const normalized = normalizeName(name);
  if (!normalized) return [];
  const exact = await matchExactProducts(name, client);
  if (exact.length) return exact;
  const fuzzy = await db.query(
    `SELECT DISTINCT p.* FROM estock_products p
     LEFT JOIN estock_aliases a ON a.product_id=p.id
     WHERE p.archived_at IS NULL AND (position($1 in p.normalized_name)>0 OR position(p.normalized_name in $1)>0
       OR position($1 in coalesce(a.normalized,''))>0)
     ORDER BY p.id LIMIT 5`,
    [normalized],
  );
  return fuzzy.rows.map(product);
}

export async function withRequest<T>(
  client: PoolClient,
  key: string,
  action: string,
  role: Role,
  input: unknown,
  operation: () => Promise<T>,
): Promise<T> {
  const request = requestId(key);
  const hash = fingerprint(input);
  const inserted = await client.query(
    "INSERT INTO estock_requests(request_id,action,actor_role,fingerprint,result) VALUES($1,$2,$3,$4,'{}'::jsonb) ON CONFLICT DO NOTHING RETURNING request_id",
    [request, action, role, hash],
  );
  if (!inserted.rowCount) {
    const previous = await client.query(
      "SELECT action,actor_role,fingerprint,result FROM estock_requests WHERE request_id=$1",
      [request],
    );
    const row = previous.rows[0];
    if (!row || row.action !== action || row.actor_role !== role || row.fingerprint !== hash) {
      fail("This request ID was already used with different details.", 409, "REQUEST_CONFLICT");
    }
    return row.result as T;
  }
  const result = await operation();
  await client.query("UPDATE estock_requests SET result=$2::jsonb WHERE request_id=$1", [
    request,
    JSON.stringify(result),
  ]);
  return result;
}

export async function createProduct(
  input: Record<string, unknown>,
): Promise<{ product: ProductView }> {
  const name = str(input.name, "Product name", 120);
  const unit = str(input.unit, "Base unit", 32);
  const openingStock = integer(input.openingStock, "Opening stock", 0);
  const preparationDraftId =
    input.preparationDraftId === undefined
      ? null
      : id(input.preparationDraftId, "Preparation draft ID");
  if (preparationDraftId && openingStock !== 0)
    fail("Products created during receipt preparation must start with Opening 0.");
  const key = requestId(input.requestId);
  return withTransaction(async (client) =>
    withRequest(
      client,
      key,
      "CREATE_PRODUCT",
      "manager",
      { name, unit, openingStock, preparationDraftId },
      async () => {
        if (preparationDraftId) {
          const draft = await client.query(
            "SELECT status FROM estock_drafts WHERE id=$1 FOR UPDATE",
            [preparationDraftId],
          );
          if (draft.rows[0]?.status !== "DRAFT")
            fail("Receipt is no longer a preparation draft.", 409, "DRAFT_CLOSED");
        }
        const productId = randomUUID();
        await client.query(
          "INSERT INTO estock_products(id,official_name,normalized_name,unit,stock) VALUES($1,$2,$3,$4,$5)",
          [productId, name, normalizeName(name), unit, openingStock],
        );
        await client.query(
          `INSERT INTO estock_movements(id,source_event_id,product_id,product_name,unit,type,quantity,delta,balance_after,actor_role,actor_account_id)
         VALUES($1,$2,$3,$4,$5,'OPENING',$6,$6,$6,'manager','manager')`,
          [randomUUID(), `opening:${productId}`, productId, name, unit, openingStock],
        );
        return { product: await getProduct(productId, client) };
      },
    ),
  );
}

export async function editProduct(
  productId: string,
  input: Record<string, unknown>,
): Promise<{ product: ProductView }> {
  const newName = str(input.name, "Product name", 120);
  const expected = revision(input.expectedVersion);
  return withTransaction(async (client) => {
    const changed = await client.query(
      "UPDATE estock_products SET official_name=$1,normalized_name=$2,version=version+1,updated_at=now() WHERE id=$3 AND version=$4 AND archived_at IS NULL RETURNING *",
      [newName, normalizeName(newName), id(productId, "Product ID"), expected],
    );
    if (!changed.rows[0])
      fail("Product changed or was not found. Refresh and try again.", 409, "STALE_PRODUCT");
    return { product: product(changed.rows[0]) };
  });
}

export type MovementView = HistoryMovement;

export function movement(row: Record<string, unknown>): MovementView {
  return {
    id: String(row.id),
    type: row.type as MovementView["type"],
    quantity: Number(row.quantity),
    delta: Number(row.delta),
    productId: String(row.product_id),
    productName: String(row.product_name),
    unit: String(row.unit),
    actorRole: row.actor_role as Role,
    actorAccountId: row.actor_account_id as Role,
    createdAt: new Date(String(row.created_at)).toISOString(),
    documentDate: dateOnly(row.document_date),
    approvedAt: row.approved_at ? new Date(String(row.approved_at)).toISOString() : null,
    draftId: row.draft_id ? String(row.draft_id) : null,
    lineOrder:
      row.line_order === null || row.line_order === undefined ? null : Number(row.line_order),
    rawName: row.raw_name === null ? null : String(row.raw_name),
    rawQuantity: row.raw_quantity === null ? null : Number(row.raw_quantity),
    rawUnit: row.raw_unit === null ? null : String(row.raw_unit),
    reviewedName: row.reviewed_name === null ? null : String(row.reviewed_name),
  };
}

export async function recordMovement(
  role: Role,
  input: Record<string, unknown>,
): Promise<{ movement: MovementView; product: ProductView }> {
  const productId = id(input.productId, "Product ID");
  if (input.type !== "TAKE" && input.type !== "RETURN") fail("Choose Take or Return.");
  const type = input.type;
  const quantity = integer(input.quantity, "Quantity");
  const key = requestId(input.requestId);
  return withTransaction(async (client) =>
    withRequest(client, key, type, role, { productId, type, quantity }, async () => {
      const selected = await client.query("SELECT * FROM estock_products WHERE id=$1 FOR UPDATE", [
        productId,
      ]);
      if (!selected.rows[0] || selected.rows[0].archived_at)
        fail("Product is no longer active. Refresh Inventory.", 409, "ARCHIVED_PRODUCT");
      const current = Number(selected.rows[0].stock);
      if (type === "TAKE" && quantity > current)
        fail("Not enough stock available.", 409, "INSUFFICIENT_STOCK");
      const next = type === "TAKE" ? current - quantity : current + quantity;
      if (!Number.isSafeInteger(next) || next > MAX)
        fail("Stock would exceed the supported amount.");
      await client.query("UPDATE estock_products SET stock=$1,updated_at=now() WHERE id=$2", [
        next,
        productId,
      ]);
      const saved = await client.query(
        `INSERT INTO estock_movements(id,source_event_id,product_id,product_name,unit,type,quantity,delta,balance_after,actor_role,actor_account_id)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10) RETURNING *`,
        [
          randomUUID(),
          `movement:${key}`,
          productId,
          selected.rows[0].official_name,
          selected.rows[0].unit,
          type,
          quantity,
          type === "TAKE" ? -quantity : quantity,
          next,
          role,
        ],
      );
      return { movement: movement(saved.rows[0]), product: await getProduct(productId, client) };
    }),
  );
}

export async function listHistory(): Promise<MovementView[]> {
  const db = await ready();
  const result = await db.query(`SELECT m.*,l.line_order FROM estock_movements m
    LEFT JOIN estock_drafts d ON d.id=m.draft_id
    LEFT JOIN estock_draft_lines l ON l.id=m.line_id
    WHERE m.type<>'INTAKE' OR d.status IN ('APPROVED','RECEIVED')
    ORDER BY m.created_at DESC,m.id DESC`);
  return result.rows.map(movement);
}

export async function archiveProduct(productId: string, input: Record<string, unknown>) {
  const key = id(productId, "Product ID");
  const expected = revision(input.expectedVersion);
  return withTransaction(async (client) =>
    withRequest(
      client,
      requestId(input.requestId),
      "ARCHIVE_PRODUCT",
      "manager",
      { key, expected },
      async () => {
        const result = await client.query("SELECT * FROM estock_products WHERE id=$1 FOR UPDATE", [
          key,
        ]);
        const row = result.rows[0];
        if (!row) fail("Product not found.", 404, "NOT_FOUND");
        if (row.archived_at) return { archived: true, productId: key };
        if (Number(row.version) !== expected)
          fail("Product changed. Refresh before deleting.", 409, "STALE_PRODUCT");
        await client.query(
          `UPDATE estock_products SET archived_at=now(),archived_by='manager',
        archived_stock=stock,version=version+1,updated_at=now() WHERE id=$1`,
          [key],
        );
        return { archived: true, productId: key };
      },
    ),
  );
}
