import type {
  ActionName,
  ActionResult,
  Analysis,
  ForecastRequest,
  ForecastResult,
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
import { DEMO_SEED_VERSION, LEGACY_DEMO_SEED_VERSION, seedDatabase } from "./seed.ts";
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
  optionalText,
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

function requireOpenDay() {
  if (metadata("closed_through") >= metadata("demo_date"))
    fail("This day has ended. Select Next day to record new stock activity.", 409, "DAY_ENDED");
}

function requireDemoGeneration(input: Record<string, unknown>) {
  if (input.demoGeneration !== (metadata("demo_generation") || metadata("seed_version")))
    fail("The demo was reset. Refresh before changing its records.", 409, "DEMO_RESET");
}

function startAnalysis(productId: string): string {
  const db = getDb();
  const row = productRow(productId);
  const p = policy(productId);
  const snap = snapshotIdentity(productId);
  if (snap.cutoff !== snap.decision && addDays(snap.cutoff, 1) !== snap.decision)
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
  const provisional =
    checked.days.length > 0 &&
    checked.days.length < 28 &&
    checked.days.at(-1)?.date === snap.cutoff &&
    checked.days.every(
      (day, index, days) =>
        day.complete &&
        Number.isFinite(day.quantity) &&
        day.quantity >= 0 &&
        (index === 0 || addDays(days[index - 1].date, 1) === day.date),
    );
  const usableHistory = checked.valid || provisional;
  const dataReason =
    checked.days.length === 0
      ? "More sales history needed. End a day with complete sales records."
      : "More sales history needed. Complete the missing sales days before analysis.";
  const daysUntilReview = Math.max(
    0,
    Math.round((Date.parse(p.nextReviewDate) - Date.parse(snap.decision)) / 86400000),
  );
  const horizonDays = Math.max(30, p.leadTimeDays + (daysUntilReview || p.reviewIntervalDays));
  const hash = digest({
    rules: "estock-demo-closing-v2",
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
    status: usableHistory ? "PENDING" : "NEEDS_DATA",
    source: null,
    modelId: null,
    modelRevision: null,
    generatedAt: new Date().toISOString(),
    inputHash: request.inputHash,
    jobId: null,
    error: usableHistory ? null : dataReason,
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
  if (!usableHistory) createRecommendation(analysis, dataReason);
  audit(
    "system",
    "Analysis requested",
    productId,
    `${row.name}: cutoff ${snap.cutoff}. ${usableHistory ? "Pending demand estimate." : dataReason}`,
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
          demandStartDate: analysis.forecast.dates[0],
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
  if (calc)
    calc.warnings = calc.warnings.map((warning) =>
      warning === "Reference price or shipping cost is unknown. Complete costs before approval."
        ? "Unpriced SIMULATED order. Supplier cost is unknown; the approval limit cannot be checked."
        : warning,
    );
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
  if (calc?.status === "NO_ORDER_NEEDED") {
    completeReview(analysis.productId, analysis.decisionDate);
    rec.policyVersion = policy(analysis.productId).version;
    savePayload("recommendations", rec.id, rec, rec.status);
  }
  if (["PENDING_APPROVAL", "URGENT_REVIEW"].includes(rec.status))
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

function demoEstimate(request: ForecastRequest): ForecastResult {
  const mean = request.values.reduce((sum, value) => sum + value, 0) / request.values.length;
  return {
    status: "COMPLETED",
    source: "DEMO_ESTIMATE",
    modelId: "demo/recorded-sales-average",
    modelRevision: "available-days-v1",
    inputHash: request.inputHash,
    cutoffDate: request.cutoffDate,
    generatedAt: new Date().toISOString(),
    runtimeMs: 0,
    dates: Array.from({ length: request.horizonDays }, (_, i) =>
      addDays(request.cutoffDate, i + 1),
    ),
    p50: Array(request.horizonDays).fill(Math.round(mean * 1000) / 1000),
    evaluation: {
      completeDays: request.values.length,
      evidenceStartDate: request.dates[0],
      evidenceEndDate: request.cutoffDate,
    },
    warnings: [
      `Demo estimate: average of ${request.values.length} complete sales ${request.values.length === 1 ? "day" : "days"}. Limited history; not AI inference or a validated forecast.`,
      ...(request.stockoutFlags.some(Boolean)
        ? ["Sales on stockout days may understate demand. Lost sales are unknown."]
        : []),
    ],
  };
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
      input.values.length < 28
        ? demoEstimate(input)
        : poll && analysis.jobId
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
): {
  message: string;
  entityId?: string;
  preview?: ActionResult["preview"];
  processId?: string;
  analysisIds?: string[];
  replayed?: boolean;
  generation?: string;
} {
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
      if (
        result.generation &&
        result.generation !== (metadata("demo_generation") || metadata("seed_version"))
      )
        fail("The demo was reset. This earlier request will not be repeated.", 409, "DEMO_RESET");
      delete result.processId;
      return { ...result, replayed: true };
    }
    if (input.demoGeneration !== undefined) requireDemoGeneration(input);
    let message = "Saved.";
    let entityId: string | undefined;
    let preview: ActionResult["preview"];
    let processId: string | undefined;
    let analysisIds: string[] | undefined;
    if (action === "createProduct") {
      requireOpenDay();
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
      message = "Item added. Record sales, then select End day for a restock check.";
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
      requireOpenDay();
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
        type === "SALE"
          ? optionalText(input.reason, "Reason", 500)
          : text(input.reason, "Reason", 500);
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
      if (Number(productRow(id).ledger_version) !== Number(row.ledger_version)) {
        invalidate(id);
        message =
          "Stock movement saved. Close the day when all records are complete, then analyse.";
      } else {
        message = "This stock event was already saved. No quantity changed.";
      }
    } else if (action === "closeDay") {
      const day = date(input.date);
      if (day !== metadata("demo_date"))
        fail("This day is already closed or is not the open demo day.", 409);
      if (metadata("closed_through") >= day)
        return {
          message: "This day has already ended. The saved check is unchanged.",
          replayed: true,
        };
      if (input.confirmComplete !== true)
        fail(
          "Confirm that sales records for every product are complete, including zero-sales days.",
        );
      for (const row of db.prepare("SELECT * FROM products WHERE org_id=?").all(ORG)) {
        let balance = Number(
          db
            .prepare(
              "SELECT COALESCE(SUM(delta_milli),0) AS balance FROM stock_movements WHERE org_id=? AND product_id=? AND business_date<?",
            )
            .get(ORG, row.id, day)?.balance || 0,
        );
        let stockout = false;
        for (const movement of db
          .prepare(
            "SELECT delta_milli,type FROM stock_movements WHERE org_id=? AND product_id=? AND business_date=? ORDER BY rowid",
          )
          .all(ORG, row.id, day)) {
          balance += Number(movement.delta_milli);
          if (balance === 0 && Number(movement.delta_milli) < 0) stockout = true;
        }
        db.prepare(
          "INSERT INTO daily_sales VALUES(?,?,?,0,1,?,?, 'ledger',1) ON CONFLICT(org_id,product_id,business_date) DO UPDATE SET complete=1,stockout=excluded.stockout,revision=revision+1",
        ).run(
          ORG,
          String(row.id),
          day,
          Number(
            stockout ||
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
      audit(
        role,
        "Day closed",
        ORG,
        `${day} marked complete in Asia/Kuala_Lumpur. Missing sales for this day explicitly recorded as zero. Restock check requested; date unchanged.`,
      );
      analysisIds = db
        .prepare("SELECT id FROM products WHERE org_id=?")
        .all(ORG)
        .map((row) => startAnalysis(String(row.id)));
      message = "Day ended. Sales and restock checks saved.";
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
        const cost =
          p.unitPriceSen === null || p.shippingSen === null
            ? null
            : Math.round(amount * p.unitPriceSen) + p.shippingSen;
        if (cost !== null && cost > p.maxOrderSen)
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
          message: `SIMULATED purchase request ${order.reference}\nSupplier: ${supplier?.name}\nProduct: ${row.name} (${row.sku})\nQuantity: ${amount} ${row.unit}, ${amount / p.packSize} packs of ${p.packSize}\n${cost === null ? "UNPRICED: supplier cost is unknown. No budget check or quotation. Price confirmation required." : `Reference unit price: MYR ${((p.unitPriceSen as number) / 100).toFixed(2)}; shipping MYR ${((p.shippingSen as number) / 100).toFixed(2)}\nEstimated total: MYR ${(cost / 100).toFixed(2)}`}\nRequested arrival: ${order.expectedDate}\nPlease acknowledge quantity and delivery${cost === null ? "; price remains unknown in this demo" : ", and reference price"}. No real supplier message is sent.`,
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
        message = `SIMULATED supplier confirmation recorded. Stock has not changed.${order.estimatedCostSen === null ? " Price remains unknown." : ""}`;
        if (eta !== order.expectedDate) {
          order.status = "NEEDS_REVIEW";
          message =
            "Supplier arrival differs from the approved request. Receiving is held for manager review. Cancel and reanalyse this commitment before replacing it; stock is unchanged.";
        }
      } else if (action === "receive") {
        requireOpenDay();
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
        if (!order.confirmedDate || day < order.confirmedDate)
          fail("Receiving opens on the supplier-confirmed delivery date.", 409, "DELIVERY_NOT_DUE");
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
    const result = {
      message,
      entityId,
      preview,
      processId,
      analysisIds,
      generation: metadata("demo_generation") || metadata("seed_version"),
    };
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
  seedDatabase();
  const generation = metadata("demo_generation");
  const result = executeAction(role, action, input, key);
  if (result.processId) await processAnalysis(result.processId, action === "pollAnalysis");
  if (result.analysisIds) {
    for (const analysisId of result.analysisIds) {
      if (metadata("demo_generation") !== generation) break;
      await processAnalysis(analysisId);
    }
  }
  return {
    message:
      metadata("demo_generation") !== generation
        ? "Demo reset. The workspace is blank."
        : result.message,
    entityId: result.entityId,
    preview: result.preview,
    state: state(role),
  };
}

export async function endDemoDay(
  role: Role,
  input: Record<string, unknown>,
): Promise<ActionResult> {
  seedDatabase();
  requireDemoGeneration(input);
  const closingDate = date(input.date);
  if (closingDate <= metadata("closed_through")) {
    // Resume an unsubmitted check after an interrupted response, without starting a new run.
    const generation = metadata("demo_generation");
    for (const analysis of payloads<Analysis>("analysis_runs")) {
      if (metadata("demo_generation") !== generation) break;
      if (
        analysis.status === "PENDING" &&
        analysis.cutoffDate === closingDate &&
        analysis.decisionDate === metadata("demo_date")
      )
        await processAnalysis(analysis.id);
    }
    return {
      message: "This day has already ended. The saved check is unchanged.",
      state: state(role),
    };
  }
  if (closingDate !== metadata("demo_date")) fail("Refresh the demo before ending the day.", 409);
  if (input.confirmComplete !== true) fail("Confirm that this day's sales are complete.");
  return act(
    role,
    "closeDay",
    {
      date: closingDate,
      confirmComplete: true,
      stockoutProductIds: Array.isArray(input.stockoutProductIds) ? input.stockoutProductIds : [],
    },
    `demo-end-day:${ORG}:${metadata("demo_generation") || DEMO_SEED_VERSION}:${closingDate}`,
  );
}

export function nextDemoDay(role: Role, input: Record<string, unknown>): ActionResult {
  seedDatabase();
  requireDemoGeneration(input);
  const from = date(input.date);
  let message = "This date has already advanced. Demo records are unchanged.";
  transaction(() => {
    const current = metadata("demo_date");
    if (from < current) return;
    if (from !== current) fail("Refresh the demo before advancing the date.", 409);
    if (metadata("closed_through") < current)
      fail("Select End day before Next day.", 409, "DAY_OPEN");
    const next = addDays(current, 1);
    // Only the persistent simulator is progressed. These events never add physical stock.
    for (const order of payloads<PurchaseOrder>("purchase_orders")) {
      if (order.status !== "APPROVED_PENDING_DISPATCH") continue;
      const outbox = payloads<OutboxMessage>("outbox_messages").find(
        (item) => item.orderId === order.id,
      );
      const rec = payloads<Recommendation>("recommendations").find(
        (item) => item.id === order.recommendationId,
      );
      if (outbox?.channel !== "SIMULATED") continue;
      const before = { ...order };
      if (rec?.decisionDate !== current) {
        order.status = "NEEDS_REVIEW";
        outbox.status = "HELD";
      } else {
        order.status = "SENT_SIMULATED";
        outbox.status = "SENT_SIMULATED";
        outbox.attempts++;
      }
      savePayload("outbox_messages", outbox.id, outbox, outbox.status);
      savePayload("purchase_orders", order.id, order, order.status);
      audit(
        "system",
        "Simulated dispatch",
        order.productId,
        `${current}: ${order.reference}. SIMULATED ${outbox.status === "HELD" ? "request held: approved date expired" : "request sent; supplier confirmation is separate"}.`,
        before,
        order,
      );
    }
    setMetadata("demo_date", next);
    audit(
      role,
      "Demo date advanced",
      ORG,
      `${current} → ${next} · Asia/Kuala_Lumpur. No new end-of-day analysis.`,
      { date: current },
      { date: next },
    );
    for (const order of payloads<PurchaseOrder>("purchase_orders")) {
      if (order.status === "SENT_SIMULATED") {
        const before = { ...order };
        order.status = order.expectedDate < next ? "NEEDS_REVIEW" : "SUPPLIER_CONFIRMED";
        if (order.status === "SUPPLIER_CONFIRMED") order.confirmedDate = order.expectedDate;
        savePayload("purchase_orders", order.id, order, order.status);
        bumpInbound(order.productId);
        invalidate(order.productId);
        audit(
          "system",
          "Synthetic supplier acknowledgement",
          order.productId,
          `${next}: ${order.reference}. SIMULATED ${order.status === "NEEDS_REVIEW" ? "arrival is overdue; Manager review required" : `supplier confirmed quantity and delivery ${order.confirmedDate}`}. Stock unchanged.${order.estimatedCostSen === null ? " Price remains unknown." : ""}`,
          before,
          order,
        );
      }
      if (
        ["SUPPLIER_CONFIRMED", "PARTIALLY_RECEIVED"].includes(order.status) &&
        order.confirmedDate &&
        order.confirmedDate <= next &&
        order.remaining > 0 &&
        !getDb()
          .prepare(
            "SELECT id FROM activity_events WHERE org_id=? AND entity_id=? AND action='Delivery ready'",
          )
          .get(ORG, order.id)
      ) {
        audit(
          "system",
          "Delivery ready",
          order.id,
          `${next}: ${order.reference}. SIMULATED delivery ready. Staff must record the quantity received; stock unchanged.`,
          null,
          { orderId: order.id, productId: order.productId, date: next },
        );
      }
    }
    message = `Demo date: ${next}. Due SIMULATED supplier and delivery events saved.`;
  });
  return { message, state: state(role) };
}

export function resetDemo(role: Role, input: Record<string, unknown>, key: string): ActionResult {
  seedDatabase();
  if (input.confirmReset !== true) fail("Confirm Reset demo before continuing.");
  const requestKey = `demo-reset:${text(key, "Reset request", 128)}`;
  const inputHash = digest({ confirmReset: true, organisation: ORG });
  transaction(() => {
    const db = getDb();
    if (
      ORG !== "synthetic-estock" ||
      ![DEMO_SEED_VERSION, LEGACY_DEMO_SEED_VERSION].includes(metadata("seed_version"))
    )
      fail("Reset is available only for the original synthetic demo workspace.", 403);
    const replay = db
      .prepare("SELECT action,input_hash FROM idempotency WHERE org_id=? AND key=?")
      .get(ORG, requestKey);
    if (replay) {
      if (replay.action !== "resetDemo" || replay.input_hash !== inputHash)
        fail("This reset request has different details.", 409);
      return;
    }
    requireDemoGeneration(input);
    getDb()
      .prepare(
        "UPDATE idempotency SET result=json_set(result,'$.generation',?) WHERE org_id=? AND action<>'resetDemo'",
      )
      .run(metadata("demo_generation") || metadata("seed_version"), ORG);
    // Every deletion is restricted to this synthetic organisation; sessions and migrations remain.
    for (const table of [
      "receipts",
      "outbox_messages",
      "purchase_orders",
      "approvals",
      "recommendations",
      "analysis_runs",
      "daily_sales",
      "stock_movements",
      "policies",
      "products",
      "suppliers",
      "activity_events",
    ])
      db.prepare(`DELETE FROM ${table} WHERE org_id=?`).run(ORG);
    db.prepare(
      "DELETE FROM metadata WHERE key IN ('seed_version','demo_date','closed_through')",
    ).run();
    seedDatabase({ inTransaction: true });
    setMetadata("demo_generation", uid());
    // Retain request receipts so delayed retries cannot reapply pre-reset movements or resets.
    db.prepare("INSERT INTO idempotency VALUES(?,?,?,?,?,?)").run(
      ORG,
      requestKey,
      "resetDemo",
      inputHash,
      JSON.stringify({ message: "Demo reset." }),
      new Date().toISOString(),
    );
  });
  return { message: "Demo reset. The workspace is blank.", state: state(role) };
}
