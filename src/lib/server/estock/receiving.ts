import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Role } from "./auth";
import { ready, withTransaction } from "./db";
import { getDraft } from "./drafts";
import { fail } from "./errors";
import { dateOnly, id, integer, object, requestId, revision } from "./input";
import { withRequest } from "./inventory";

export interface ReceiptLine {
  id: string;
  productId: string | null;
  productName: string;
  unit: string;
  expected: number;
  actual: number | null;
  outcome: "MATCH" | "SHORT" | "EXTRA" | null;
  difference: number | null;
  rawName?: string;
  rawQuantity?: number | null;
  rawUnit?: string | null;
  reviewedName?: string;
}
export interface ReceiptExcludedLine {
  id: string;
  lineOrder: number;
  rawName: string;
  reviewedName: string;
  exclusionReason: string;
}
export interface Receipt {
  id: string;
  revision: number;
  status: string;
  documentDate: string | null;
  documentType: string;
  sentAt: string;
  receivedAt: string | null;
  hasDiscrepancies: boolean;
  lines: ReceiptLine[];
  excludedLines?: ReceiptExcludedLine[];
}
const iso = (value: unknown) => (value ? new Date(String(value)).toISOString() : null);

export async function getReceipt(
  receiptId: string,
  role: Role,
  client?: PoolClient,
): Promise<Receipt> {
  const db = client || (await ready());
  const result = await db.query(
    `SELECT d.*,s.revision AS submitted_revision,s.sent_at AS submitted_at,s.document_date AS submitted_date
    FROM estock_drafts d JOIN estock_receipt_submissions s ON s.draft_id=d.id
    WHERE d.id=$1 ORDER BY s.revision DESC LIMIT 1`,
    [id(receiptId)],
  );
  const row = result.rows[0];
  if (!row || (role === "staff" && !["AWAITING_STAFF", "RECEIVED"].includes(row.status)))
    fail(
      "This receipt is no longer available for checking. Refresh pending checks.",
      404,
      "NOT_FOUND",
    );
  const lines = await db.query(
    "SELECT s.*,l.raw_name,l.raw_quantity,l.raw_unit,coalesce(s.reviewed_name_snapshot,l.reviewed_name) AS reviewed_name FROM estock_receipt_lines s JOIN estock_draft_lines l ON l.id=s.line_id WHERE s.draft_id=$1 AND s.revision=$2 ORDER BY s.line_order",
    [receiptId, row.submitted_revision],
  );
  const exclusions =
    role === "manager"
      ? await db.query(
          "SELECT e.line_id,e.line_order,e.reviewed_name,e.exclusion_reason,l.raw_name FROM estock_receipt_exclusions e JOIN estock_draft_lines l ON l.id=e.line_id WHERE e.draft_id=$1 AND e.revision=$2 ORDER BY e.line_order",
          [receiptId, row.submitted_revision],
        )
      : null;
  return {
    id: receiptId,
    revision: Number(row.submitted_revision),
    status: row.status,
    documentDate: dateOnly(row.submitted_date),
    documentType: row.document_type,
    sentAt: new Date(row.submitted_at).toISOString(),
    receivedAt: iso(row.received_at),
    hasDiscrepancies: row.has_discrepancies,
    lines: lines.rows.map((l) => ({
      id: l.line_id,
      productId: l.product_id,
      productName: l.product_name,
      unit: l.unit,
      expected: Number(l.expected_quantity),
      actual: l.actual_quantity === null ? null : Number(l.actual_quantity),
      ...(role === "manager"
        ? {
            rawName: l.raw_name,
            rawQuantity: l.raw_quantity === null ? null : Number(l.raw_quantity),
            rawUnit: l.raw_unit,
            reviewedName: l.reviewed_name,
          }
        : {}),
      outcome: l.outcome,
      difference: l.difference === null ? null : Number(l.difference),
    })),
    ...(exclusions
      ? {
          excludedLines: exclusions.rows.map((line) => ({
            id: line.line_id,
            lineOrder: Number(line.line_order),
            rawName: line.raw_name,
            reviewedName: line.reviewed_name,
            exclusionReason: line.exclusion_reason,
          })),
        }
      : {}),
  };
}
export async function listReceiving(role: Role): Promise<Receipt[]> {
  const db = await ready();
  const rows = await db.query(
    "SELECT id FROM estock_drafts WHERE status=$1 ORDER BY sent_at DESC",
    [role === "staff" ? "AWAITING_STAFF" : "RECEIVED"],
  );
  return Promise.all(rows.rows.map((row) => getReceipt(row.id, role)));
}

export async function sendReceipt(receiptId: string, input: Record<string, unknown>) {
  const key = id(receiptId),
    expected = revision(input.expectedRevision);
  return withTransaction(async (client) =>
    withRequest(
      client,
      requestId(input.requestId),
      "SEND_RECEIPT",
      "manager",
      { key, expected },
      async () => {
        const locked = await client.query("SELECT * FROM estock_drafts WHERE id=$1 FOR UPDATE", [
          key,
        ]);
        const draft = locked.rows[0];
        if (!draft) fail("Draft not found.", 404, "NOT_FOUND");
        if (draft.status !== "DRAFT")
          fail("This draft is already sent or closed.", 409, "DRAFT_CLOSED");
        if (Number(draft.revision) !== expected)
          fail("Draft changed. Refresh before sending.", 409, "STALE_DRAFT");
        if (!draft.document_date) fail("Resolve the document date before sending.");
        const result = await client.query(
          "SELECT * FROM estock_draft_lines WHERE draft_id=$1 ORDER BY line_order FOR UPDATE",
          [key],
        );
        const included = result.rows.filter((line) => !line.excluded);
        if (!included.length) fail("Include at least one expected product line.");
        for (const line of result.rows) {
          if (
            line.excluded
              ? !line.exclusion_reason?.trim()
              : !line.product_id || !line.reviewed_name?.trim() || line.approved_quantity === null
          )
            fail("Resolve products, expected quantities and exclusion reasons before sending.");
        }
        const products = new Map<string, Record<string, unknown>>();
        for (const productId of [
          ...new Set(included.map((line) => String(line.product_id))),
        ].sort()) {
          const p = await client.query("SELECT * FROM estock_products WHERE id=$1 FOR UPDATE", [
            productId,
          ]);
          if (!p.rows[0] || p.rows[0].archived_at)
            fail(
              "A product was deleted. Correct the draft and select an active product.",
              409,
              "ARCHIVED_PRODUCT",
            );
          products.set(productId, p.rows[0]);
        }
        for (const line of included) {
          if (
            Number(products.get(line.product_id)?.version) !== Number(line.selected_product_version)
          )
            fail("A product changed. Refresh and save the draft again.", 409, "STALE_PRODUCT");
          integer(Number(line.approved_quantity), "Expected quantity");
        }
        const submitted = expected + 1;
        await client.query(
          "INSERT INTO estock_receipt_submissions(draft_id,revision,document_date,sent_by) VALUES($1,$2,$3,'manager')",
          [key, submitted, dateOnly(draft.document_date)],
        );
        for (const line of included) {
          const p = products.get(line.product_id);
          if (!p) fail("Selected product is unavailable.", 409, "STALE_PRODUCT");
          await client.query(
            `INSERT INTO estock_receipt_lines(draft_id,revision,line_id,line_order,product_id,product_name,unit,expected_quantity,reviewed_name_snapshot)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [
              key,
              submitted,
              line.id,
              line.line_order,
              line.product_id,
              p.official_name,
              p.unit,
              line.approved_quantity,
              line.reviewed_name,
            ],
          );
        }
        for (const line of result.rows.filter((candidate) => candidate.excluded)) {
          await client.query(
            `INSERT INTO estock_receipt_exclusions(draft_id,revision,line_id,line_order,reviewed_name,exclusion_reason)
             VALUES($1,$2,$3,$4,$5,$6)`,
            [key, submitted, line.id, line.line_order, line.reviewed_name, line.exclusion_reason],
          );
        }
        await client.query(
          "UPDATE estock_drafts SET status='AWAITING_STAFF',revision=$2,sent_at=now(),sent_by='manager',updated_at=now() WHERE id=$1",
          [key, submitted],
        );
        await client.query(
          "INSERT INTO estock_notifications(id,role,kind,draft_id,revision) VALUES($1,'staff','RECEIVING',$2,$3)",
          [randomUUID(), key, submitted],
        );
        return { draft: await getDraft(key, client) };
      },
    ),
  );
}

export async function recallReceipt(receiptId: string, input: Record<string, unknown>) {
  const key = id(receiptId),
    expected = revision(input.expectedRevision);
  return withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE estock_drafts SET status='DRAFT',revision=revision+1,updated_at=now()
      WHERE id=$1 AND status='AWAITING_STAFF' AND revision=$2 RETURNING id`,
      [key, expected],
    );
    if (!result.rowCount)
      fail(
        "Receipt changed or Staff already confirmed. Refresh before correcting.",
        409,
        "STALE_DRAFT",
      );
    await client.query(
      "UPDATE estock_notifications SET resolved_at=now(),read_at=coalesce(read_at,now()) WHERE draft_id=$1 AND role='staff' AND resolved_at IS NULL",
      [key],
    );
    return { draft: await getDraft(key, client) };
  });
}

export async function confirmReceipt(receiptId: string, input: Record<string, unknown>) {
  const key = id(receiptId),
    expected = revision(input.expectedRevision);
  if (input.confirmReceived !== true) fail("Confirm that you checked the physical goods.");
  if (!Array.isArray(input.lines) || !input.lines.length || input.lines.length > 60)
    fail("Check every included receipt line.");
  type SubmittedLine =
    | { id: string; actualQuantity: number }
    | { id: string; outcome: "MATCH" | "SHORT" | "EXTRA"; difference: number | null };
  const outcomes = input.lines
    .map((entry): SubmittedLine => {
      const line = object(entry);
      if ("actualQuantity" in line) {
        if ("outcome" in line || "difference" in line)
          fail("Submit the received quantity without a difference or result.");
        return {
          id: id(line.id, "Line ID"),
          actualQuantity: integer(line.actualQuantity, "Actual received quantity", 0),
        };
      }
      if (!["MATCH", "SHORT", "EXTRA"].includes(String(line.outcome)))
        fail("Choose a valid result for every line.");
      if (line.outcome === "MATCH" && line.difference !== null && line.difference !== undefined)
        fail("Matching lines cannot have a difference.");
      return {
        id: id(line.id, "Line ID"),
        outcome: line.outcome as "MATCH" | "SHORT" | "EXTRA",
        difference: line.outcome === "MATCH" ? null : integer(line.difference, "Difference"),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  const usesActualQuantities = "actualQuantity" in outcomes[0];
  if (outcomes.some((line) => "actualQuantity" in line !== usesActualQuantities))
    fail("Use one quantity format for every receipt line.");
  if (new Set(outcomes.map((line) => line.id)).size !== outcomes.length)
    fail("Receipt lines are duplicated.");
  return withTransaction(async (client) =>
    withRequest(
      client,
      requestId(input.requestId),
      "CONFIRM_RECEIPT",
      "staff",
      { key, expected, outcomes },
      async () => {
        const locked = await client.query("SELECT * FROM estock_drafts WHERE id=$1 FOR UPDATE", [
          key,
        ]);
        const draft = locked.rows[0];
        if (!draft) fail("Receipt not found.", 404, "NOT_FOUND");
        if (draft.status !== "AWAITING_STAFF")
          fail(
            "This receipt was completed or recalled. Refresh pending checks.",
            409,
            "RECEIPT_CLOSED",
          );
        if (Number(draft.revision) !== expected)
          fail("Receipt changed. Reopen the latest check.", 409, "STALE_DRAFT");
        const receipt = await getReceipt(key, "staff", client);
        if (
          receipt.revision !== expected ||
          receipt.lines.length !== outcomes.length ||
          receipt.lines.some((line) => !outcomes.some((o) => o.id === line.id))
        )
          fail("Submit exactly the included lines from this receipt.");
        const products = new Map<string, Record<string, unknown>>();
        if (receipt.lines.some((line) => !line.productId))
          fail(
            "A receipt product was deleted. Ask Manager to correct and resend the draft.",
            409,
            "ARCHIVED_PRODUCT",
          );
        for (const productId of [...new Set(receipt.lines.map((line) => line.productId))].sort()) {
          if (!productId) fail("Receipt product is unavailable.", 409, "ARCHIVED_PRODUCT");
          const p = await client.query("SELECT * FROM estock_products WHERE id=$1 FOR UPDATE", [
            productId,
          ]);
          if (!p.rows[0] || p.rows[0].archived_at)
            fail(
              "A receipt product was deleted. Ask Manager to recall, correct and resend this receipt. No stock was added.",
              409,
              "ARCHIVED_PRODUCT",
            );
          products.set(productId, p.rows[0]);
        }
        const confirmedAt = new Date().toISOString();
        let discrepancy = false;
        for (const line of receipt.lines) {
          const submitted = outcomes.find((o) => o.id === line.id);
          if (!submitted) fail("Check every included line.");
          const actual =
            "actualQuantity" in submitted
              ? submitted.actualQuantity
              : submitted.outcome === "SHORT"
                ? line.expected - (submitted.difference || 0)
                : submitted.outcome === "EXTRA"
                  ? line.expected + (submitted.difference || 0)
                  : line.expected;
          integer(actual, "Actual received quantity", 0);
          const outcome =
            actual < line.expected ? "SHORT" : actual > line.expected ? "EXTRA" : "MATCH";
          const difference = actual === line.expected ? null : Math.abs(actual - line.expected);
          discrepancy ||= outcome !== "MATCH";
          await client.query(
            "UPDATE estock_receipt_lines SET actual_quantity=$4,outcome=$5,difference=$6 WHERE draft_id=$1 AND revision=$2 AND line_id=$3",
            [key, expected, line.id, actual, outcome, difference],
          );
          // Missing lines remain in the check, without a zero or negative Intake.
          if (actual === 0) continue;
          const p = line.productId ? products.get(line.productId) : undefined;
          if (!p) fail("Selected product is unavailable.", 409, "STALE_PRODUCT");
          const next = Number(p.stock) + actual;
          integer(next, "Resulting stock", 0);
          const raw = await client.query("SELECT * FROM estock_draft_lines WHERE id=$1", [line.id]);
          const source = raw.rows[0];
          await client.query(
            `INSERT INTO estock_movements(id,source_event_id,product_id,product_name,unit,type,quantity,delta,balance_after,
        actor_role,actor_account_id,document_date,draft_id,line_id,raw_name,raw_quantity,raw_unit,reviewed_name,created_at)
        VALUES($1,$2,$3,$4,$5,'INTAKE',$6,$6,$7,'staff','staff',$8,$9,$10,$11,$12,$13,$14,$15)`,
            [
              randomUUID(),
              `intake:${line.id}`,
              line.productId,
              line.productName,
              line.unit,
              actual,
              next,
              receipt.documentDate,
              key,
              line.id,
              source.raw_name,
              source.raw_quantity,
              source.raw_unit,
              source.reviewed_name,
              confirmedAt,
            ],
          );
          p.stock = next;
          await client.query("UPDATE estock_products SET stock=$2,updated_at=now() WHERE id=$1", [
            line.productId,
            next,
          ]);
        }
        await client.query(
          "INSERT INTO estock_receipt_checks(draft_id,revision,checked_by,checked_at) VALUES($1,$2,'staff',$3)",
          [key, expected, confirmedAt],
        );
        await client.query(
          "UPDATE estock_drafts SET status='RECEIVED',revision=revision+1,received_at=$2,checked_by='staff',actual_receipt_confirmed=true,has_discrepancies=$3,updated_at=now() WHERE id=$1",
          [key, confirmedAt, discrepancy],
        );
        await client.query(
          "UPDATE estock_notifications SET resolved_at=$2,read_at=coalesce(read_at,$2) WHERE draft_id=$1 AND role='staff' AND resolved_at IS NULL",
          [key, confirmedAt],
        );
        if (discrepancy)
          await client.query(
            "INSERT INTO estock_notifications(id,role,kind,draft_id,revision,created_at) VALUES($1,'manager','DISCREPANCY',$2,$3,$4)",
            [randomUUID(), key, expected, confirmedAt],
          );
        return { receipt: await getReceipt(key, "staff", client) };
      },
    ),
  );
}

export async function listNotifications(role: Role) {
  const db = await ready();
  const result = await db.query(
    `SELECT n.*,d.status FROM estock_notifications n JOIN estock_drafts d ON d.id=n.draft_id
    WHERE n.role=$1 ORDER BY n.created_at DESC,n.id DESC`,
    [role],
  );
  const notifications = result.rows.map((n) => ({
    id: n.id,
    kind: n.kind,
    receiptId: n.draft_id,
    revision: n.revision,
    createdAt: iso(n.created_at),
    readAt: iso(n.read_at),
    actionable: n.kind === "RECEIVING" && !n.resolved_at && n.status === "AWAITING_STAFF",
  }));
  return {
    notifications,
    unread: notifications.filter((n) => !n.readAt && (n.kind === "DISCREPANCY" || n.actionable))
      .length,
  };
}
export async function readNotification(notificationId: string, role: Role) {
  const db = await ready();
  const result = await db.query(
    "UPDATE estock_notifications SET read_at=coalesce(read_at,now()) WHERE id=$1 AND role=$2 RETURNING id",
    [id(notificationId), role],
  );
  if (!result.rowCount) fail("Notification not found.", 404, "NOT_FOUND");
  return { read: true };
}

export async function clearNotifications(role: Role): Promise<{ deletedNotifications: number }> {
  const db = await ready();
  const removed = await db.query("DELETE FROM estock_notifications WHERE role=$1", [role]);
  return { deletedNotifications: removed.rowCount || 0 };
}
