import type { ImportPreview } from "../contracts.ts";
import { getDb, metadata, ORG } from "./db.ts";
import { postMovement, uid, audit } from "./store.ts";
import { date, fail, quantity, text } from "./validation.ts";

function parseCsv(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (c === '"') {
      if (quoted && csv[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && csv[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) fail("CSV contains an unclosed quoted field.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function importData(input: Record<string, unknown>, commit: boolean): ImportPreview {
  const csv = text(input.csv, "CSV", 500000).replace(/^\uFEFF/, "");
  const kind =
    input.type === "history"
      ? "history"
      : input.type === "opening"
        ? "opening"
        : fail("Select history or opening import.");
  const [headers, ...rows] = parseCsv(csv);
  const required =
    kind === "history"
      ? [
          "source_record_id",
          "sku",
          "business_date",
          "quantity_sold",
          "data_complete",
          "stockout_flag",
        ]
      : [
          "source_event_id",
          "sku",
          "occurred_at",
          "movement_type",
          "quantity",
          "reference",
          "reason",
        ];
  if (
    !headers ||
    required.some((h) => !headers.includes(h)) ||
    new Set(headers).size !== headers.length
  )
    fail(`Required unique CSV headers: ${required.join(",")}`);
  if (!rows.length || rows.length > 1000) fail("Import 1–1000 rows per batch.");
  const db = getDb();
  const errors: ImportPreview["errors"] = [];
  let duplicates = 0;
  const seen = new Set<string>();
  const seenDates = new Set<string>();
  const validated: {
    id: string;
    productId: string;
    day: string;
    milli: number;
    complete: number;
    stockout: number;
    reference: string;
    reason: string;
    duplicate: boolean;
    correction: boolean;
  }[] = [];
  rows.forEach((values, index) => {
    try {
      if (values.length !== headers.length)
        fail("Row has a different number of columns from the header.");
      const row = Object.fromEntries(headers.map((h, i) => [h, values[i]]));
      const p = db.prepare("SELECT * FROM products WHERE sku=? AND org_id=?").get(row.sku, ORG);
      if (!p) fail(`Unknown SKU: ${row.sku}`);
      if (row.unit && row.unit !== p.unit) fail("Unit does not match the product.");
      const id = text(
        row[kind === "history" ? "source_record_id" : "source_event_id"],
        "Source ID",
        160,
      );
      if (seen.has(id)) fail("Repeated source ID in this batch.");
      seen.add(id);
      const day = date(row[kind === "history" ? "business_date" : "occurred_at"]);
      if (day > metadata("demo_date")) fail("Future data is not operational history.");
      const rawQuantity = row[kind === "history" ? "quantity_sold" : "quantity"];
      if (!/^\d+(?:\.\d+)?$/.test(rawQuantity))
        fail("Quantity must be an explicit nonnegative decimal number. Blank is not zero.");
      const milli = quantity(Number(rawQuantity), Number(p.precision), "Quantity", true);
      let duplicate = false;
      let correction = false;
      if (kind === "history") {
        if (day >= String(p.ledger_start))
          fail(
            "History must precede the physical ledger start date. Use SALE movements from that date onward.",
          );
        if (
          !["true", "false"].includes(row.data_complete) ||
          !["true", "false"].includes(row.stockout_flag)
        )
          fail("Completeness and stockout flags must be true or false.");
        const dateKey = `${p.id}:${day}`;
        if (seenDates.has(dateKey)) fail("Repeated SKU/date in this batch.");
        seenDates.add(dateKey);
        const existing = db
          .prepare(
            "SELECT * FROM daily_sales WHERE org_id=? AND (source_id=? OR (product_id=? AND business_date=?))",
          )
          .get(ORG, `csv:${id}`, String(p.id), day);
        if (existing) {
          if (
            existing.source_id !== `csv:${id}` ||
            existing.product_id !== p.id ||
            existing.business_date !== day
          )
            fail(
              "Conflicting source ID or SKU/date. Corrections must retain the original source ID.",
            );
          if (
            existing.quantity_milli !== milli ||
            existing.complete !== Number(row.data_complete === "true") ||
            existing.stockout !== Number(row.stockout_flag === "true")
          ) {
            if (input.allowCorrections !== true)
              fail(
                "Conflicting existing history. Explicitly enable a reviewed correction with a reason.",
              );
            text(input.correctionReason, "Correction reason", 500);
            correction = true;
          } else duplicate = true;
        }
      } else {
        if (row.movement_type !== "OPENING_BALANCE" || day !== p.ledger_start)
          fail("Opening import accepts OPENING_BALANCE on the product's ledger start date only.");
        const key = `${p.id}:opening`;
        if (seenDates.has(key)) fail("Only one opening balance per product.");
        seenDates.add(key);
        const existing = db
          .prepare(
            "SELECT * FROM stock_movements WHERE org_id=? AND product_id=? AND type='OPENING_BALANCE'",
          )
          .get(ORG, String(p.id));
        if (existing) {
          if (
            existing.event_key !== `csv:${id}` ||
            existing.quantity_milli !== milli ||
            existing.business_date !== day ||
            existing.reference !== row.reference ||
            existing.reason !== row.reason
          )
            fail("An opening balance already exists. Use a reasoned adjustment instead.");
          duplicate = true;
        }
      }
      if (duplicate) duplicates++;
      validated.push({
        id,
        productId: String(p.id),
        day,
        milli,
        complete: Number(row.data_complete === "true"),
        stockout: Number(row.stockout_flag === "true"),
        reference: row.reference || "CSV opening",
        reason: row.reason || "",
        duplicate,
        correction,
      });
    } catch (error) {
      errors.push({
        row: index + 2,
        message: error instanceof Error ? error.message : "Invalid row",
      });
    }
  });
  if (commit && errors.length)
    fail(
      `Import blocked. ${errors.map((error) => `Row ${error.row}: ${error.message}`).join(" ")}`,
    );
  if (commit) {
    for (const row of validated.filter((r) => !r.duplicate)) {
      if (kind === "history") {
        if (row.correction) {
          const before = db
            .prepare("SELECT * FROM daily_sales WHERE org_id=? AND source_id=?")
            .get(ORG, `csv:${row.id}`);
          db.prepare(
            "UPDATE daily_sales SET quantity_milli=?,complete=?,stockout=?,revision=revision+1 WHERE org_id=? AND source_id=? AND product_id=? AND business_date=?",
          ).run(
            row.milli,
            row.complete,
            row.stockout,
            ORG,
            `csv:${row.id}`,
            row.productId,
            row.day,
          );
          audit(
            "manager",
            "Historical sales corrected",
            row.productId,
            String(input.correctionReason),
            before,
            row,
          );
        } else {
          db.prepare("INSERT INTO daily_sales VALUES(?,?,?,?,?,?,?,?,1)").run(
            ORG,
            row.productId,
            row.day,
            row.milli,
            row.complete,
            row.stockout,
            `csv:${row.id}`,
            "synthetic-csv",
          );
        }
        db.prepare(
          "UPDATE products SET ledger_version=ledger_version+1 WHERE id=? AND org_id=?",
        ).run(row.productId, ORG);
      } else
        postMovement({
          productId: row.productId,
          eventKey: `csv:${row.id}`,
          type: "OPENING_BALANCE",
          milli: row.milli,
          date: row.day,
          reference: row.reference,
          reason: row.reason,
          role: "manager",
        });
    }
    audit(
      "manager",
      "CSV imported",
      uid(),
      `${kind}: ${validated.length - duplicates} new rows; ${duplicates} identical rows skipped. History never posts physical stock.`,
    );
  }
  return {
    type: kind,
    rows: rows.length,
    valid: !errors.length,
    errors,
    duplicates,
    corrections: validated.filter((row) => row.correction).length,
  };
}
