import type {
  ActionName,
  ActionResult,
  Analysis,
  ForecastRequest,
  MovementType,
  OutboxMessage,
  Policy,
  PurchaseOrder,
  Receipt,
  Recommendation,
  Role,
} from "../contracts.ts";
import { calculatePurchase } from "../purchasing.ts";
import { getDb, metadata, ORG, setMetadata, transaction } from "./db.ts";
import {
  baselineResult,
  forecastConfigIdentity,
  pollForecast,
  submitForecast,
  validateHistory,
} from "./forecast.ts";
import { importData } from "./imports.ts";
import { seedDatabase } from "./seed.ts";
import {
  audit,
  digest,
  history,
  openOrders,
  payloads,
  policy,
  postMovement,
  productRow,
  savePayload,
  savePolicy,
  state,
  stock,
  uid,
} from "./store.ts";
import {
  addDays,
  date,
  DomainError,
  fail,
  integer,
  quantity,
  requireManager,
  text,
} from "./validation.ts";

function readPolicy(input: Record<string, unknown>, precision: number, version = 1): Policy {
  const supplierId = text(input.supplierId, "Supplier");
  if (!getDb().prepare("SELECT id FROM suppliers WHERE id=? AND org_id=?").get(supplierId, ORG))
    fail("Supplier does not belong to this demo.");
  const reviewIntervalDays = integer(input.reviewIntervalDays, "Review interval", 7, 30);
  if (![7, 30].includes(reviewIntervalDays)) fail("Choose a 7-day or 30-day review interval.");
  const unitPriceSen =
    input.unitPriceSen === null
      ? null
      : integer(input.unitPriceSen, "Reference price (sen)", 0, 100000000);
  const shippingSen =
    input.shippingSen === null ? null : integer(input.shippingSen, "Shipping (sen)", 0, 100000000);
  const nextReviewDate = date(input.nextReviewDate, "Next review date");
  if (nextReviewDate > addDays(metadata("demo_date"), 30))
    fail("Next review must be within 30 days of the demo date.");
  return {
    supplierId,
    leadTimeDays: integer(input.leadTimeDays, "Lead time", 1, 14),
    reviewIntervalDays,
    safetyStock: quantity(input.safetyStock, precision, "Safety stock", true) / 1000,
    packSize: quantity(input.packSize, precision, "Pack size") / 1000,
    minimumOrder: quantity(input.minimumOrder, precision, "Minimum order", true) / 1000,
    unitPriceSen,
    shippingSen,
    maxOrderSen: integer(input.maxOrderSen, "Approval limit (sen)", 1, 1000000000),
    nextReviewDate,
    version,
  };
}

function completeReview(productId: string, decisionDate: string) {
  const p = policy(productId);
  if (p.nextReviewDate > decisionDate) return;
  while (p.nextReviewDate <= decisionDate)
    p.nextReviewDate = addDays(p.nextReviewDate, p.reviewIntervalDays);
  p.version++;
  savePolicy(productId, p);
}

function invalidate(productId: string) {
  for (const rec of payloads<Recommendation>("recommendations").filter(
    (r) =>
      r.productId === productId &&
      [
        "PENDING_APPROVAL",
        "URGENT_REVIEW",
        "MONITORING",
        "NO_ORDER_NEEDED",
        "NEEDS_DATA",
        "NEEDS_REVIEW",
        "WAITING_EXISTING_ORDER",
      ].includes(r.status),
  ))
    savePayload("recommendations", rec.id, { ...rec, status: "SUPERSEDED" }, "SUPERSEDED");
}

function snapshotIdentity(productId: string) {
  const row = productRow(productId);
  const p = policy(productId);
  return {
    ledger: Number(row.ledger_version),
    inbound: Number(row.inbound_version),
    policy: p.version,
    cutoff: metadata("closed_through"),
    decision: metadata("demo_date"),
  };
}

function startAnalysis(productId: string): string {
  const db = getDb();
  const row = productRow(productId);
  const p = policy(productId);
  const snap = snapshotIdentity(productId);
  if (addDays(snap.cutoff, 1) !== snap.decision)
    fail("Close the current day before analysing.", 409);
  if (
    db
      .prepare("SELECT id FROM stock_movements WHERE org_id=? AND product_id=? AND business_date>?")
      .get(ORG, productId, snap.cutoff)
  )
    fail(
      "Today's stock has changed. Close the day, then analyse its closing balance.",
      409,
      "CLOSE_DAY_FIRST",
    );
  const checked = validateHistory(history(productId), snap.cutoff);
  const daysUntilReview = Math.max(
    0,
    Math.round((Date.parse(p.nextReviewDate) - Date.parse(snap.decision)) / 86400000),
  );
  const horizonDays = Math.max(30, p.leadTimeDays + (daysUntilReview || p.reviewIntervalDays));
  const hash = digest({
    rules: "estock-purchasing-v1",
    org: ORG,
    productId,
    ...snap,
    days: checked.days,
    horizonDays,
    model: forecastConfigIdentity(),
  });
  const existing = db
    .prepare("SELECT id,status FROM analysis_runs WHERE org_id=? AND identity_hash=?")
    .get(ORG, hash);
  if (existing && existing.status !== "FAILED") return String(existing.id);
  if (existing)
    db.prepare("UPDATE analysis_runs SET identity_hash=? WHERE id=? AND org_id=?").run(
      `${hash}:failed:${existing.id}`,
      String(existing.id),
      ORG,
    );
  const analysisId = uid();
  const request: ForecastRequest = {
    requestId: analysisId,
    productId,
    cutoffDate: snap.cutoff,
    horizonDays,
    inputHash: digest(checked.days),
    dates: checked.days.map((d) => d.date),
    values: checked.days.map((d) => d.quantity),
    stockoutFlags: checked.days.map((d) => d.stockout),
  };
  const analysis: Analysis = {
    id: analysisId,
    productId,
    cutoffDate: snap.cutoff,
    decisionDate: snap.decision,
    status: checked.valid ? "PENDING" : "NEEDS_DATA",
    source: null,
    modelId: null,
    modelRevision: null,
    generatedAt: new Date().toISOString(),
    inputHash: request.inputHash,
    jobId: null,
    error: checked.valid ? null : checked.reason,
    forecast: null,
  };
  db.prepare("INSERT INTO analysis_runs VALUES(?,?,?,?,?,?,?,?)").run(
    analysisId,
    ORG,
    productId,
    hash,
    analysis.status,
    JSON.stringify({ ...request, snapshot: snap }),
    null,
    JSON.stringify(analysis),
  );
  invalidate(productId);
  if (!checked.valid) createRecommendation(analysis, checked.reason);
  audit(
    "system",
    "Analysis requested",
    productId,
    `${row.name}: cutoff ${snap.cutoff}. ${checked.valid ? "Pending demand estimate." : checked.reason}`,
    null,
    { analysisId },
  );
  return analysisId;
}

function createRecommendation(analysis: Analysis, dataReason?: string) {
  const p = policy(analysis.productId);
  const row = productRow(analysis.productId);
  const orders = openOrders(analysis.productId);
  const version =
    Number(
      getDb()
        .prepare(
          "SELECT COALESCE(MAX(revision),0) AS value FROM recommendations WHERE org_id=? AND product_id=?",
        )
        .get(ORG, analysis.productId)?.value,
    ) + 1;
  const calc =
    analysis.forecast?.status === "COMPLETED"
      ? calculatePurchase({
          unit: String(row.unit),
          stock: stock(analysis.productId),
          decisionDate: analysis.decisionDate,
          daily: analysis.forecast.p50,
          policy: p,
          inbound: orders.map((o) => ({
            quantity: o.remaining,
            date: o.confirmedDate || o.expectedDate,
            confirmed: ["SUPPLIER_CONFIRMED", "PARTIALLY_RECEIVED"].includes(o.status),
          })),
          hasCommitment: orders.length > 0,
        })
      : null;
  const rec: Recommendation = {
    id: uid(),
    productId: analysis.productId,
    revision: version,
    status: calc?.status || (dataReason ? "NEEDS_DATA" : "NEEDS_REVIEW"),
    cutoffDate: analysis.cutoffDate,
    decisionDate: analysis.decisionDate,
    expiresAt: `${addDays(analysis.decisionDate, 1)}T00:00:00+08:00`,
    createdAt: new Date().toISOString(),
    ledgerVersion: Number(row.ledger_version),
    inboundVersion: Number(row.inbound_version),
    policyVersion: p.version,
    analysisId: analysis.id,
    source: analysis.source,
    calculation: calc,
    reason: calc?.reason || dataReason || "Demand analysis failed. Review the error and retry.",
    warnings: [...(calc?.warnings || []), ...(analysis.forecast?.warnings || [])],
  };
  invalidate(analysis.productId);
  getDb()
    .prepare("INSERT INTO recommendations VALUES(?,?,?,?,?,?,?)")
    .run(rec.id, ORG, rec.productId, version, rec.status, analysis.id, JSON.stringify(rec));
  if (calc?.status === "NO_ORDER_NEEDED") completeReview(analysis.productId, analysis.decisionDate);
  const lastNotified = payloads<{ entityId: string; action: string; at: string }>(
    "activity_events",
  ).find((event) => event.entityId === rec.productId && event.action === "Manager review needed");
  const previousRecommendation = payloads<Recommendation>("recommendations").find(
    (r) => r.productId === rec.productId && r.id !== rec.id,
  );
  if (
    ["PENDING_APPROVAL", "URGENT_REVIEW"].includes(rec.status) &&
    (!lastNotified ||
      Date.now() - Date.parse(lastNotified.at) >= 86400000 ||
      (rec.status === "URGENT_REVIEW" &&
        previousRecommendation?.calculation?.status !== "URGENT_REVIEW"))
  )
    audit(
      "system",
      "Manager review needed",
      rec.productId,
      `${row.name}: ${calc?.suggestedQuantity} ${row.unit}. ${rec.reason}`,
      null,
      { recommendationId: rec.id, revision: rec.revision },
    );
  return rec;
}

export async function processAnalysis(id: string, poll = false) {
  const db = getDb();
  const run = db.prepare("SELECT * FROM analysis_runs WHERE id=? AND org_id=?").get(id, ORG);
  if (!run) fail("Analysis not found.", 404);
  const analysis: Analysis = JSON.parse(String(run.payload));
  if (analysis.status !== "PENDING") return;
  const input = JSON.parse(String(run.request)) as ForecastRequest & {
    snapshot: ReturnType<typeof snapshotIdentity>;
    submitted?: boolean;
  };
  if (!poll) {
    if (input.submitted || analysis.jobId) return;
    input.submitted = true;
    db.prepare("UPDATE analysis_runs SET request=? WHERE id=? AND org_id=?").run(
      JSON.stringify(input),
      id,
      ORG,
    );
  }
  if (poll && !analysis.jobId) {
    if (Date.now() - Date.parse(analysis.generatedAt) < 20000) return;
    transaction(() => {
      analysis.status = "FAILED";
      analysis.error =
        "Submission outcome is unknown after interruption. Change input or restart analysis with a new revision after review.";
      savePayload("analysis_runs", id, analysis, "FAILED");
    });
    return;
  }
  let result: Analysis["forecast"];
  let failure: string | null = null;
  try {
    result =
      poll && analysis.jobId
        ? await pollForecast(input, analysis.jobId)
        : await submitForecast(input);
    if (!result) return;
  } catch (error) {
    const invalid =
      error instanceof DomainError && ["FORECAST_INVALID", "CONFIGURATION"].includes(error.code);
    failure = invalid ? error.message : "Forecast service unavailable or timed out.";
    result =
      process.env.FORECAST_ALLOW_FALLBACK !== "false" && !invalid
        ? baselineResult(
            input,
            "BASELINE_FALLBACK",
            `${failure} Using the 28-day mean baseline, not AI inference.`,
          )
        : null;
  }
  transaction(() => {
    const latest = db
      .prepare("SELECT status FROM analysis_runs WHERE id=? AND org_id=?")
      .get(id, ORG);
    if (latest?.status !== "PENDING") return;
    analysis.status = result?.status === "PENDING" ? "PENDING" : result ? "COMPLETED" : "FAILED";
    analysis.forecast = result;
    analysis.source = result?.source || null;
    analysis.modelId = result?.modelId || null;
    analysis.modelRevision = result?.modelRevision || null;
    analysis.jobId = result?.jobId || analysis.jobId;
    analysis.error = failure;
    savePayload("analysis_runs", id, analysis, analysis.status);
    db.prepare("UPDATE analysis_runs SET result=? WHERE id=? AND org_id=?").run(
      JSON.stringify(result),
      id,
      ORG,
    );
    if (analysis.status !== "PENDING") {
      if (JSON.stringify(input.snapshot) !== JSON.stringify(snapshotIdentity(analysis.productId))) {
        audit(
          "system",
          "Analysis became stale",
          analysis.productId,
          "Inputs changed while analysis was running. Run analysis again; no recommendation was created.",
        );
        return;
      }
      createRecommendation(analysis);
      audit(
        "system",
        "Analysis finished",
        analysis.productId,
        `${analysis.status}. Source: ${analysis.source || "none"}.`,
        null,
        { analysisId: id },
      );
    }
  });
}

export function executeAction(
  role: Role,
  action: ActionName,
  input: Record<string, unknown>,
  key: string,
): { message: string; entityId?: string; preview?: ActionResult["preview"]; processId?: string } {
  seedDatabase();
  text(key, "Idempotency key", 160);
  if (input.organisationId && input.organisationId !== ORG)
    fail("Organisation access denied.", 403);
  const managers: ActionName[] = [
    "createProduct",
    "updatePolicy",
    "approve",
    "reject",
    "dispatch",
    "confirmOrder",
    "cancelOrder",
    "resolveDamage",
    "previewImport",
    "commitImport",
  ];
  if (managers.includes(action)) requireManager(role);
  return transaction(() => {
    const db = getDb();
    const inputHash = digest({ input, role });
    const previous = db.prepare("SELECT * FROM idempotency WHERE org_id=? AND key=?").get(ORG, key);
    if (previous) {
      if (previous.action !== action || previous.input_hash !== inputHash)
        fail("This request key was already used for different input.", 409);
      const result = JSON.parse(String(previous.result));
      delete result.processId;
      return result;
    }
    let message = "Saved.";
    let entityId: string | undefined;
    let preview: ActionResult["preview"];
    let processId: string | undefined;
    if (action === "createProduct") {
      const id = uid();
      const sku = text(input.sku, "SKU", 40);
      const name = text(input.name, "Product name", 100);
      const unit = text(input.unit, "Unit", 24);
      const precision = integer(input.precision, "Quantity precision", 0, 3);
      const p = readPolicy(input, precision);
      const opening = quantity(input.openingStock, precision, "Opening stock", true);
      if (db.prepare("SELECT id FROM products WHERE org_id=? AND sku=?").get(ORG, sku))
        fail("This SKU already exists.", 409);
      db.prepare("INSERT INTO products VALUES(?,?,?,?,?,?,?,0,0)").run(
        id,
        ORG,
        sku,
        name,
        unit,
        precision,
        metadata("demo_date"),
      );
      db.prepare("INSERT INTO policies VALUES(?,?,?,?,?)").run(
        id,
        ORG,
        p.supplierId,
        1,
        JSON.stringify(p),
      );
      if (input.createOpening !== false)
        postMovement({
          productId: id,
          eventKey: `opening:${id}`,
          type: "OPENING_BALANCE",
          milli: opening,
          date: metadata("demo_date"),
          reference: "Product setup",
          reason: "Initial synthetic stock",
          role,
        });
      audit(role, "Product created", id, `${name}, ${unit}.`, null, p);
      entityId = id;
      message =
        "Synthetic product created. Add complete history before recorded-data recommendations.";
    } else if (action === "updatePolicy") {
      const id = text(input.productId, "Product");
      const row = productRow(id);
      const before = policy(id);
      if (input.expectedVersion !== before.version)
        fail("Policy changed. Refresh before saving.", 409);
      const next = readPolicy(input, Number(row.precision), before.version + 1);
      savePolicy(id, next);
      invalidate(id);
      audit(
        role,
        "Purchasing policy changed",
        id,
        "Previous recommendations require a fresh analysis.",
        before,
        next,
      );
      message = "Purchasing policy saved.";
    } else if (action === "recordMovement") {
      const id = text(input.productId, "Product");
      const row = productRow(id);
      const type = input.type as MovementType;
      if (
        ![
          "SALE",
          "INTERNAL_USE",
          "DAMAGE_OR_LOSS",
          "CUSTOMER_RETURN_USABLE",
          "ADJUSTMENT_IN",
          "ADJUSTMENT_OUT",
        ].includes(type)
      )
        fail(
          "Choose a valid outgoing, return or adjustment type. Receiving requires a purchase order.",
        );
      if (["ADJUSTMENT_IN", "ADJUSTMENT_OUT"].includes(type)) requireManager(role);
      const businessDate = date(input.date);
      if (businessDate !== metadata("demo_date"))
        fail(
          "Record movements on the open demo day. Closed days are immutable; correct stock with a reasoned adjustment.",
        );
      const milli = quantity(input.quantity, Number(row.precision));
      if (input.unit !== row.unit) fail("Quantity unit does not match the product.");
      const reason =
        type === "SALE" ? String(input.reason || "") : text(input.reason, "Reason", 500);
      entityId = postMovement({
        productId: id,
        eventKey: text(input.sourceEventId, "Source event ID", 160),
        type,
        milli,
        date: businessDate,
        reference: text(input.reference, "Reference", 160),
        reason,
        role,
      });
      invalidate(id);
      message = "Stock movement saved. Close the day when all records are complete, then analyse.";
    } else if (action === "closeDay") {
      const day = date(input.date);
      if (day !== metadata("demo_date"))
        fail("This day is already closed or is not the open demo day.", 409);
      if (input.confirmComplete !== true)
        fail(
          "Confirm that sales records for every product are complete, including zero-sales days.",
        );
      for (const row of db.prepare("SELECT * FROM products WHERE org_id=?").all(ORG)) {
        db.prepare(
          "INSERT INTO daily_sales VALUES(?,?,?,0,1,?,?, 'ledger',1) ON CONFLICT(org_id,product_id,business_date) DO UPDATE SET complete=1,stockout=excluded.stockout,revision=revision+1",
        ).run(
          ORG,
          String(row.id),
          day,
          Number(
            stock(String(row.id)) === 0 ||
              input.stockoutProduct === row.id ||
              (Array.isArray(input.stockoutProductIds) &&
                input.stockoutProductIds.includes(row.id)),
          ),
          `ledger:${row.id}:${day}`,
        );
        db.prepare(
          "UPDATE products SET ledger_version=ledger_version+1 WHERE id=? AND org_id=?",
        ).run(String(row.id), ORG);
        invalidate(String(row.id));
      }
      setMetadata("closed_through", day);
      setMetadata("demo_date", addDays(day, 1));
      audit(
        role,
        "Day closed",
        ORG,
        `${day} marked complete. Demo date advanced to ${addDays(day, 1)}. Zero sales only recorded by this explicit confirmation.`,
      );
      message =
        "Day closed. Saved-history analysis has been triggered. See Needs attention for the results.";
    } else if (action === "analyse") {
      processId = startAnalysis(text(input.productId, "Product"));
      entityId = processId;
      const saved = payloads<Analysis>("analysis_runs").find(
        (analysis) => analysis.id === processId,
      );
      message =
        saved?.status === "COMPLETED"
          ? "Reusing the saved analysis for unchanged inputs. No new inference was requested."
          : "Analysis requested; source and status are shown with the result.";
    } else if (action === "pollAnalysis") {
      entityId = text(input.analysisId, "Analysis");
      if (!db.prepare("SELECT id FROM analysis_runs WHERE id=? AND org_id=?").get(entityId, ORG))
        fail("Analysis not found.", 404);
      processId = entityId;
      message = "Forecast status checked.";
    } else if (action === "approve" || action === "reject") {
      const rec = payloads<Recommendation>("recommendations").find(
        (r) => r.id === input.recommendationId,
      );
      if (!rec) fail("Recommendation not found.", 404);
      const snap = snapshotIdentity(rec.productId);
      if (
        rec.revision !== input.expectedRevision ||
        !["PENDING_APPROVAL", "URGENT_REVIEW"].includes(rec.status) ||
        rec.decisionDate !== snap.decision ||
        metadata("demo_date") >= rec.expiresAt.slice(0, 10) ||
        rec.ledgerVersion !== snap.ledger ||
        rec.inboundVersion !== snap.inbound ||
        rec.policyVersion !== snap.policy
      )
        fail(
          "This recommendation changed or expired. Analyse the latest closing stock before deciding.",
          409,
          "STALE_RECOMMENDATION",
        );
      if (openOrders(rec.productId).length)
        fail("Resolve the existing purchase commitment before approving another.", 409);
      if (action === "reject") {
        const reason = text(input.reason, "Rejection reason", 500);
        db.prepare("INSERT INTO approvals VALUES(?,?,?,?,?,?,?,?)").run(
          uid(),
          ORG,
          rec.id,
          "REJECTED",
          role,
          reason,
          JSON.stringify(rec),
          new Date().toISOString(),
        );
        rec.status = "REJECTED";
        rec.decisionReason = reason;
        savePayload("recommendations", rec.id, rec, rec.status);
        completeReview(rec.productId, rec.decisionDate);
        audit(role, "Recommendation rejected", rec.productId, reason, rec, { status: "REJECTED" });
        message = "Recommendation rejected. No purchase order created.";
      } else {
        const p = policy(rec.productId);
        const row = productRow(rec.productId);
        const calc = rec.calculation;
        if (!calc) fail("A completed calculation is required.");
        const milli = quantity(input.quantity, Number(row.precision));
        const amount = milli / 1000;
        if (milli % Math.round(p.packSize * 1000) !== 0 || amount < p.minimumOrder)
          fail(
            `Use packs of ${p.packSize} ${row.unit}, with a minimum order of ${p.minimumOrder}.`,
          );
        const reason =
          amount !== calc.suggestedQuantity
            ? text(input.reason, "Reason for changed quantity", 500)
            : String(input.reason || "Approved as recommended");
        if (p.unitPriceSen === null || p.shippingSen === null)
          fail("Reference price and shipping must be known before approval.");
        const cost = Math.round(amount * p.unitPriceSen) + p.shippingSen;
        if (cost > p.maxOrderSen)
          fail("Estimated cost exceeds the approval limit. Review the policy first.");
        if (
          (rec.warnings.length || amount < calc.suggestedQuantity) &&
          input.acknowledgeWarnings !== true
        )
          fail("Acknowledge the warnings before approval.");
        const orderId = uid();
        const order: PurchaseOrder = {
          id: orderId,
          reference: `SYN-PO-${orderId.slice(0, 8).toUpperCase()}`,
          productId: rec.productId,
          supplierId: p.supplierId,
          quantity: amount,
          remaining: amount,
          unit: String(row.unit),
          status: "APPROVED_PENDING_DISPATCH",
          expectedDate: calc.arrivalDate,
          confirmedDate: null,
          estimatedCostSen: cost,
          createdAt: new Date().toISOString(),
          recommendationId: rec.id,
          damageOpen: false,
        };
        const supplier = db
          .prepare("SELECT name FROM suppliers WHERE id=? AND org_id=?")
          .get(p.supplierId, ORG);
        const snapshot = {
          recommendation: rec,
          policy: p,
          order,
          supplier: supplier?.name,
          actor: role,
          overrideReason: reason,
        };
        db.prepare("INSERT INTO approvals VALUES(?,?,?,?,?,?,?,?)").run(
          uid(),
          ORG,
          rec.id,
          "APPROVED",
          role,
          reason,
          JSON.stringify(snapshot),
          order.createdAt,
        );
        db.prepare("INSERT INTO purchase_orders VALUES(?,?,?,?,?,?,?,?)").run(
          orderId,
          ORG,
          rec.productId,
          rec.id,
          order.status,
          milli,
          milli,
          JSON.stringify(order),
        );
        const outbox: OutboxMessage = {
          id: uid(),
          orderId,
          channel: "SIMULATED",
          status: "QUEUED",
          attempts: 0,
          createdAt: order.createdAt,
          message: `SIMULATED purchase request ${order.reference}\nSupplier: ${supplier?.name}\nProduct: ${row.name} (${row.sku})\nQuantity: ${amount} ${row.unit}, ${amount / p.packSize} packs of ${p.packSize}\nReference unit price: MYR ${(p.unitPriceSen / 100).toFixed(2)}; shipping MYR ${(p.shippingSen / 100).toFixed(2)}\nEstimated total: MYR ${(cost / 100).toFixed(2)}\nRequested arrival: ${order.expectedDate}\nPlease acknowledge quantity, price and delivery. No real supplier message is sent.`,
        };
        db.prepare("INSERT INTO outbox_messages VALUES(?,?,?,?,?)").run(
          outbox.id,
          ORG,
          orderId,
          outbox.status,
          JSON.stringify(outbox),
        );
        rec.status = "APPROVED";
        rec.decisionReason = reason;
        savePayload("recommendations", rec.id, rec, rec.status);
        bumpInbound(rec.productId);
        completeReview(rec.productId, rec.decisionDate);
        audit(
          role,
          "Purchase approved",
          rec.productId,
          `${order.reference}: ${amount} ${row.unit}. ${reason}. Physical stock unchanged.`,
          rec,
          snapshot,
        );
        entityId = orderId;
        message =
          "Approved once. One purchase order and one SIMULATED outbox message created. Stock is unchanged.";
      }
    } else if (
      ["dispatch", "confirmOrder", "receive", "cancelOrder", "resolveDamage"].includes(action)
    ) {
      const order = payloads<PurchaseOrder>("purchase_orders").find((o) => o.id === input.orderId);
      if (!order) fail("Purchase order not found.", 404);
      const before = { ...order };
      if (action === "receive") {
        const replay = db
          .prepare("SELECT * FROM receipts WHERE org_id=? AND event_key=?")
          .get(ORG, String(input.sourceEventId || ""));
        if (replay) {
          const receipt: Receipt = JSON.parse(String(replay.payload));
          if (
            receipt.orderId !== order.id ||
            receipt.usable !== input.usable ||
            receipt.damaged !== input.damaged ||
            receipt.date !== input.date ||
            receipt.reference !== input.reference ||
            input.unit !== order.unit
          )
            fail("This receipt source was already used with different details.", 409);
          return {
            message: "This receipt was already saved. Stock was not added again.",
            entityId: order.id,
          };
        }
      }
      if (action === "dispatch") {
        const outbox = payloads<OutboxMessage>("outbox_messages").find(
          (m) => m.orderId === order.id,
        );
        if (!outbox) fail("Outbox message missing.", 409);
        if (!["APPROVED_PENDING_DISPATCH", "DISPATCH_FAILED"].includes(order.status))
          fail("This message has already been dispatched or held for review.", 409);
        const rec = payloads<Recommendation>("recommendations").find(
          (r) => r.id === order.recommendationId,
        );
        if (metadata("demo_date") !== rec?.decisionDate) {
          order.status = "NEEDS_REVIEW";
          outbox.status = "HELD";
          message =
            "Dispatch held: the approved date has passed. Cancel and reanalyse before sending.";
        } else if (input.simulateFailure === true) {
          order.status = "DISPATCH_FAILED";
          outbox.status = "FAILED";
          message = "SIMULATED dispatch failure saved. Retry keeps the same order and reference.";
        } else {
          order.status = "SENT_SIMULATED";
          outbox.status = "SENT_SIMULATED";
          message =
            "Message dispatched to the persistent simulator. Supplier acknowledgement is still separate.";
        }
        outbox.attempts++;
        savePayload("outbox_messages", outbox.id, outbox, outbox.status);
      } else if (action === "confirmOrder") {
        if (!["SENT_SIMULATED", "SUPPLIER_CONFIRMED", "PARTIALLY_RECEIVED"].includes(order.status))
          fail("Dispatch the simulated request before recording a supplier acknowledgement.", 409);
        const eta = date(input.expectedDate, "Confirmed arrival");
        if (eta < metadata("demo_date")) fail("Confirmed arrival cannot be before the demo date.");
        text(input.reference, "Synthetic supplier acknowledgement", 160);
        if (input.confirmApprovedTerms !== true)
          fail(
            "Confirm that quantity and price match the approved request. Changed commercial terms require manager review.",
          );
        order.confirmedDate = eta;
        if (order.status === "SENT_SIMULATED") order.status = "SUPPLIER_CONFIRMED";
        message = "Synthetic supplier acknowledgement recorded. Stock has not changed.";
        if (eta !== order.expectedDate) {
          order.status = "NEEDS_REVIEW";
          message =
            "Supplier arrival differs from the approved request. Receiving is held for manager review. Cancel and reanalyse this commitment before replacing it; stock is unchanged.";
        }
      } else if (action === "receive") {
        if (!["SUPPLIER_CONFIRMED", "PARTIALLY_RECEIVED"].includes(order.status))
          fail("Receiving requires a supplier-confirmed active purchase order.", 409);
        const row = productRow(order.productId);
        if (input.unit !== row.unit) fail("Receipt unit does not match the product.");
        const usable = quantity(input.usable, Number(row.precision), "Usable quantity", true);
        const damaged = quantity(input.damaged, Number(row.precision), "Damaged quantity", true);
        if (usable + damaged <= 0 || usable + damaged > Math.round(order.remaining * 1000))
          fail("Total received must be positive and cannot exceed the remaining order.");
        const day = date(input.date);
        if (day !== metadata("demo_date")) fail("Receive goods on the open demo day.");
        const eventKey = text(input.sourceEventId, "Receipt source event", 160);
        const reference = text(input.reference, "Receipt evidence/reference", 160);
        if (db.prepare("SELECT id FROM receipts WHERE org_id=? AND event_key=?").get(ORG, eventKey))
          fail(
            "This receipt source event has already been recorded. No goods were added again.",
            409,
          );
        const receipt: Receipt = {
          id: uid(),
          orderId: order.id,
          productId: order.productId,
          usable: usable / 1000,
          damaged: damaged / 1000,
          date: day,
          reference,
        };
        db.prepare("INSERT INTO receipts VALUES(?,?,?,?,?,?,?)").run(
          receipt.id,
          ORG,
          order.id,
          eventKey,
          usable,
          damaged,
          JSON.stringify(receipt),
        );
        if (usable > 0)
          postMovement({
            productId: order.productId,
            eventKey: `receipt:${eventKey}`,
            type: "SUPPLIER_RECEIPT",
            milli: usable,
            date: day,
            reference,
            reason: order.reference,
            role,
          });
        order.remaining = (Math.round(order.remaining * 1000) - usable - damaged) / 1000;
        order.status = order.remaining === 0 ? "RECEIVED" : "PARTIALLY_RECEIVED";
        order.damageOpen ||= damaged > 0;
        db.prepare("UPDATE purchase_orders SET remaining_milli=? WHERE id=? AND org_id=?").run(
          Math.round(order.remaining * 1000),
          order.id,
          ORG,
        );
        message = `Received ${usable / 1000} usable and ${damaged / 1000} damaged ${order.unit}. ${order.remaining} remain.${order.damageOpen ? " Manager damage review is open." : ""}`;
      } else if (action === "cancelOrder") {
        if (["CANCELLED", "RECEIVED"].includes(order.status))
          fail("This order is already closed.", 409);
        text(input.reason, "Cancellation reason", 500);
        order.status = "CANCELLED";
        message = "Order cancellation recorded. Previous receipts and audit remain.";
      } else {
        if (!order.damageOpen) fail("There is no open damage exception.", 409);
        text(input.reason, "Damage resolution and evidence", 500);
        order.damageOpen = false;
        message = "Damage resolution recorded. No automatic replacement order or stock added.";
      }
      savePayload("purchase_orders", order.id, order, order.status);
      bumpInbound(order.productId);
      invalidate(order.productId);
      audit(
        role,
        (
          {
            dispatch: "Simulated dispatch",
            confirmOrder: "Synthetic supplier acknowledgement",
            receive: "Goods received",
            cancelOrder: "Order cancelled",
            resolveDamage: "Damage reviewed",
          } as Record<string, string>
        )[action],
        order.productId,
        `${order.reference}. ${message} ${String(input.reference || input.reason || "")}`,
        before,
        order,
      );
      entityId = order.id;
    } else if (action === "previewImport" || action === "commitImport") {
      preview = importData(input, action === "commitImport");
      if (action === "commitImport" && preview.rows > preview.duplicates) {
        for (const product of db.prepare("SELECT id FROM products WHERE org_id=?").all(ORG))
          invalidate(String(product.id));
      }
      message =
        action === "commitImport"
          ? "CSV imported atomically."
          : preview.valid
            ? "CSV is valid. Review the preview before importing."
            : "CSV has errors. No rows were written.";
    } else fail("Unknown action.", 400);
    const result = { message, entityId, preview, processId };
    db.prepare("INSERT INTO idempotency VALUES(?,?,?,?,?,?)").run(
      ORG,
      key,
      action,
      inputHash,
      JSON.stringify(result),
      new Date().toISOString(),
    );
    return result;
  });
}

function bumpInbound(productId: string) {
  getDb()
    .prepare("UPDATE products SET inbound_version=inbound_version+1 WHERE id=? AND org_id=?")
    .run(productId, ORG);
}

export async function act(
  role: Role,
  action: ActionName,
  input: Record<string, unknown>,
  key: string,
): Promise<ActionResult> {
  const result = executeAction(role, action, input, key);
  if (result.processId) await processAnalysis(result.processId, action === "pollAnalysis");
  if (action === "closeDay") {
    for (const product of state(role).products) {
      const analysisId = transaction(() => startAnalysis(product.id));
      await processAnalysis(analysisId);
    }
  }
  return {
    message: result.message,
    entityId: result.entityId,
    preview: result.preview,
    state: state(role),
  };
}
