"use client";

import {
  Children,
  Fragment,
  type FormEvent,
  type ReactNode,
  ViewTransition,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import type {
  ActionName,
  ActionResult,
  ActivityEvent,
  Analysis,
  AppState,
  Policy,
  Product,
  PurchaseCalculation,
  PurchaseOrder,
  Recommendation,
  Role,
} from "@/lib/contracts";
import { calculatePurchase } from "@/lib/purchasing";
import styles from "@/app/demo/demo.module.css";

const fmt = (value: number) =>
  new Intl.NumberFormat("en-MY", { maximumFractionDigits: 3 }).format(value);
const money = (sen: number | null) =>
  sen === null
    ? "Unpriced"
    : new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(sen / 100);
const day = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-MY", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${value}T00:00:00Z`))
    : "Not reached in the projection";
const source = (value: string | null) =>
  ({
    DEMO_ESTIMATE: "Demo estimate",
    MOCK_BASELINE: "Baseline estimate",
    BASELINE_FALLBACK: "Fallback baseline",
    BASELINE_SELECTED: "Evaluated baseline",
    RUNPOD: "RunPod model inference",
    CACHE: "Saved result replay",
  })[value || ""] || "No demand estimate";
const status = (value: string) =>
  ({
    PENDING_APPROVAL: "Review needed",
    URGENT_REVIEW: "Urgent: shortage needs review",
    NO_ORDER_NEEDED: "No purchase needed",
    MONITORING: "Next review scheduled",
    NEEDS_DATA: "More sales history needed",
    NEEDS_REVIEW: "Review required",
    WAITING_EXISTING_ORDER: "Resolve the existing order",
    APPROVED: "Purchase approved",
    REJECTED: "Recommendation rejected",
    SUPERSEDED: "Stock changed: analyse again",
    APPROVED_PENDING_DISPATCH: "Awaiting supplier confirmation",
    SENT_SIMULATED: "Awaiting supplier confirmation",
    SUPPLIER_CONFIRMED: "Supplier confirmed",
    PARTIALLY_RECEIVED: "Partially received",
    RECEIVED: "Received",
    CANCELLED: "Cancelled",
    DISPATCH_FAILED: "Simulated dispatch failed",
    DISPATCH_UNKNOWN: "Dispatch outcome unknown",
    SALE: "Sale",
    INTERNAL_USE: "Usage",
    DAMAGE_OR_LOSS: "Damage or loss",
    CUSTOMER_RETURN_USABLE: "Usable return",
    ADJUSTMENT_IN: "Adjustment in",
    ADJUSTMENT_OUT: "Adjustment out",
    SUPPLIER_RECEIPT: "Goods received",
    OPENING_BALANCE: "Opening balance",
    QUEUED: "Request queued",
  })[value] || value.replaceAll("_", " ").toLowerCase();

type RunAction = (
  action: ActionName,
  input: Record<string, unknown>,
  key?: string,
  quiet?: boolean,
) => Promise<ActionResult>;
const numeric = new Set([
  "openingStock",
  "precision",
  "leadTimeDays",
  "reviewIntervalDays",
  "safetyStock",
  "packSize",
  "minimumOrder",
  "unitPriceSen",
  "shippingSen",
  "maxOrderSen",
  "quantity",
  "usable",
  "damaged",
  "expectedRevision",
  "expectedVersion",
  "weeklySales",
  "stock",
]);
function values(form: HTMLFormElement) {
  const data: Record<string, unknown> = {};
  for (const [name, value] of new FormData(form))
    data[name] = numeric.has(name) ? (value === "" ? null : Number(value)) : value;
  for (const field of Array.from(form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')))
    if (field.name !== "stockoutProductIds") data[field.name] = field.checked;
  if (form.querySelector('[name="stockoutProductIds"]'))
    data.stockoutProductIds = new FormData(form).getAll("stockoutProductIds");
  return data;
}

function returnFocus(element: Element | null) {
  if (element instanceof HTMLElement && element.isConnected) element.focus();
  else document.getElementById("app-main")?.focus();
}

function activitySummary(event: ActivityEvent, unit: string, analysis?: Analysis) {
  const before =
    event.before && typeof event.before === "object"
      ? (event.before as Record<string, unknown>)
      : {};
  const after =
    event.after && typeof event.after === "object" ? (event.after as Record<string, unknown>) : {};
  if (["Stock recorded", "Usable goods added"].includes(event.action)) {
    if (typeof before.stock === "number" && typeof after.stock === "number")
      return `Stock changed from ${fmt(before.stock)} to ${fmt(after.stock)} ${unit}.`;
  }
  if (event.action === "Purchase approved" && after.order && typeof after.order === "object") {
    const order = after.order as Record<string, unknown>;
    if (typeof order.quantity === "number" && typeof order.reference === "string") {
      const suggested =
        before.calculation &&
        typeof before.calculation === "object" &&
        "suggestedQuantity" in before.calculation
          ? before.calculation.suggestedQuantity
          : null;
      return `${order.reference}: ${fmt(order.quantity)} ${unit} approved${
        typeof suggested === "number" && suggested !== order.quantity
          ? ` (suggested ${fmt(suggested)})`
          : ""
      }. ${typeof after.overrideReason === "string" ? after.overrideReason : ""}`;
    }
  }
  if (event.action === "Simulated dispatch") {
    if (after.status === "SENT_SIMULATED")
      return "SIMULATED request sent. Supplier confirmation is still needed.";
    if (after.status === "DISPATCH_FAILED") return "SIMULATED request failed. Ready to retry.";
  }
  if (
    event.action === "Synthetic supplier acknowledgement" &&
    typeof after.confirmedDate === "string"
  ) {
    return `Arrival confirmed for ${day(after.confirmedDate)}. ${
      after.status === "NEEDS_REVIEW"
        ? "Changed date: receiving is on hold."
        : "Stock is unchanged."
    }`;
  }
  if (
    event.action === "Goods received" &&
    typeof before.remaining === "number" &&
    typeof after.remaining === "number"
  ) {
    return `${fmt(Math.round((before.remaining - after.remaining) * 1000) / 1000)} ${unit} received; ${fmt(after.remaining)} remaining.${
      after.damageOpen ? " Damaged goods need manager review." : ""
    }`;
  }
  if (event.action === "Analysis requested") {
    if (analysis?.status === "NEEDS_DATA") return analysis.error || "More sales history needed.";
    if (analysis?.status === "FAILED") return "Analysis failed. Try again.";
    if (analysis?.status === "COMPLETED") return "A demand estimate was saved.";
    return "Checking complete sales records.";
  }
  if (event.action === "Analysis finished") {
    if (event.detail.startsWith("COMPLETED")) return "A demand estimate was saved.";
    if (event.detail.startsWith("FAILED")) return "Analysis failed. See the saved details.";
    if (event.detail.startsWith("NEEDS_DATA")) return "More complete sales history is needed.";
    return "Analysis status updated.";
  }
  if (event.action === "Day closed") return event.detail;
  return event.detail;
}

function activityGroups(events: ActivityEvent[]) {
  const groups = new Map<string, { event: ActivityEvent; at: string; records: ActivityEvent[] }>();
  for (const event of [...events].sort((a, b) => b.at.localeCompare(a.at))) {
    const after = event.after;
    const analysisId =
      ["Analysis requested", "Analysis finished"].includes(event.action) &&
      after &&
      typeof after === "object" &&
      "analysisId" in after &&
      typeof after.analysisId === "string"
        ? after.analysisId
        : null;
    const key = analysisId ? `analysis:${analysisId}` : event.id;
    const group = groups.get(key);
    if (group) {
      group.records.push(event);
      if (event.action === "Analysis finished") group.event = event;
    } else groups.set(key, { event, at: event.at, records: [event] });
  }
  return [...groups.values()];
}

function activityProduct(event: ActivityEvent, app: AppState) {
  const after = event.after;
  const productId =
    after && typeof after === "object" && "productId" in after ? after.productId : event.entityId;
  return app.products.find((item) => item.id === productId);
}

function reviewableSuggestion(product: Product, app: AppState) {
  const rec = product.recommendation;
  if (!rec?.calculation || !["PENDING_APPROVAL", "URGENT_REVIEW"].includes(rec.status)) return null;
  if (
    rec.decisionDate !== app.demoDate ||
    rec.ledgerVersion !== product.ledgerVersion ||
    rec.inboundVersion !== product.inboundVersion ||
    rec.policyVersion !== product.policy.version
  )
    return null;
  if (
    app.analyses.some(
      (analysis) => analysis.productId === product.id && analysis.status === "PENDING",
    )
  )
    return null;
  return app.analyses.some(
    (analysis) => analysis.id === rec.analysisId && analysis.status === "COMPLETED",
  )
    ? rec
    : null;
}

function analysisSnapshot(product: Product, app: AppState) {
  const rec = product.recommendation;
  const latest = [...app.analyses]
    .filter((analysis) => analysis.productId === product.id)
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0];
  const pending = app.analyses.find(
    (analysis) => analysis.productId === product.id && analysis.status === "PENDING",
  );
  const current = Boolean(
    rec &&
      rec.status !== "SUPERSEDED" &&
      rec.decisionDate === app.demoDate &&
      rec.ledgerVersion === product.ledgerVersion &&
      rec.inboundVersion === product.inboundVersion &&
      rec.policyVersion === product.policy.version &&
      app.analyses.some(
        (analysis) => analysis.id === rec.analysisId && analysis.status === "COMPLETED",
      ),
  );
  const intraday = app.movements.some(
    (movement) => movement.productId === product.id && movement.date > app.closedThrough,
  );
  const orderOpen = app.orders.some(
    (order) =>
      order.productId === product.id &&
      (!["RECEIVED", "CANCELLED"].includes(order.status) || order.damageOpen),
  );
  const needsData = rec?.status === "NEEDS_DATA" || latest?.status === "NEEDS_DATA";
  const stale =
    rec &&
    !current &&
    ["SUPERSEDED", "PENDING_APPROVAL", "URGENT_REVIEW", "NO_ORDER_NEEDED", "MONITORING"].includes(
      rec.status,
    );
  const calculation = current && !pending ? rec?.calculation : null;
  const shortageDate = calculation?.projections
    .slice(0, calculation.horizonDays)
    .find((projection) => projection.withOrder < 0)?.date;
  return {
    rec,
    pending,
    intraday,
    orderOpen,
    calculation,
    shortageDate,
    suggestion: !orderOpen && !intraday ? reviewableSuggestion(product, app) : null,
    label: product.purchasingSetupRequired
      ? "Purchasing setup required"
      : pending
        ? "Analysis pending"
        : intraday
          ? "Close day first"
          : orderOpen
            ? "Order in progress"
            : needsData
              ? "More sales history needed"
              : stale
                ? "Analyse again"
                : latest?.status === "FAILED"
                  ? "Analysis failed"
                  : rec
                    ? status(rec.status)
                    : "Ready for analysis",
    note: product.purchasingSetupRequired
      ? "Open inventory to save supplier terms and purchasing policy."
      : needsData
        ? "End a day with complete sales records."
        : latest?.status === "FAILED"
          ? "Try analysis again."
          : rec?.status === "REJECTED"
            ? rec.decisionReason || ""
            : shortageDate
              ? `Shortfall expected ${day(shortageDate)}.`
              : "",
  };
}

function DataTable({ label, children }: { label: string; children: ReactNode }) {
  return (
    // biome-ignore lint/a11y/noNoninteractiveTabindex: Overflowing tables need a keyboard scroll target.
    <section className={styles.tableWrap} aria-label={label} tabIndex={0}>
      <table className={styles.dataTable}>
        <caption className="sr-only">{label}</caption>
        {children}
      </table>
    </section>
  );
}

function StatusLabel({
  children,
  attention = false,
}: {
  children: ReactNode;
  attention?: boolean;
}) {
  return (
    <span className={`${styles.statusLabel} ${attention ? styles.attention : ""}`}>{children}</span>
  );
}

function orderStage(order: PurchaseOrder, app: AppState) {
  if (order.status === "SUPPLIER_CONFIRMED")
    return order.confirmedDate && order.confirmedDate <= app.demoDate
      ? "Ready to receive"
      : "Supplier confirmed · awaiting delivery";
  return status(order.status);
}

function ForecastEvidence({
  analysis,
  rec,
  unit,
}: {
  analysis: Analysis | undefined;
  rec: Recommendation;
  unit: string;
}) {
  const forecast = analysis?.forecast;
  const evaluation = forecast?.evaluation;
  const finalTest = evaluation?.finalTest;
  const scores =
    finalTest && typeof finalTest === "object"
      ? Object.entries(finalTest).filter(([, value]) => value && typeof value === "object")
      : [];
  return (
    <section className={styles.evidence} aria-label="Saved forecast evidence">
      <h3>Forecast source</h3>
      <p>
        {source(rec.source)} · Synthetic sales through {day(rec.cutoffDate)}.
      </p>
      {forecast?.source === "DEMO_ESTIMATE" && (
        <p>
          {String(evaluation?.completeDays)} complete sales{" "}
          {evaluation?.completeDays === 1 ? "day" : "days"}:{" "}
          {day(String(evaluation?.evidenceStartDate))}–{day(rec.cutoffDate)}. Average recorded
          sales; limited history, no AI inference.
        </p>
      )}
      <details>
        <summary>Method and saved evaluation</summary>
        {analysis?.modelId && forecast?.source !== "DEMO_ESTIMATE" && (
          <p>
            Method / model: {analysis.modelId}
            {analysis.modelRevision ? ` · ${analysis.modelRevision}` : ""}
          </p>
        )}
        {forecast && (
          <p>
            Saved{" "}
            {new Date(forecast.generatedAt).toLocaleString("en-MY", {
              timeZone: "Asia/Kuala_Lumpur",
            })}{" "}
            MYT{forecast.runtimeMs > 0 ? ` · ${fmt(forecast.runtimeMs)} ms` : ""}
            {forecast.device ? ` · ${forecast.device}` : ""}
          </p>
        )}
        {scores.length > 0 && (
          <>
            <h3>Saved final evaluation</h3>
            <DataTable label="Saved model and baseline final evaluation">
              <thead>
                <tr>
                  <th scope="col">Method</th>
                  <th scope="col">Average error ({unit})</th>
                  <th scope="col">Error %</th>
                  <th scope="col">Days</th>
                </tr>
              </thead>
              <tbody>
                {scores.map(([name, value]) => {
                  const score = value as Record<string, unknown>;
                  return (
                    <tr key={name}>
                      <th scope="row" data-label="Method">
                        {name === "mean28"
                          ? "28-day average"
                          : name === "seasonal7"
                            ? "7-day repeat"
                            : name === "model"
                              ? "Model"
                              : name}
                      </th>
                      <td data-label={`Average error (${unit})`}>
                        {typeof score.mae === "number" && Number.isFinite(score.mae)
                          ? fmt(score.mae)
                          : "Unavailable"}
                      </td>
                      <td data-label="Error %">
                        {typeof score.wape === "number" && Number.isFinite(score.wape)
                          ? `${fmt(score.wape * 100)}%`
                          : "Unavailable"}
                      </td>
                      <td data-label="Days">
                        {typeof score.n === "number" && Number.isFinite(score.n)
                          ? fmt(score.n)
                          : "Unavailable"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
            {typeof evaluation?.selection === "string" && <p>{evaluation.selection}</p>}
            {typeof evaluation?.excluded === "string" && <p>{evaluation.excluded}</p>}
          </>
        )}
      </details>
    </section>
  );
}

function Field({
  label,
  name,
  value,
  type = "text",
  required = true,
  step,
  min,
  max,
  help,
}: {
  label: string;
  name: string;
  value?: string | number;
  type?: string;
  required?: boolean;
  step?: number | string;
  min?: number | string;
  max?: number | string;
  help?: string;
}) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        name={name}
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        defaultValue={value}
        required={required}
        step={step}
        min={min}
        max={max}
        maxLength={type === "text" && name === "reason" ? 500 : undefined}
        aria-describedby={help ? `${id}-help` : undefined}
      />
      {help && <small id={`${id}-help`}>{help}</small>}
    </label>
  );
}
function Select({
  label,
  name,
  value,
  children,
}: {
  label: string;
  name: string;
  value?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <span>{label}</span>
      <DemoDropdown label={label} name={name} defaultValue={value}>
        {children}
      </DemoDropdown>
    </div>
  );
}

function ActionForm({
  action,
  run,
  fixed = {},
  children,
  submit,
  className = "",
  onSaved,
  submitDisabled = false,
}: {
  action: ActionName;
  run: RunAction;
  fixed?: Record<string, unknown>;
  children: ReactNode;
  submit: string;
  className?: string;
  onSaved?: (result: ActionResult) => void;
  submitDisabled?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setSaved("");
    setPending(true);
    const input = { ...values(event.currentTarget), ...fixed };
    const signature = JSON.stringify(input);
    if (attempt.current?.signature !== signature)
      attempt.current = { signature, key: crypto.randomUUID() };
    try {
      const globalFeedback = [
        "closeDay",
        "receive",
        "confirmOrder",
        "updatePolicy",
        "createProduct",
        "commitImport",
      ].includes(action);
      const result = await run(action, input, attempt.current.key, !globalFeedback);
      if (globalFeedback)
        requestAnimationFrame(() => document.querySelector<HTMLElement>(".feedback")?.focus());
      else setSaved(result.message);
      onSaved?.(result);
      if (["recordMovement", "receive"].includes(action)) form.reset();
      attempt.current = null;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Try again.");
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={send} className={`app-form ${className}`} aria-busy={pending}>
      <fieldset disabled={pending}>
        {children}
        {error && (
          <p ref={errorRef} tabIndex={-1} role="alert" className="form-error">
            {error}
          </p>
        )}
        {saved && (
          <p className="form-success" role="status">
            {saved}
          </p>
        )}
        <button className="button button-primary" type="submit" disabled={submitDisabled}>
          {pending ? "Saving…" : submit}
        </button>
      </fieldset>
    </form>
  );
}

function PolicyFields({
  p,
  state: app,
  precision = 0,
}: {
  p?: Policy;
  state: AppState;
  precision?: number;
}) {
  const step = 10 ** -precision;
  return (
    <div className="form-grid">
      <Select name="supplierId" label="Primary supplier" value={p?.supplierId}>
        {app.suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <Field
        name="leadTimeDays"
        label="Supplier lead time (days)"
        type="number"
        value={p?.leadTimeDays ?? 3}
        min={1}
        max={14}
      />
      <Select
        name="reviewIntervalDays"
        label="Review every"
        value={String(p?.reviewIntervalDays ?? 7)}
      >
        <option value="7">7 days</option>
        <option value="30">30 days (fixed interval)</option>
      </Select>
      <Field
        name="safetyStock"
        label="Safety stock (base units)"
        type="number"
        value={p?.safetyStock ?? 20}
        min={0}
        step={step}
      />
      <Field
        name="packSize"
        label="Units per purchase pack"
        type="number"
        value={p?.packSize ?? 12}
        min={step}
        step={step}
      />
      <Field
        name="minimumOrder"
        label="Minimum order (base units)"
        type="number"
        value={p?.minimumOrder ?? 12}
        min={0}
        step={step}
      />
    </div>
  );
}

function History({ product }: { product: Product }) {
  return (
    <details>
      <summary>Sales history and weekly totals</summary>
      {!product.history.length && <p>No sales history yet. Record sales, then select End day.</p>}
      <p className="subtle">
        Gross SALE quantities only. Usage and damage are not demand. Partial weeks are labelled and
        are not scaled to a full week.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Week starting Monday</th>
              <th>Sales ({product.unit})</th>
              <th>Completeness</th>
            </tr>
          </thead>
          <tbody>
            {product.weeks
              .slice(-12)
              .reverse()
              .map((week) => (
                <tr key={week.startDate}>
                  <th scope="row">{week.startDate}</th>
                  <td>{fmt(week.quantity)}</td>
                  <td>
                    {week.complete
                      ? "Complete · 7 days"
                      : `Partial · ${week.completeDays}/7 complete days`}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <details>
        <summary>Daily observations</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Sales ({product.unit})</th>
                <th>Status</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {product.history
                .slice()
                .reverse()
                .map((d) => (
                  <tr key={d.date}>
                    <th scope="row">{d.date}</th>
                    <td>{fmt(d.quantity)}</td>
                    <td>
                      {d.complete ? "Complete" : "Partial"}
                      {d.stockout ? " · stockout" : ""}
                    </td>
                    <td>{d.source}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </details>
  );
}

function Review({
  product,
  rec,
  run,
  close,
  app,
}: {
  product: Product;
  rec: Recommendation;
  run: RunAction;
  close: () => void;
  app: AppState;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const [amount, setAmount] = useState(String(rec.calculation?.suggestedQuantity ?? ""));
  const [reason, setReason] = useState("");
  const [editingQuantity, setEditingQuantity] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [ack, setAck] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const quantityHelpId = useId();
  const decisionAttempt = useRef<{ signature: string; key: string } | null>(null);
  useEffect(() => {
    if (!opener.current) opener.current = document.activeElement;
    const currentDialog = dialog.current;
    currentDialog?.showModal();
    return () => {
      currentDialog?.close();
      returnFocus(opener.current);
    };
  }, []);
  const p = product.policy;
  const analysis = app.analyses.find((item) => item.id === rec.analysisId);
  const lastWeek = [...product.weeks]
    .filter((week) => week.complete && week.endDate <= rec.cutoffDate)
    .sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
  const forecastShortage = rec.calculation?.projections
    .slice(0, rec.calculation.horizonDays)
    .find((projection) => projection.withOrder < 0);
  const incoming = app.orders.filter(
    (order) =>
      order.productId === product.id &&
      ["SUPPLIER_CONFIRMED", "PARTIALLY_RECEIVED"].includes(order.status) &&
      order.remaining > 0 &&
      order.confirmedDate,
  );
  const reviewWarnings = [
    ...rec.warnings.map((warning) =>
      forecastShortage &&
      warning.startsWith("A shortage remains before or after the proposed delivery.")
        ? `Forecast shortfall: ${fmt(Math.abs(forecastShortage.withOrder))} ${product.unit} on ${day(forecastShortage.date)}, even with this delivery. Review the timing.`
        : warning,
    ),
    ...(Number(amount) < (rec.calculation?.suggestedQuantity || 0)
      ? [
          "This is below the suggested quantity. Coverage may be insufficient; review the calculation before approving.",
        ]
      : []),
  ];
  const orderQuantity = Number(amount);
  const packMilli = Math.round(p.packSize * 1000);
  const minimumQuantity =
    Math.max(packMilli, Math.ceil(Math.round(p.minimumOrder * 1000) / packMilli) * packMilli) /
    1000;
  const scaledQuantity = orderQuantity * 10 ** product.precision;
  const validAmount =
    amount.trim() !== "" &&
    Number.isFinite(orderQuantity) &&
    orderQuantity >= minimumQuantity &&
    orderQuantity <= 1_000_000 &&
    Math.abs(scaledQuantity - Math.round(scaledQuantity)) <= 1e-7 &&
    Math.round(orderQuantity * 1000) % packMilli === 0;
  const quantityHint = `Order in multiples of ${fmt(p.packSize)} ${product.unit}; minimum ${fmt(minimumQuantity)}.`;
  const quantityError =
    orderQuantity > 1_000_000
      ? `Enter no more than ${fmt(1_000_000)} ${product.unit}.`
      : `Enter a valid multiple of ${fmt(p.packSize)} ${product.unit}, at least ${fmt(minimumQuantity)}.`;
  const total =
    p.unitPriceSen === null || p.shippingSen === null || !validAmount
      ? null
      : Math.round(Number(amount) * p.unitPriceSen) + p.shippingSen;
  async function decide(decision: "approve" | "reject") {
    if (decision === "approve" && !validAmount) {
      setError(quantityError);
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    if (
      (decision === "reject" || Number(amount) !== rec.calculation?.suggestedQuantity) &&
      !reason.trim()
    ) {
      setError("Add a reason for changing the quantity or rejecting this recommendation.");
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    setPending(true);
    setError("");
    try {
      const signature = JSON.stringify({ decision, amount, reason, ack });
      if (decisionAttempt.current?.signature !== signature)
        decisionAttempt.current = { signature, key: crypto.randomUUID() };
      await run(
        decision,
        {
          recommendationId: rec.id,
          expectedRevision: rec.revision,
          quantity: Number(amount),
          reason,
          acknowledgeWarnings: ack,
        },
        decisionAttempt.current.key,
      );
      close();
      requestAnimationFrame(() => document.querySelector<HTMLElement>(".feedback")?.focus());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record decision.");
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setPending(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className={`app-dialog ${styles.demo} ${styles.review}`}
      onCancel={(event) => {
        if (pending) event.preventDefault();
        else close();
      }}
      aria-labelledby="review-title"
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            "button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]",
          ),
        ).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <div className="dialog-top">
        <p>Manager review</p>
        <button type="button" className="button button-text" onClick={close} disabled={pending}>
          Close
        </button>
      </div>
      <h2 id="review-title">Review {product.name}</h2>
      <div className={styles.reviewBody}>
        <div>
          {rec.calculation && (
            <p className={styles.suggestionReason}>
              Cover {rec.calculation.horizonDays} days of expected sales and keep{" "}
              {fmt(rec.calculation.safetyStock)} {product.unit} in reserve.
            </p>
          )}
          <dl className="review-facts">
            <div>
              <dt>Supplier</dt>
              <dd>{app.suppliers.find((s) => s.id === p.supplierId)?.name}</dd>
            </div>
            <div>
              <dt>Stock / confirmed incoming</dt>
              <dd>
                {fmt(product.stock)} / {fmt(product.confirmedIncoming)} {product.unit}
              </dd>
            </div>
            <div>
              <dt>Forecast: next 7 days</dt>
              <dd>
                {fmt(rec.calculation?.weeklyDemand ?? 0)} {product.unit}
              </dd>
            </div>
            {lastWeek && (
              <div>
                <dt>Last complete sales week</dt>
                <dd>
                  {fmt(lastWeek.quantity)} {product.unit}
                </dd>
                <p className="subtle">
                  {day(lastWeek.startDate)} – {day(lastWeek.endDate)}
                </p>
              </div>
            )}
            <div>
              <dt>Stock coverage, without deliveries</dt>
              <dd>
                {rec.calculation?.coverageDays == null
                  ? "No demand in this estimate"
                  : `About ${fmt(rec.calculation.coverageDays)} days`}
              </dd>
            </div>
            <div>
              <dt>Supplier delivery time</dt>
              <dd>{p.leadTimeDays} days</dd>
            </div>
          </dl>
          {incoming.length > 0 && (
            <ul className={styles.incomingList} aria-label="Confirmed deliveries">
              {incoming.map((order) => (
                <li key={order.id}>
                  {order.reference}: {fmt(order.remaining)} {order.unit} confirmed for{" "}
                  {day(order.confirmedDate)}.
                </li>
              ))}
            </ul>
          )}
          {rec.calculation && (
            <details>
              <summary>Quantity calculation</summary>
              <p className="subtle">
                To cover {rec.calculation.horizonDays} days: {fmt(rec.calculation.demand)} demand +{" "}
                {fmt(rec.calculation.safetyStock)} buffer − {fmt(rec.calculation.usableStock)} in
                stock − {fmt(rec.calculation.eligibleInbound)} confirmed incoming in time ={" "}
                {fmt(rec.calculation.rawQuantity)} {product.unit} needed before pack rounding.
              </p>
            </details>
          )}
          <ForecastEvidence analysis={analysis} rec={rec} unit={product.unit} />
          <p className="subtle">
            Approval creates a PO and queues a SIMULATED request. Supplier confirmation and receipt
            follow separately; stock stays unchanged.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void decide(rejecting ? "reject" : "approve");
          }}
        >
          <fieldset disabled={pending}>
            <h3>{rejecting ? "Reject suggestion" : "Your decision"}</h3>
            {!rejecting && (
              <div className={styles.decisionSummary}>
                <strong>
                  {validAmount ? fmt(Number(amount)) : "N/A"} {product.unit}
                </strong>
                <p>Order {day(rec.calculation?.orderDate || null)}</p>
                <p>Expected delivery {day(rec.calculation?.arrivalDate || null)}</p>
              </div>
            )}
            {editingQuantity && !rejecting && (
              <label className="field">
                Quantity ({product.unit})
                <input
                  type="number"
                  inputMode={product.precision === 0 ? "numeric" : "decimal"}
                  min={minimumQuantity}
                  max={1_000_000}
                  step={p.packSize}
                  value={amount}
                  aria-invalid={!validAmount}
                  aria-describedby={quantityHelpId}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setAck(false);
                  }}
                  required
                />
                <small id={quantityHelpId} className={!validAmount ? "form-error" : undefined}>
                  {validAmount ? quantityHint : quantityError}
                </small>
              </label>
            )}
            {(editingQuantity || rejecting) && (
              <label className="field">
                {rejecting ? "Reason for rejecting" : "Reason for changing quantity"}
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  required={rejecting || Number(amount) !== rec.calculation?.suggestedQuantity}
                />
              </label>
            )}
            {!rejecting && reviewWarnings.length > 0 && (
              <div className="warning">
                <ul>
                  {reviewWarnings.map((w) => (
                    <li key={w}>
                      {w ===
                      "MOCK adapter: saved-history baseline calculation on this server. No AI inference."
                        ? "Calculated from saved sales using a baseline. No AI inference."
                        : w}
                    </li>
                  ))}
                </ul>
                <label className="check-field">
                  <input
                    type="checkbox"
                    checked={ack}
                    required
                    onChange={(e) => setAck(e.target.checked)}
                  />
                  I have reviewed these warnings and the estimate source.
                </label>
              </div>
            )}
            {error && (
              <p ref={errorRef} tabIndex={-1} className="form-error" role="alert">
                {error}
              </p>
            )}
            {!rejecting && total !== null && total > p.maxOrderSen && (
              <p className="warning">
                The total exceeds the approval limit. Reduce the quantity or review the purchasing
                policy.
              </p>
            )}
            <div className="form-actions">
              <button
                type="submit"
                className={`button ${rejecting ? styles.dangerButton : "button-primary"}`}
                disabled={!rejecting && (!validAmount || (total !== null && total > p.maxOrderSen))}
              >
                {pending ? "Recording…" : rejecting ? "Reject suggestion" : "Approve & place order"}
              </button>
              {!rejecting && (
                <button
                  type="button"
                  className="button button-text"
                  aria-pressed={editingQuantity}
                  onClick={() => {
                    setEditingQuantity(!editingQuantity);
                    setAmount(String(rec.calculation?.suggestedQuantity ?? ""));
                    setReason("");
                    setAck(false);
                  }}
                >
                  {editingQuantity ? "Use suggested quantity" : "Change quantity"}
                </button>
              )}
              <button
                type="button"
                className="button button-text"
                onClick={() => {
                  setRejecting(!rejecting);
                  setReason("");
                  setError("");
                }}
              >
                {rejecting ? "Back to approval" : "Reject"}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </dialog>
  );
}

function AddItemDialog({
  app,
  run,
  openNextDay,
  close,
  saved,
}: {
  app: AppState;
  run: RunAction;
  openNextDay: () => Promise<boolean>;
  close: () => void;
  saved: (id: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const [unit, setUnit] = useState("units");
  const [precision, setPrecision] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);
  const dayEnded = app.closedThrough >= app.demoDate;
  useEffect(() => {
    opener.current = document.activeElement;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      returnFocus(opener.current);
    };
  }, []);
  useEffect(() => {
    if (!dayEnded) dialog.current?.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
  }, [dayEnded]);
  return (
    <dialog
      ref={dialog}
      className={`app-dialog ${styles.demo} ${styles.itemDialog}`}
      aria-labelledby="add-item-title"
      onCancel={(event) => {
        if (pending) event.preventDefault();
        else close();
      }}
    >
      <div className="dialog-top">
        <h2 id="add-item-title">Add Item</h2>
        <button type="button" className="button button-text" disabled={pending} onClick={close}>
          Cancel
        </button>
      </div>
      {dayEnded ? (
        <div>
          <p>This day has ended. Open the next day to add an item.</p>
          {error && (
            <p ref={errorRef} className="form-error" role="alert" tabIndex={-1}>
              {error}
            </p>
          )}
          <div className="form-actions">
            <button
              type="button"
              className="button button-primary"
              disabled={pending}
              onClick={async () => {
                setPending(true);
                setError("");
                try {
                  if (!(await openNextDay())) {
                    setError("Could not open the next day. Try again.");
                    requestAnimationFrame(() => errorRef.current?.focus());
                  }
                } finally {
                  setPending(false);
                }
              }}
            >
              {pending ? "Opening…" : "Next day"}
            </button>
          </div>
        </div>
      ) : (
        <form
          className="app-form"
          aria-busy={pending}
          onSubmit={async (event) => {
            event.preventDefault();
            if (pending) return;
            const fields = values(event.currentTarget);
            const signature = JSON.stringify(fields);
            if (attempt.current?.signature !== signature) {
              const key = crypto.randomUUID();
              attempt.current = { signature, key };
            }
            setPending(true);
            setError("");
            try {
              const result = await run(
                "createProduct",
                {
                  ...fields,
                  unit: unit.trim() || "units",
                  precision,
                },
                attempt.current.key,
              );
              if (result.entityId) saved(result.entityId);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not add the item.");
              requestAnimationFrame(() => errorRef.current?.focus());
            } finally {
              setPending(false);
            }
          }}
        >
          <fieldset disabled={pending}>
            <Field label="Item name" name="name" />
            <Field
              label="SKU (optional)"
              name="sku"
              required={false}
              help="Leave blank to generate a unique demo code, e.g. DEMO-0001. Manual codes can use up to 40 characters."
            />
            <div className="form-grid">
              <Field
                label="Starting quantity"
                name="openingStock"
                type="number"
                value={0}
                min={0}
                step={10 ** -precision}
              />
              <label className="field">
                Unit
                <input
                  name="unit"
                  value={unit}
                  onChange={(event) => {
                    setUnit(event.target.value);
                    if (event.target.value.trim().toLowerCase() === "units") setPrecision(0);
                  }}
                  maxLength={24}
                  required
                />
              </label>
            </div>
            <label className="field">
              Quantity precision
              <select
                value={precision}
                onChange={(event) => setPrecision(Number(event.target.value))}
              >
                <option value={0}>Whole units</option>
                {unit.trim().toLowerCase() !== "units" && (
                  <>
                    <option value={1}>1 decimal place</option>
                    <option value={2}>2 decimal places</option>
                    <option value={3}>3 decimal places</option>
                  </>
                )}
              </select>
            </label>
            <Field
              label="Opening date"
              name="openingDate"
              type="date"
              value={app.demoDate}
              min={app.demoDate}
              max={app.demoDate}
              help="Opening stock is recorded on the open inventory day."
            />
            <p className="subtle">
              Purchasing setup required after saving. A manager configures supplier terms and buying
              rules separately. You can record sales immediately.
            </p>
            {error && (
              <p ref={errorRef} className="form-error" role="alert" tabIndex={-1}>
                {error}
              </p>
            )}
            <button type="submit" className="button button-primary">
              {pending ? "Adding…" : "Add Item"}
            </button>
          </fieldset>
        </form>
      )}
    </dialog>
  );
}

function HistoryImport({ app, run }: { app: AppState; run: RunAction }) {
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<ActionResult["preview"]>();
  const [confirmed, setConfirmed] = useState(false);
  const [corrections, setCorrections] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const feedback = useRef<HTMLDivElement>(null);
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const input = { type: "history", csv, allowCorrections: corrections, correctionReason: reason };
  function changed() {
    setPreview(undefined);
    setConfirmed(false);
    setMessage("");
    setError("");
  }
  async function send(commit: boolean) {
    if (pending) return;
    if (commit && (!preview?.valid || !confirmed)) return;
    setPending(true);
    setError("");
    setMessage("");
    const signature = JSON.stringify(input);
    if (attempt.current?.signature !== signature)
      attempt.current = { signature, key: crypto.randomUUID() };
    try {
      const result = await run(
        commit ? "commitImport" : "previewImport",
        input,
        commit ? attempt.current.key : crypto.randomUUID(),
        true,
      );
      setPreview(result.preview);
      if (commit) {
        setMessage(result.message);
        setConfirmed(false);
        attempt.current = null;
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not import history. Check the CSV and try again.",
      );
    } finally {
      setPending(false);
      requestAnimationFrame(() => feedback.current?.focus());
    }
  }
  return (
    <details className="workspace-details">
      <summary>Import sales history</summary>
      <p>
        Manager import of synthetic daily sales before each item's ledger start date. This does not
        change physical stock. Missing days remain unknown.
      </p>
      <p className="subtle">
        Required columns: source_record_id, sku, business_date, quantity_sold, data_complete,
        stockout_flag. Quantities use the item's base unit and precision. Use true or false for both
        flags. Maximum 1,000 rows.
      </p>
      <a href="/fixtures/history-template.csv" download>
        Download CSV template
      </a>
      <p className="subtle">
        Replace the example SKU and date with your inventory's SKU and a date before its opening
        date ({app.products[0]?.ledgerStartDate}). Keep source IDs stable when reimporting.
      </p>
      <form
        className="app-form"
        aria-busy={pending}
        onSubmit={(event) => {
          event.preventDefault();
          void send(false);
        }}
      >
        <fieldset disabled={pending}>
          <label className="field">
            CSV file
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                changed();
                if (!file) return;
                if (file.size > 500000) {
                  setError("Choose a CSV file smaller than 500 KB.");
                  return;
                }
                try {
                  setCsv(await file.text());
                } catch {
                  setError("Could not read this file. Paste the CSV below instead.");
                }
              }}
            />
          </label>
          <label className="field">
            CSV content
            <textarea
              rows={7}
              value={csv}
              required
              maxLength={500000}
              onChange={(event) => {
                setCsv(event.target.value);
                changed();
              }}
            />
          </label>
          <details>
            <summary>Correct previously imported history</summary>
            <label className="check">
              <input
                type="checkbox"
                checked={corrections}
                onChange={(event) => {
                  setCorrections(event.target.checked);
                  changed();
                }}
              />{" "}
              Enable reviewed corrections
            </label>
            {corrections && (
              <label className="field">
                Correction reason
                <input
                  value={reason}
                  required
                  maxLength={500}
                  onChange={(event) => {
                    setReason(event.target.value);
                    changed();
                  }}
                />
              </label>
            )}
            <p className="subtle">
              Corrections retain the original source ID, SKU and date. The previous values and
              reason remain in the audit log.
            </p>
          </details>
          <button type="submit" className="button button-outline">
            {pending ? "Checking…" : "Preview import"}
          </button>
        </fieldset>
      </form>
      <div ref={feedback} tabIndex={-1}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="form-success" role="status">
            {message}
          </p>
        )}
        {preview && (
          <>
            <p role="status">
              {preview.rows} rows checked. {preview.duplicates} duplicate rows skipped.{" "}
              {preview.corrections} corrections. {preview.errors.length} errors.
            </p>
            {preview.errors.length > 0 && (
              <ul role="alert">
                {preview.errors.map((item) => (
                  <li key={item.row}>
                    Row {item.row}: {item.message}
                  </li>
                ))}
              </ul>
            )}
            {preview.valid && (
              <>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    disabled={pending}
                    onChange={(event) => setConfirmed(event.target.checked)}
                  />{" "}
                  I reviewed these synthetic records and confirm this import.
                </label>
                <button
                  type="button"
                  className="button button-primary"
                  disabled={!confirmed || pending}
                  onClick={() => void send(true)}
                >
                  {pending ? "Importing…" : "Confirm history import"}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </details>
  );
}

function ResetDemoDialog({
  reset,
  close,
}: {
  reset: (key: string) => Promise<void>;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const requestId = useRef<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    opener.current = document.activeElement;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      returnFocus(opener.current);
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`app-dialog ${styles.demo} ${styles.resetDialog}`}
      aria-labelledby="reset-demo-title"
      onCancel={(event) => {
        if (pending) event.preventDefault();
        else close();
      }}
    >
      <h2 id="reset-demo-title">Reset demo?</h2>
      <p>
        Clear all demo items, stock records, orders and activity? Both roles will return to a blank
        workspace and the initial demo date. Real workspace data is not affected.
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (pending) return;
          setPending(true);
          setError("");
          requestId.current ??= crypto.randomUUID();
          try {
            await reset(requestId.current);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not reset the demo. Try again.");
            setPending(false);
            requestAnimationFrame(() => errorRef.current?.focus());
          }
        }}
      >
        {error && (
          <p ref={errorRef} className="form-error" role="alert" tabIndex={-1}>
            {error}
          </p>
        )}
        <div className="form-actions">
          <button
            type="button"
            className="button button-outline"
            onClick={close}
            disabled={pending}
          >
            Cancel
          </button>
          <button type="submit" className={`button ${styles.dangerButton}`} disabled={pending}>
            {pending ? "Resetting…" : "Reset demo"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

const demoRoles: { value: Role; label: string }[] = [
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Staff" },
];

type DropdownChoice = { value: string; label: string; disabled: boolean };

function dropdownChoices(children: ReactNode): DropdownChoice[] {
  const result: DropdownChoice[] = [];
  Children.forEach(children, (child) => {
    if (
      !isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>(child)
    )
      return;
    if (child.type === Fragment) result.push(...dropdownChoices(child.props.children));
    else if (child.type === "option") {
      const label = Children.toArray(child.props.children)
        .filter((part) => typeof part === "string" || typeof part === "number")
        .join("");
      result.push({
        value: String(child.props.value ?? label),
        label,
        disabled: child.props.disabled === true,
      });
    }
  });
  return result;
}

function DemoDropdown({
  label,
  name,
  value,
  defaultValue,
  disabled = false,
  onValueChange,
  children,
}: {
  label: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}) {
  const choices = dropdownChoices(children);
  const [selected, setSelected] = useState(() => defaultValue ?? choices[0]?.value ?? "");
  const currentValue = value ?? selected;
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState({ side: "bottom", height: 280 });
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const options = useRef<(HTMLButtonElement | null)[]>([]);
  const typed = useRef({ text: "", at: 0 });
  const id = useId();
  const unavailable = disabled || !choices.some((choice) => !choice.disabled);
  const choiceCount = choices.length;
  const selectedIndex = choices.findIndex(
    (choice) => choice.value === currentValue && !choice.disabled,
  );
  const initialFocusIndex =
    selectedIndex >= 0 ? selectedIndex : choices.findIndex((choice) => !choice.disabled);
  const resetValue = defaultValue ?? choices[0]?.value ?? "";
  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }
  function focusOption(index: number) {
    const element = options.current[index];
    if (!element) return;
    element.focus({ preventScroll: true });
    if (list.current)
      list.current.scrollTop = Math.max(
        0,
        element.offsetTop - list.current.clientHeight / 2 + element.offsetHeight / 2,
      );
  }
  useLayoutEffect(() => {
    if (!open || unavailable) return;
    const bounds = trigger.current?.getBoundingClientRect();
    const dialogBounds = trigger.current?.closest("dialog")?.getBoundingClientRect();
    if (bounds) {
      const below =
        Math.min(window.innerHeight, dialogBounds?.bottom ?? window.innerHeight) -
        bounds.bottom -
        10;
      const above = bounds.top - Math.max(0, dialogBounds?.top ?? 0) - 10;
      const side = below < Math.min(280, choiceCount * 46 + 14) && above > below ? "top" : "bottom";
      setPlacement({ side, height: Math.min(280, Math.max(80, side === "top" ? above : below)) });
    }
    typed.current = { text: "", at: 0 };
    const element = options.current[initialFocusIndex];
    element?.focus({ preventScroll: true });
    if (element && list.current)
      list.current.scrollTop = Math.max(
        0,
        element.offsetTop - list.current.clientHeight / 2 + element.offsetHeight / 2,
      );
  }, [open, unavailable, initialFocusIndex, choiceCount]);
  useEffect(() => {
    const form = root.current?.closest("form");
    const reset = () => {
      setSelected(resetValue);
      setOpen(false);
    };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [resetValue]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const scroll = (event: Event) => {
      if (event.target instanceof Node && !list.current?.contains(event.target)) setOpen(false);
    };
    const resize = () => setOpen(false);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    window.addEventListener("scroll", scroll, true);
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      window.removeEventListener("scroll", scroll, true);
      window.removeEventListener("resize", resize);
    };
  }, [open]);
  const active = choices.find((choice) => choice.value === currentValue);
  return (
    <div ref={root} className={styles.dropdown}>
      {name && <input type="hidden" name={name} value={currentValue} disabled={unavailable} />}
      <button
        ref={trigger}
        type="button"
        className={styles.dropdownTrigger}
        disabled={unavailable}
        id={`${id}-trigger`}
        aria-label={`${label}: ${active?.label || "Choose an option"}`}
        aria-haspopup="listbox"
        aria-expanded={open && !unavailable}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            setOpen(true);
          } else if (event.key === "Escape") close();
        }}
      >
        <span>{active?.label || "Choose an option"}</span>
        <svg
          className={styles.dropdownChevron}
          data-open={open && !unavailable}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div
        ref={list}
        id={id}
        className={styles.dropdownMenu}
        role="listbox"
        aria-label={label}
        data-open={open && !unavailable}
        data-side={placement.side}
        style={{ maxHeight: placement.height }}
        aria-hidden={!open || unavailable}
        inert={!open || unavailable}
        onKeyDown={(event) => {
          const focused = document.activeElement;
          const current =
            focused instanceof HTMLButtonElement ? options.current.indexOf(focused) : -1;
          const enabled = choices.flatMap((choice, index) => (choice.disabled ? [] : [index]));
          let next: number;
          if (event.key === "ArrowDown")
            next = enabled[(enabled.indexOf(current) + 1) % enabled.length];
          else if (event.key === "ArrowUp")
            next = enabled[(enabled.indexOf(current) - 1 + enabled.length) % enabled.length];
          else if (event.key === "Home") next = enabled[0];
          else if (event.key === "End") next = enabled[enabled.length - 1];
          else if (event.key === "Escape" || event.key === "Tab") {
            if (event.key === "Escape") event.preventDefault();
            close(true);
            return;
          } else if (
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey &&
            event.key !== " "
          ) {
            const now = Date.now();
            const search =
              now - typed.current.at < 700
                ? typed.current.text + event.key.toLowerCase()
                : event.key.toLowerCase();
            typed.current = { text: search, at: now };
            const ordered = [
              ...enabled.filter((index) => index > current),
              ...enabled.filter((index) => index <= current),
            ];
            const found =
              ordered.find((index) => choices[index].label.toLowerCase().startsWith(search)) ??
              ordered.find((index) =>
                choices[index].label.toLowerCase().startsWith(event.key.toLowerCase()),
              );
            if (found === undefined) return;
            next = found;
          } else return;
          event.preventDefault();
          if (next !== undefined) focusOption(next);
        }}
      >
        {choices.map((choice, index) => (
          <button
            key={choice.value}
            ref={(element) => {
              options.current[index] = element;
            }}
            type="button"
            role="option"
            className={styles.dropdownOption}
            aria-selected={currentValue === choice.value}
            tabIndex={-1}
            disabled={unavailable || choice.disabled}
            onClick={() => {
              setSelected(choice.value);
              close(true);
              if (choice.value !== currentValue) onValueChange?.(choice.value);
            }}
          >
            {choice.label}
            {currentValue === choice.value && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function DemoRoleSwitcher({
  value,
  disabled,
  choose,
}: {
  value: Role;
  disabled: boolean;
  choose: (role: Role) => void;
}) {
  return (
    <div className={styles.roleArea}>
      <span className={styles.roleCaption}>Demo role</span>
      <DemoDropdown
        label="Demo role"
        value={value}
        disabled={disabled}
        onValueChange={(role) => choose(role as Role)}
      >
        {demoRoles.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </DemoDropdown>
    </div>
  );
}

export function DemoApp() {
  const [app, setApp] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSession, setNeedsSession] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [view, setView] = useState("stock");
  const [selectedId, setSelectedId] = useState("product-cartons");
  const [review, setReview] = useState<{ product: Product; rec: Recommendation } | null>(null);
  const [busy, setBusy] = useState(false);
  const [inFlight, setInFlight] = useState(0);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [screenPending, startScreenTransition] = useTransition();
  const [screenMotion, setScreenMotion] = useState<"page" | "role">("page");
  const [controlPending, setControlPending] = useState<"reset" | "endDay" | "nextDay" | null>(null);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetRevision, setResetRevision] = useState(0);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [orderProductId, setOrderProductId] = useState<string | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      let r = await fetch("/api/demo", { cache: "no-store", signal });
      if (r.status === 401) {
        const session = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "manager" }),
          signal,
        });
        if (signal?.aborted) return;
        if (session.status === 403) {
          setNeedsSession(true);
          return;
        }
        if (!session.ok) {
          const result = await session.json();
          throw new Error(result.error || "Could not open the demo.");
        }
        r = await fetch("/api/demo", { cache: "no-store", signal });
      }
      const data = await r.json();
      if (signal?.aborted) return;
      if (!r.ok) throw new Error(data.error);
      setApp(data);
      setNeedsSession(false);
      setError("");
    } catch (e) {
      if (signal?.aborted) return;
      setError(e instanceof Error ? e.message : "Could not load stock records.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => {
    const scroll = () => setHeaderScrolled(window.scrollY > 16);
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);
  useEffect(() => {
    if (!navigationOpen) return;
    const keyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        event.target instanceof Node &&
        menuButton.current?.closest("header")?.contains(event.target)
      ) {
        event.preventDefault();
        setNavigationOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", keyDown);
    return () => document.removeEventListener("keydown", keyDown);
  }, [navigationOpen]);
  async function run(
    action: ActionName,
    input: Record<string, unknown>,
    key = crypto.randomUUID(),
    quiet = false,
  ): Promise<ActionResult> {
    setInFlight((count) => count + 1);
    if (action === "closeDay") setControlPending("endDay");
    try {
      const r = await fetch(action === "closeDay" ? "/api/demo/controls" : "/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action === "closeDay" ? "endDay" : action,
          input: { ...input, demoGeneration: app?.demoGeneration },
          key,
        }),
      });
      const result = await r.json();
      if (!r.ok) {
        if (r.status === 401) setNeedsSession(true);
        throw new Error(result.error || "Could not save.");
      }
      result.message = String(result.message)
        .replaceAll("Needs attention", "Replenishment")
        .replaceAll("Stock records", "Inventory");
      if (action === "recordMovement" && result.message.startsWith("Stock movement saved.")) {
        const changed = result.state.products.find((item: Product) => item.id === input.productId);
        if (changed)
          result.message = `${changed.name}: ${fmt(changed.stock)} ${changed.unit} in stock.`;
      }
      if (action === "closeDay" && result.state.closedThrough >= String(input.date)) {
        const suggestions = result.state.products.filter((item: Product) =>
          reviewableSuggestion(item, result.state),
        ).length;
        result.message =
          result.state.role === "manager"
            ? `Day ended. ${suggestions ? `${suggestions} restock ${suggestions === 1 ? "suggestion" : "suggestions"} ready for review.` : result.state.products.some((item: Product) => item.recommendation?.status === "NEEDS_DATA") ? "More sales history needed. See Replenishment." : result.state.analyses.some((item: Analysis) => item.status === "PENDING") ? "Analysis in progress. Check Replenishment." : result.state.products.every((item: Product) => ["NO_ORDER_NEEDED", "MONITORING"].includes(item.recommendation?.status || "")) ? "No order needed." : "See Replenishment for the saved check."}`
            : "Day ended. Sales saved for Manager review.";
      }
      setApp(result.state);
      setFeedback(quiet ? "" : result.message);
      return result;
    } finally {
      setInFlight((count) => count - 1);
      if (action === "closeDay") setControlPending(null);
    }
  }
  async function finishDay() {
    if (!app || controlPending || inFlight > 0) return;
    setError("");
    try {
      await run("closeDay", { date: app.demoDate, confirmComplete: true });
      requestAnimationFrame(() => document.querySelector<HTMLElement>(".feedback")?.focus());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not end the day. Try again.");
    }
  }
  async function advanceDay() {
    if (!app || controlPending || inFlight > 0 || app.closedThrough < app.demoDate) return false;
    setControlPending("nextDay");
    setInFlight((count) => count + 1);
    setError("");
    try {
      const response = await fetch("/api/demo/controls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "nextDay",
          input: { date: app.demoDate, demoGeneration: app.demoGeneration },
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) setNeedsSession(true);
        throw new Error(result.error || "Could not advance the date.");
      }
      setApp(result.state);
      setFeedback(result.message);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not advance the date. Try again.");
      return false;
    } finally {
      setControlPending(null);
      setInFlight((count) => count - 1);
    }
  }
  async function restoreDemo(key: string) {
    setControlPending("reset");
    setInFlight((count) => count + 1);
    try {
      const response = await fetch("/api/demo/controls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset",
          input: { confirmReset: true, demoGeneration: app?.demoGeneration },
          key,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          setNeedsSession(true);
          setResetOpen(false);
          setError(result.error);
        }
        throw new Error(result.error || "Could not reset the demo.");
      }
      startScreenTransition(() => {
        setScreenMotion("page");
        setApp(result.state);
        setView("stock");
        setSelectedId(result.state.products[0]?.id || "");
        setReview(null);
        setAddItemOpen(false);
        setOrderProductId(null);
        setNavigationOpen(false);
        setError("");
        setFeedback(result.message);
        setResetOpen(false);
        setResetRevision((value) => value + 1);
      });
    } finally {
      setControlPending(null);
      setInFlight((count) => count - 1);
    }
  }
  async function quick(action: ActionName, input: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      await run(action, input);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = values(event.currentTarget);
    await chooseRole("manager", String(data.accessCode || ""));
  }
  async function chooseRole(role: Role, accessCode = "") {
    setPendingRole(role);
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, accessCode }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error);
      const response = await fetch("/api/demo", { cache: "no-store" });
      const nextState = await response.json();
      if (!response.ok) throw new Error(nextState.error || "Could not load this role.");
      startScreenTransition(() => {
        setScreenMotion("role");
        setApp(nextState);
        setNeedsSession(false);
        setReview(null);
        setFeedback("");
        setView((current) =>
          nextState.role === "staff" && !["stock", "orders"].includes(current) ? "stock" : current,
        );
        setNavigationOpen(false);
        setOrderProductId(null);
        setPendingRole(null);
        setBusy(false);
      });
    } catch (e) {
      setNeedsSession(true);
      setError(e instanceof Error ? e.message : "Could not choose role.");
      setPendingRole(null);
      setBusy(false);
    }
  }
  const product = app?.products.find((p) => p.id === selectedId) || app?.products[0];
  const navigation =
    app?.role === "staff"
      ? [
          ["stock", "Inventory"],
          ["orders", "Purchase orders"],
        ]
      : [
          ["stock", "Inventory"],
          ["today", "Replenishment"],
          ["orders", "Purchase orders"],
          ["activity", "Activity"],
        ];
  function showView(next: string, productFilter: string | null = null) {
    startScreenTransition(() => {
      setScreenMotion("page");
      setView(next);
      setNavigationOpen(false);
      setOrderProductId(productFilter);
      setError("");
      setFeedback("");
    });
  }
  const activeView = app?.role === "staff" && !["stock", "orders"].includes(view) ? "stock" : view;
  const activeRole = app && !needsSession ? app.role : null;
  const screenKey = `${needsSession ? "session" : app?.role || "loading"}:${activeView}:${resetRevision}`;
  useLayoutEffect(() => {
    if (!activeRole) return;
    window.scrollTo({ top: 0, behavior: "instant" });
    document
      .querySelector<HTMLElement>(`[data-demo-screen="${screenKey}"] #app-main`)
      ?.focus({ preventScroll: true });
  }, [activeRole, screenKey]);
  const reviewCount = app
    ? app.products.filter((item) => reviewableSuggestion(item, app)).length
    : 0;
  return (
    <div className={`demo-shell ${styles.demo}`} data-screen-motion={screenMotion} lang="en-MY">
      <a className="skip-link" href="#app-main">
        Skip to stock workspace
      </a>
      <header className="app-header" data-scrolled={headerScrolled}>
        <div className={styles.headerInner}>
          <div className={styles.workspaceIdentity}>
            <a href="/" className="home-link" aria-label="eStock landing page">
              <span className={styles.brand}>
                <span>e</span>Stock
              </span>
            </a>
            {app && !needsSession && (
              <span className={styles.workspaceName}>
                <span className={styles.workspaceDate}>{day(app.demoDate)} · MYT</span>
              </span>
            )}
          </div>
          {app && !needsSession && (
            <DemoRoleSwitcher
              value={pendingRole || app.role}
              disabled={busy || loading || inFlight > 0 || screenPending}
              choose={(role) => void chooseRole(role)}
            />
          )}
          {app && !needsSession && (
            <span className={styles.currentSection}>
              {navigation.find(([key]) => key === activeView)?.[1]}
            </span>
          )}
          {app && !needsSession && (
            <button
              ref={menuButton}
              type="button"
              className={`button button-outline ${styles.menuToggle}`}
              aria-expanded={navigationOpen}
              aria-controls="demo-navigation"
              onClick={() => setNavigationOpen(!navigationOpen)}
            >
              {navigationOpen ? "Close menu" : "Menu"}
            </button>
          )}
          {app && !needsSession && (
            <nav
              id="demo-navigation"
              className={styles.navigation}
              aria-label="Workspace"
              data-open={navigationOpen}
            >
              {navigation.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-current={activeView === key ? "page" : undefined}
                  disabled={busy || inFlight > 0}
                  onClick={() => showView(key)}
                >
                  {label}
                  {key === "today" && reviewCount > 0 && (
                    <span className={styles.navCount}>
                      {reviewCount}
                      <span className="sr-only"> suggestions to review</span>
                    </span>
                  )}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>
      <span className="sr-only" role="status" aria-atomic="true">
        {pendingRole
          ? `Opening ${pendingRole === "manager" ? "Manager" : "Staff"} view…`
          : controlPending === "nextDay"
            ? "Opening the next day…"
            : controlPending === "endDay"
              ? "Saving sales and checking restock needs…"
              : ""}
      </span>
      <ViewTransition
        key={screenKey}
        name="estock-demo-screen"
        default="none"
        share="auto"
        enter="auto"
        exit="auto"
      >
        <div
          className={styles.screen}
          data-demo-screen={screenKey}
          inert={pendingRole !== null || controlPending !== null || screenPending}
          aria-busy={pendingRole !== null || screenPending || controlPending !== null}
        >
          {needsSession ? (
            <main id="app-main" className="session-panel" tabIndex={-1}>
              <h1>Open inventory</h1>
              <p>This demo requires an access code.</p>
              <form className="app-form" onSubmit={login} aria-busy={busy}>
                <Field label="Access code" name="accessCode" type="password" />
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="button button-primary" disabled={busy} type="submit">
                  {busy ? "Opening…" : "Open workspace"}
                </button>
              </form>
            </main>
          ) : app ? (
            <div className={styles.workspace}>
              <main
                id="app-main"
                className="app-main"
                tabIndex={-1}
                aria-busy={busy || inFlight > 0}
              >
                <div className="workspace-context">
                  <span>
                    {app.closedThrough >= app.demoDate
                      ? "Day ended · Review suggestions or open the next day"
                      : "Day open · Record today’s sales"}
                  </span>
                  <div className={styles.demoControls}>
                    <button
                      type="button"
                      className="button button-text"
                      disabled={busy || inFlight > 0 || screenPending}
                      onClick={() => setResetOpen(true)}
                    >
                      Reset demo
                    </button>
                    <button
                      type="button"
                      className="button button-outline"
                      disabled={
                        busy ||
                        inFlight > 0 ||
                        screenPending ||
                        app.closedThrough >= app.demoDate ||
                        !app.products.length
                      }
                      onClick={() => void finishDay()}
                      aria-describedby="end-day-help"
                    >
                      End day
                    </button>
                    <span id="end-day-help" className="sr-only">
                      Confirm all sales are recorded, close this day and check replenishment once.
                      The date stays the same.
                    </span>
                    <button
                      type="button"
                      className="button button-outline"
                      disabled={
                        busy || inFlight > 0 || screenPending || app.closedThrough < app.demoDate
                      }
                      onClick={() => void advanceDay()}
                      aria-describedby="next-day-help"
                    >
                      Next day
                    </button>
                    <span id="next-day-help" className="sr-only">
                      End the current day first. Opens the next calendar day and progresses
                      SIMULATED deliveries without repeating analysis.
                    </span>
                  </div>
                </div>
                {controlPending && controlPending !== "reset" && (
                  <p className={styles.dayStatus}>
                    {controlPending === "endDay"
                      ? "Saving sales and checking restock needs…"
                      : "Opening the next day…"}
                  </p>
                )}
                {feedback && (
                  <p className="feedback" role="status" tabIndex={-1}>
                    {feedback}
                  </p>
                )}
                {error && (
                  <p role="alert" className="form-error">
                    {error}
                  </p>
                )}
                {busy && !pendingRole && (
                  <p className={styles.workingMessage} role="status">
                    Working…
                  </p>
                )}
                {activeView === "today" && app.role === "manager" && product && (
                  <ReplenishmentView
                    app={app}
                    product={product}
                    selected={setSelectedId}
                    busy={busy}
                    quick={quick}
                    review={(item, rec) => setReview({ product: item, rec })}
                    showOrders={(productId) => {
                      showView("orders", productId);
                    }}
                    closeDay={() => {
                      void finishDay();
                    }}
                  />
                )}
                {activeView === "stock" && product && (
                  <InventoryView
                    app={app}
                    product={product}
                    selected={setSelectedId}
                    run={run}
                    review={(item, rec) => setReview({ product: item, rec })}
                    addItem={() => setAddItemOpen(true)}
                  />
                )}
                {!product && ["stock", "today"].includes(activeView) && (
                  <>
                    <div className="page-heading">
                      <h1>{activeView === "stock" ? "Inventory" : "Replenishment"}</h1>
                    </div>
                    <section className={styles.blankInventory}>
                      <h2>No items yet</h2>
                      <p>
                        Add an item and its starting stock. Use synthetic records for this
                        workspace.
                      </p>
                      {
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={() => setAddItemOpen(true)}
                        >
                          Add Item
                        </button>
                      }
                    </section>
                  </>
                )}
                {activeView === "orders" && (
                  <OrdersView
                    key={orderProductId || "all"}
                    app={app}
                    run={run}
                    initialProductId={orderProductId}
                  />
                )}
                {activeView === "activity" && app.role === "manager" && <ActivityView app={app} />}
              </main>
              {review && (
                <Review
                  product={review.product}
                  rec={review.rec}
                  app={app}
                  run={run}
                  close={() => setReview(null)}
                />
              )}
            </div>
          ) : (
            <main id="app-main" className="session-panel" tabIndex={-1}>
              <h1>{loading ? "Opening stock records…" : "Could not load the workspace"}</h1>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              {!loading && (
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => void refresh()}
                >
                  Retry loading
                </button>
              )}
            </main>
          )}
        </div>
      </ViewTransition>
      {resetOpen && <ResetDemoDialog reset={restoreDemo} close={() => setResetOpen(false)} />}
      {addItemOpen && app && !needsSession && (
        <AddItemDialog
          app={app}
          run={run}
          openNextDay={advanceDay}
          close={() => setAddItemOpen(false)}
          saved={(id) => {
            setSelectedId(id);
            setAddItemOpen(false);
          }}
        />
      )}
    </div>
  );
}

function MovementForm({
  app,
  product,
  selected,
  run,
}: {
  app: AppState;
  product: Product;
  selected: (id: string) => void;
  run: RunAction;
}) {
  const [eventId, setEventId] = useState(() => crypto.randomUUID());
  const [type, setType] = useState("SALE");
  const needsReason = !["SALE", "INTERNAL_USE"].includes(type);
  const outgoing = !["CUSTOMER_RETURN_USABLE", "ADJUSTMENT_IN"].includes(type);
  const activity = (
    <div className="field">
      <span>Activity</span>
      <DemoDropdown label="Activity" name="type" value={type} onValueChange={setType}>
        <option value="SALE">Sale</option>
        <option value="INTERNAL_USE">Usage</option>
        <option value="DAMAGE_OR_LOSS">Damage or loss</option>
        <option value="CUSTOMER_RETURN_USABLE">Usable customer return</option>
        {app.role === "manager" && (
          <>
            <option value="ADJUSTMENT_IN">Adjustment in</option>
            <option value="ADJUSTMENT_OUT">Adjustment out</option>
          </>
        )}
      </DemoDropdown>
    </div>
  );
  return (
    <ActionForm
      action="recordMovement"
      run={run}
      fixed={{
        productId: product.id,
        unit: product.unit,
        date: app.demoDate,
        sourceEventId: eventId,
        reference: `DEMO-${eventId}`,
        ...(!needsReason ? { reason: type === "INTERNAL_USE" ? "Internal use" : "" } : {}),
      }}
      submit={type === "SALE" ? "Save sale" : "Save record"}
      submitDisabled={(outgoing && product.stock <= 0) || app.closedThrough >= app.demoDate}
      onSaved={() => {
        setEventId(crypto.randomUUID());
        setType("SALE");
      }}
    >
      <div className="field">
        <span>Product</span>
        <DemoDropdown label="Product" value={product.id} onValueChange={selected}>
          {app.products.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </DemoDropdown>
      </div>
      <Field
        label={`${type === "SALE" ? "Quantity sold" : "Quantity"} (${product.unit})`}
        name="quantity"
        type="number"
        min={10 ** -product.precision}
        max={outgoing ? product.stock : undefined}
        step={10 ** -product.precision}
      />
      {app.role === "staff" ? (
        <details>
          <summary>
            {type === "SALE" ? "Other stock activity" : `Activity: ${status(type)}`}
          </summary>
          {activity}
        </details>
      ) : (
        activity
      )}
      {needsReason && <Field key={type} label="Reason" name="reason" />}
      {outgoing && product.stock <= 0 && (
        <p className="warning">No stock available for this activity.</p>
      )}
      {type === "INTERNAL_USE" && (
        <p className="subtle">Usage reduces stock. Demand estimates use sales only.</p>
      )}
    </ActionForm>
  );
}

function ReplenishmentView({
  app,
  product,
  selected,
  busy,
  quick,
  review,
  showOrders,
  closeDay,
}: {
  app: AppState;
  product: Product;
  selected: (id: string) => void;
  busy: boolean;
  quick: (action: ActionName, input: Record<string, unknown>) => Promise<void>;
  review: (product: Product, rec: Recommendation) => void;
  showOrders: (productId: string) => void;
  closeDay: () => void;
}) {
  const [mode, setMode] = useState("recommendations");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const products = app.products.filter((item) => {
    const snapshot = analysisSnapshot(item, app);
    return (
      `${item.name} ${item.sku}`.toLowerCase().includes(query.trim().toLowerCase()) &&
      (filter === "all" ||
        (filter === "review" && snapshot.suggestion) ||
        (filter === "analysis" && !snapshot.calculation && !snapshot.orderOpen))
    );
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Replenishment</h1>
          <p>Review suggested quantities and order dates.</p>
        </div>
      </div>
      <fieldset className={styles.sectionTabs}>
        <legend className="sr-only">Replenishment views</legend>
        <button
          type="button"
          aria-pressed={mode === "recommendations"}
          onClick={() => setMode("recommendations")}
        >
          Recommendations
        </button>
        <button
          type="button"
          aria-pressed={mode === "scenario"}
          onClick={() => setMode("scenario")}
        >
          Plan ahead
        </button>
      </fieldset>
      {mode === "scenario" ? (
        <WhatIf
          key={`${product.id}:${product.ledgerVersion}:${product.inboundVersion}:${product.policy.version}:${app.demoDate}`}
          app={app}
          product={product}
          selected={selected}
        />
      ) : (
        <>
          <div className={styles.toolbar}>
            <label className={styles.searchField}>
              Search products
              <input
                type="search"
                value={query}
                placeholder="Product name or SKU"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className={styles.filterField}>
              <span>Show</span>
              <DemoDropdown label="Show products" value={filter} onValueChange={setFilter}>
                <option value="all">All products</option>
                <option value="review">Review needed</option>
                <option value="analysis">Needs analysis</option>
              </DemoDropdown>
            </div>
            <p className={styles.rowCount} role="status">
              {products.length} products
            </p>
          </div>
          <DataTable label="Demand forecasts and reorder recommendations">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col" className={styles.numeric}>
                  Stock / incoming
                </th>
                <th scope="col" className={styles.numeric}>
                  7-day demand
                </th>
                <th scope="col">Days of stock</th>
                <th scope="col">Status</th>
                <th scope="col">Order / arrival</th>
                <th scope="col" className={styles.numeric}>
                  Order quantity
                </th>
                <th scope="col">
                  <span className="sr-only">Next action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => {
                const snapshot = analysisSnapshot(item, app);
                const calc = snapshot.calculation;
                const suggestion = snapshot.suggestion;
                return (
                  <tr key={item.id}>
                    <th scope="row" data-label="Product">
                      <strong>{item.name}</strong>
                      <small>
                        {app.suppliers.find((supplier) => supplier.id === item.policy.supplierId)
                          ?.name || "No supplier assigned"}
                      </small>
                      <small>
                        {item.policy.leadTimeDays}-day delivery · {item.unit}
                      </small>
                      {calc && (
                        <small>
                          {source(snapshot.rec?.source || null)}
                          {snapshot.rec ? ` · Cutoff ${day(snapshot.rec.cutoffDate)}` : ""}
                        </small>
                      )}
                    </th>
                    <td data-label={`Stock / incoming (${item.unit})`} className={styles.numeric}>
                      {fmt(item.stock)} / {fmt(item.confirmedIncoming)}
                    </td>
                    <td data-label={`7-day demand (${item.unit})`} className={styles.numeric}>
                      {calc ? fmt(calc.weeklyDemand) : "N/A"}
                    </td>
                    <td data-label="Days of stock">
                      {calc
                        ? calc.coverageDays === null
                          ? "No forecast demand"
                          : `${fmt(calc.coverageDays)} days`
                        : "N/A"}
                    </td>
                    <td data-label="Status">
                      <StatusLabel
                        attention={
                          Boolean(snapshot.shortageDate) ||
                          snapshot.rec?.status === "URGENT_REVIEW" ||
                          item.stock <= item.policy.safetyStock
                        }
                      >
                        {snapshot.label}
                      </StatusLabel>
                      {snapshot.note && <small>{snapshot.note}</small>}
                      {suggestion?.calculation && (
                        <small>
                          Cover {suggestion.calculation.horizonDays} days; keep{" "}
                          {fmt(suggestion.calculation.safetyStock)} {item.unit} in reserve.
                        </small>
                      )}
                    </td>
                    <td data-label="Order / arrival">
                      {suggestion?.calculation ? (
                        <>
                          Order {day(suggestion.calculation.orderDate)}
                          <small>Arrives {day(suggestion.calculation.arrivalDate)}</small>
                        </>
                      ) : calc?.status === "MONITORING" && calc.orderDate ? (
                        <>
                          Next review<small>{day(calc.orderDate)}</small>
                        </>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td data-label={`Order quantity (${item.unit})`} className={styles.numeric}>
                      {suggestion?.calculation ? (
                        <strong>{fmt(suggestion.calculation.suggestedQuantity)}</strong>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className={styles.rowAction}>
                      <button
                        type="button"
                        className={`button ${suggestion ? "button-primary" : "button-outline"}`}
                        disabled={
                          busy ||
                          Boolean(calc && !suggestion && !snapshot.orderOpen && !snapshot.pending)
                        }
                        aria-label={`${snapshot.pending ? "Check analysis for" : snapshot.intraday ? "Close business day before analysing" : suggestion ? "Review suggestion for" : snapshot.orderOpen ? "View purchase order for" : "Analyse"} ${item.name}`}
                        onClick={() => {
                          selected(item.id);
                          if (snapshot.pending)
                            void quick("pollAnalysis", { analysisId: snapshot.pending.id });
                          else if (snapshot.intraday) closeDay();
                          else if (suggestion) review(item, suggestion);
                          else if (snapshot.orderOpen) showOrders(item.id);
                          else void quick("analyse", { productId: item.id });
                        }}
                      >
                        {snapshot.pending
                          ? "Check analysis"
                          : snapshot.intraday
                            ? "End day"
                            : suggestion
                              ? "Review suggestion"
                              : snapshot.orderOpen
                                ? "View order"
                                : calc
                                  ? "Up to date"
                                  : "Analyze item"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!products.length && (
                <tr>
                  <td colSpan={8} className={styles.emptyCell}>
                    No matching products.
                  </td>
                </tr>
              )}
            </tbody>
          </DataTable>
          <p className={styles.tableNote}>
            Suggestions include supplier delivery time, buffer stock and confirmed incoming goods.
          </p>
          <p className={styles.sourceNote}>
            {app.forecastMode === "MOCK"
              ? "Recorded sales estimates. Short histories use a Demo estimate; longer histories use a baseline. No live AI inference."
              : "Forecast source is shown for each saved result."}{" "}
            Analysis uses complete sales days only.
          </p>
        </>
      )}
    </>
  );
}

function ActivityView({ app }: { app: AppState }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const groups = activityGroups(app.activity);
  const filtered = groups.filter(({ event }) => {
    const product = activityProduct(event, app);
    const matchesRole = filter === "all" || event.actor === filter;
    return (
      matchesRole &&
      `${event.action} ${event.detail} ${product?.name || ""}`
        .toLowerCase()
        .includes(query.trim().toLowerCase())
    );
  });
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / 25) - 1));
  const selected = groups.find((group) => group.event.id === selectedEvent);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Activity</h1>
          <p>Decisions and changes, newest first. Times shown in MYT.</p>
        </div>
      </div>
      <div className={styles.toolbar}>
        <label className={styles.searchField}>
          Search activity
          <input
            type="search"
            value={query}
            placeholder="Product, event or note"
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
              setSelectedEvent(null);
            }}
          />
        </label>
        <div className={styles.filterField}>
          <span>Recorded by</span>
          <DemoDropdown
            label="Recorded by"
            value={filter}
            onValueChange={(nextValue) => {
              setFilter(nextValue);
              setPage(0);
              setSelectedEvent(null);
            }}
          >
            <option value="all">All roles</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
            <option value="system">System</option>
          </DemoDropdown>
        </div>
        <p className={styles.rowCount} role="status">
          {filtered.length} events
        </p>
      </div>
      <DataTable label="Activity history">
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Time · MYT</th>
            <th scope="col">Event</th>
            <th scope="col" className={styles.actor}>
              Role
            </th>
            <th scope="col">Outcome</th>
            <th scope="col">
              <span className="sr-only">Audit details</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {filtered.slice(currentPage * 25, currentPage * 25 + 25).map((group) => {
            const event = group.event;
            const product = activityProduct(event, app);
            const movementId =
              event.after && typeof event.after === "object" && "movementId" in event.after
                ? event.after.movementId
                : null;
            const movement = app.movements.find((item) => item.id === movementId);
            const analysisId =
              event.after && typeof event.after === "object" && "analysisId" in event.after
                ? event.after.analysisId
                : null;
            const analysis = app.analyses.find((item) => item.id === analysisId);
            return (
              <tr key={event.id} data-selected={selectedEvent === event.id}>
                <th scope="row" data-label="Product">
                  {product?.name || "Workspace"}
                </th>
                <td data-label="Time · MYT">
                  <time dateTime={group.at}>
                    {new Date(group.at).toLocaleString("en-MY", {
                      timeZone: "Asia/Kuala_Lumpur",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                  {event.businessDate && <small>Demo date: {day(event.businessDate)}</small>}
                </td>
                <td data-label="Event">
                  {group.records.length > 1 && event.action === "Analysis finished"
                    ? "Analysis result"
                    : event.action === "Synthetic supplier acknowledgement"
                      ? "Supplier confirmation · SIMULATED"
                      : event.action === "Simulated dispatch"
                        ? "Supplier request · SIMULATED"
                        : event.action}
                </td>
                <td data-label="Role" className={styles.actor}>
                  {event.actor === "manager"
                    ? "Manager"
                    : event.actor === "staff"
                      ? "Staff"
                      : "System"}
                </td>
                <td data-label="Outcome" className={styles.outcome}>
                  {activitySummary(event, product?.unit || "units", analysis)}
                  {movement?.reason && movement.type !== "INTERNAL_USE" && (
                    <small>Reason: {movement.reason}</small>
                  )}
                </td>
                <td className={styles.rowAction}>
                  <button
                    type="button"
                    className="button button-outline"
                    aria-expanded={selectedEvent === event.id}
                    aria-controls="audit-record-panel"
                    aria-label={`View ${event.action.toLowerCase()} record for ${product?.name || "the workspace"}`}
                    onClick={(eventClick) => {
                      opener.current = eventClick.currentTarget;
                      setSelectedEvent(event.id);
                      requestAnimationFrame(() =>
                        document.getElementById("audit-record-title")?.focus(),
                      );
                    }}
                  >
                    Details
                  </button>
                </td>
              </tr>
            );
          })}
          {!filtered.length && (
            <tr>
              <td colSpan={6} className={styles.emptyCell}>
                {app.activity.length ? "No matching activity." : "No activity yet."}
              </td>
            </tr>
          )}
        </tbody>
      </DataTable>
      {filtered.length > 25 && (
        <div className={styles.pagination}>
          <p>
            Page {currentPage + 1} of {Math.ceil(filtered.length / 25)}
          </p>
          <button
            type="button"
            className="button button-outline"
            disabled={currentPage === 0}
            onClick={() => {
              setPage(currentPage - 1);
              setSelectedEvent(null);
            }}
          >
            Previous
          </button>
          <button
            type="button"
            className="button button-outline"
            disabled={(currentPage + 1) * 25 >= filtered.length}
            onClick={() => {
              setPage(currentPage + 1);
              setSelectedEvent(null);
            }}
          >
            Next
          </button>
        </div>
      )}
      {selected && (
        <section
          className={styles.panel}
          id="audit-record-panel"
          aria-labelledby="audit-record-title"
        >
          <div className={styles.panelHeading}>
            <h2 id="audit-record-title" tabIndex={-1}>
              Audit record
            </h2>
            <button
              type="button"
              className="button button-outline"
              onClick={() => {
                setSelectedEvent(null);
                returnFocus(opener.current);
              }}
            >
              Close details
            </button>
          </div>
          {selected.records.map((record) => (
            <div className={styles.auditRecord} key={record.id}>
              <h3>{record.action}</h3>
              <p className="subtle">
                {record.actor} ·{" "}
                {new Date(record.at).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}
              </p>
              <p>{record.detail}</p>
              <pre>{JSON.stringify({ before: record.before, after: record.after }, null, 2)}</pre>
            </div>
          ))}
        </section>
      )}
    </>
  );
}

function InventoryView({
  app,
  product,
  selected,
  run,
  review,
  addItem,
}: {
  app: AppState;
  product: Product;
  selected: (id: string) => void;
  run: RunAction;
  review: (product: Product, rec: Recommendation) => void;
  addItem: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [recording, setRecording] = useState(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const products = app.products.filter(
    (item) =>
      `${item.name} ${item.sku}`.toLowerCase().includes(query.trim().toLowerCase()) &&
      (filter === "all" ||
        (filter === "low" && item.stock <= item.policy.safetyStock) ||
        (filter === "incoming" && item.confirmedIncoming > 0)),
  );
  const movements = app.movements.filter((movement) => movement.productId === product.id);
  const suggestions =
    app.role === "manager" ? app.products.filter((item) => reviewableSuggestion(item, app)) : [];
  function openProduct(item: Product, button: HTMLButtonElement) {
    opener.current = button;
    selected(item.id);
    setRecording(true);
    requestAnimationFrame(() => document.getElementById("product-record-title")?.focus());
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Inventory</h1>
        </div>
        <div className="form-actions">
          {
            <button type="button" className="button button-primary" onClick={addItem}>
              Add Item
            </button>
          }
          {(app.role === "staff" || suggestions.length > 0) && (
            <button
              type="button"
              className="button button-outline"
              onClick={(event) => {
                const first = suggestions[0];
                const suggestion = first && reviewableSuggestion(first, app);
                if (first && suggestion) review(first, suggestion);
                else openProduct(product, event.currentTarget);
              }}
            >
              {suggestions.length
                ? "Review suggestion"
                : app.closedThrough >= app.demoDate
                  ? "View item"
                  : app.role === "staff"
                    ? "Record sales"
                    : "Record stock"}
            </button>
          )}
        </div>
      </div>
      {app.role === "manager" && <HistoryImport app={app} run={run} />}
      <div className={styles.toolbar}>
        <label className={styles.searchField}>
          Search products
          <input
            type="search"
            value={query}
            placeholder="Product name or SKU"
            onChange={(event) => {
              setQuery(event.target.value);
              setRecording(false);
            }}
          />
        </label>
        <div className={styles.filterField}>
          <span>Show</span>
          <DemoDropdown
            label="Show products"
            value={filter}
            onValueChange={(nextValue) => {
              setFilter(nextValue);
              setRecording(false);
            }}
          >
            <option value="all">All products</option>
            <option value="low">Low stock</option>
            <option value="incoming">Confirmed incoming</option>
          </DemoDropdown>
        </div>
        <p className={styles.rowCount} role="status">
          {products.length} of {app.products.length} products
        </p>
      </div>
      <DataTable label="Inventory stock levels">
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Supplier</th>
            <th scope="col" className={styles.numeric}>
              In stock
            </th>
            <th scope="col" className={styles.numeric}>
              Incoming
            </th>
            <th scope="col">Days of stock</th>
            <th scope="col">Status</th>
            <th scope="col">
              <span className="sr-only">Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((item) => {
            const snapshot = analysisSnapshot(item, app);
            const calc = snapshot.calculation;
            return (
              <tr key={item.id} data-selected={recording && product.id === item.id}>
                <th scope="row" data-label="Product">
                  <strong>{item.name}</strong>
                  <small>
                    {item.sku} · {item.unit}
                  </small>
                </th>
                <td data-label="Supplier">
                  {app.suppliers.find((supplier) => supplier.id === item.policy.supplierId)?.name ||
                    "Not assigned"}
                  {!item.purchasingSetupRequired && (
                    <small>{item.policy.leadTimeDays}-day delivery</small>
                  )}
                </td>
                <td data-label={`In stock (${item.unit})`} className={styles.numeric}>
                  {fmt(item.stock)}
                </td>
                <td data-label={`Incoming (${item.unit})`} className={styles.numeric}>
                  {fmt(item.confirmedIncoming)}
                </td>
                <td data-label="Days of stock">
                  {calc
                    ? calc.coverageDays === null
                      ? "No forecast demand"
                      : `${fmt(calc.coverageDays)} days`
                    : "N/A"}
                  {calc && <small>Stock only · {source(snapshot.rec?.source || null)}</small>}
                </td>
                <td data-label="Status">
                  <StatusLabel attention={item.stock <= item.policy.safetyStock}>
                    {item.purchasingSetupRequired
                      ? "Purchasing setup required"
                      : item.stock === 0
                        ? "Out of stock"
                        : item.stock <= item.policy.safetyStock
                          ? "Low stock"
                          : "In stock"}
                  </StatusLabel>
                  {item.confirmedIncoming > 0 && <small>Delivery confirmed</small>}
                </td>
                <td className={styles.rowAction}>
                  <button
                    type="button"
                    className="button button-outline"
                    aria-label={`Open ${item.name} stock records`}
                    aria-expanded={recording && product.id === item.id}
                    aria-controls="product-record-panel"
                    onClick={(event) => openProduct(item, event.currentTarget)}
                  >
                    Open item
                  </button>
                </td>
              </tr>
            );
          })}
          {!products.length && (
            <tr>
              <td colSpan={7} className={styles.emptyCell}>
                No matching products.
              </td>
            </tr>
          )}
        </tbody>
      </DataTable>
      <p className={styles.tableNote}>
        Incoming deliveries are supplier-confirmed. Days of stock are estimates from saved analysis.
      </p>
      {recording && (
        <section
          className={styles.panel}
          id="product-record-panel"
          aria-labelledby="product-record-title"
        >
          <div className={styles.panelHeading}>
            <div>
              <h2 id="product-record-title" tabIndex={-1}>
                {product.name}
              </h2>
              <p>
                {product.sku} · {product.unit}
              </p>
              <p>
                {product.purchasingSetupRequired ? (
                  "Purchasing setup required. A manager must save the purchasing policy."
                ) : (
                  <>
                    {app.suppliers.find((supplier) => supplier.id === product.policy.supplierId)
                      ?.name || "No supplier assigned"}{" "}
                    · {product.policy.leadTimeDays}-day delivery
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              className="button button-outline"
              onClick={() => {
                setRecording(false);
                returnFocus(opener.current);
              }}
            >
              Close product
            </button>
          </div>
          <div className={styles.detailGrid}>
            <section>
              <h3>Record stock</h3>
              {app.closedThrough >= app.demoDate ? (
                <p className="subtle">
                  Day ended. Select Next day to record sales or stock changes.
                </p>
              ) : (
                <MovementForm
                  key={`${app.role}:${product.id}:${app.demoDate}`}
                  app={app}
                  product={product}
                  selected={selected}
                  run={run}
                />
              )}
            </section>
            <section>
              <h3>Recent movements</h3>
              <MovementTable movements={movements.slice(0, 5)} unit={product.unit} />
            </section>
          </div>
          {movements.length > 5 && (
            <details className="workspace-details">
              <summary>All stock records ({movements.length})</summary>
              <MovementTable movements={movements} unit={product.unit} />
            </details>
          )}
          <History product={product} />
          {app.role === "manager" && (
            <details className="workspace-details">
              <summary>Purchasing policy</summary>
              <ActionForm
                key={`${product.id}:${product.policy.version}`}
                run={run}
                action="updatePolicy"
                fixed={{
                  productId: product.id,
                  expectedVersion: product.policy.version,
                }}
                submit="Save purchasing policy"
              >
                <PolicyFields
                  p={product.purchasingSetupRequired ? undefined : product.policy}
                  state={app}
                  precision={product.precision}
                />
                <Field
                  label="Next review date"
                  name="nextReviewDate"
                  type="date"
                  value={product.policy.nextReviewDate}
                />
                <details>
                  <summary>Reference costs and approval limit</summary>
                  <p className="subtle">
                    Leave costs blank if unknown. An unpriced simulated request cannot be checked
                    against the approval limit.
                  </p>
                  <Field
                    label="Reference unit cost (sen)"
                    name="unitPriceSen"
                    type="number"
                    required={false}
                    min={0}
                    value={product.policy.unitPriceSen ?? ""}
                  />
                  <Field
                    label="Shipping cost (sen)"
                    name="shippingSen"
                    type="number"
                    required={false}
                    min={0}
                    value={product.policy.shippingSen ?? ""}
                  />
                  <Field
                    label="Approval limit (sen)"
                    name="maxOrderSen"
                    type="number"
                    min={1}
                    value={product.policy.maxOrderSen || 200000}
                  />
                </details>
              </ActionForm>
            </details>
          )}
        </section>
      )}
    </>
  );
}

function MovementTable({ movements, unit }: { movements: AppState["movements"]; unit: string }) {
  return (
    <DataTable label="Stock movement records">
      <thead>
        <tr>
          <th scope="col">Date</th>
          <th scope="col">Activity</th>
          <th scope="col" className={styles.numeric}>
            Quantity ({unit})
          </th>
          <th scope="col">
            <span className="sr-only">Record details</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {movements.map((movement) => (
          <tr key={movement.id}>
            <th scope="row" data-label="Date">
              {day(movement.date)}
            </th>
            <td data-label="Activity">{status(movement.type)}</td>
            <td data-label={`Quantity (${unit})`} className={styles.numeric}>
              {fmt(movement.quantity)}
            </td>
            <td data-label="Record">
              <details>
                <summary>Details</summary>
                <p>
                  {movement.actor === "manager"
                    ? "Manager"
                    : movement.actor === "staff"
                      ? "Staff"
                      : "System"}
                </p>
                {movement.reason && <p>{movement.reason}</p>}
                <p className={styles.reference}>{movement.reference}</p>
              </details>
            </td>
          </tr>
        ))}
        {!movements.length && (
          <tr>
            <td colSpan={4} className={styles.emptyCell}>
              No movements yet.
            </td>
          </tr>
        )}
      </tbody>
    </DataTable>
  );
}

function OrdersView({
  app,
  run,
  initialProductId,
}: {
  app: AppState;
  run: RunAction;
  initialProductId: string | null;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(app.role === "staff" ? "all" : "open");
  const [productFilter, setProductFilter] = useState(initialProductId || "all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const orders = [...app.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const ready = orders.filter(
    (order) =>
      ["SUPPLIER_CONFIRMED", "PARTIALLY_RECEIVED"].includes(order.status) &&
      order.remaining > 0 &&
      order.confirmedDate !== null &&
      order.confirmedDate <= app.demoDate,
  );
  const allowed =
    app.role === "staff" ? orders.filter((order) => order.status !== "CANCELLED") : orders;
  const visible = allowed.filter((order) => {
    const product = app.products.find((item) => item.id === order.productId);
    const supplier = app.suppliers.find((item) => item.id === order.supplierId);
    const open = !["RECEIVED", "CANCELLED"].includes(order.status) || order.damageOpen;
    return (
      (productFilter === "all" || order.productId === productFilter) &&
      `${product?.name} ${product?.sku} ${supplier?.name} ${order.reference}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (filter === "all" ||
        (filter === "open" && open) ||
        (filter === "receiving" && ready.includes(order)) ||
        (filter === "closed" && !open))
    );
  });
  const selected = allowed.find((order) => order.id === selectedId);
  if (app.role === "staff" && !allowed.length)
    return (
      <>
        <div className="page-heading">
          <div>
            <h1>Purchase orders</h1>
            <p>SIMULATED supplier channel</p>
          </div>
        </div>
        <p className={styles.emptyState}>No confirmed deliveries.</p>
      </>
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Purchase orders</h1>
          <p>
            {app.role === "staff"
              ? "Waiting orders and goods to receive · SIMULATED channel"
              : "Approved purchases · SIMULATED supplier channel"}
          </p>
        </div>
      </div>
      <div className={styles.toolbar}>
        <label className={styles.searchField}>
          Search {app.role === "staff" ? "deliveries" : "orders"}
          <input
            type="search"
            value={query}
            placeholder="Product, supplier or order"
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedId(null);
            }}
          />
        </label>
        <div className={styles.filterField}>
          <span>Show</span>
          <DemoDropdown
            label="Show orders"
            value={filter}
            onValueChange={(nextValue) => {
              setFilter(nextValue);
              setSelectedId(null);
            }}
          >
            <option value="all">All orders</option>
            <option value="open">Open orders</option>
            <option value="receiving">Ready to receive</option>
            <option value="closed">Completed / cancelled</option>
          </DemoDropdown>
        </div>
        <div className={styles.filterField}>
          <span>Product</span>
          <DemoDropdown
            label="Product"
            value={productFilter}
            onValueChange={(nextValue) => {
              setProductFilter(nextValue);
              setSelectedId(null);
            }}
          >
            <option value="all">All products</option>
            {app.products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </DemoDropdown>
        </div>
        <p className={styles.rowCount} role="status">
          {visible.length} {app.role === "staff" ? "deliveries" : "orders"}
        </p>
      </div>
      <DataTable label="Purchase orders and delivery stages">
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Order</th>
            <th scope="col">Supplier</th>
            <th scope="col" className={styles.numeric}>
              Ordered
            </th>
            <th scope="col" className={styles.numeric}>
              Remaining
            </th>
            <th scope="col">Delivery</th>
            <th scope="col">Status</th>
            <th scope="col">
              <span className="sr-only">Next action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {visible.map((order) => (
            <tr key={order.id} data-selected={selectedId === order.id}>
              <th scope="row" data-label="Product">
                <strong>{app.products.find((item) => item.id === order.productId)?.name}</strong>
                <small>{order.unit}</small>
              </th>
              <td data-label="Order" className={styles.reference}>
                {order.reference}
              </td>
              <td data-label="Supplier">
                {app.suppliers.find((item) => item.id === order.supplierId)?.name}
              </td>
              <td data-label={`Ordered (${order.unit})`} className={styles.numeric}>
                {fmt(order.quantity)}
              </td>
              <td data-label={`Remaining (${order.unit})`} className={styles.numeric}>
                {fmt(order.remaining)}
              </td>
              <td data-label="Delivery">
                {day(order.confirmedDate || order.expectedDate)}
                <small>{order.confirmedDate ? "Supplier confirmed" : "Requested"}</small>
              </td>
              <td data-label="Status">
                <StatusLabel
                  attention={
                    order.damageOpen ||
                    ["NEEDS_REVIEW", "DISPATCH_FAILED", "DISPATCH_UNKNOWN"].includes(order.status)
                  }
                >
                  {orderStage(order, app)}
                </StatusLabel>
                {order.damageOpen && <small>Damage review needed</small>}
                {app.role === "manager" && order.estimatedCostSen === null && (
                  <small>Unpriced · SIMULATED</small>
                )}
              </td>
              <td className={styles.rowAction}>
                <button
                  type="button"
                  className="button button-outline"
                  aria-expanded={selectedId === order.id}
                  aria-controls="order-workflow-panel"
                  aria-label={`${app.role === "staff" && ready.includes(order) && app.closedThrough < app.demoDate ? "Receive goods for" : "Open"} ${order.reference}`}
                  onClick={(event) => {
                    opener.current = event.currentTarget;
                    setSelectedId(order.id);
                    requestAnimationFrame(() =>
                      document.getElementById("order-workflow-title")?.focus(),
                    );
                  }}
                >
                  {app.role === "staff" && ready.includes(order) && app.closedThrough < app.demoDate
                    ? "Receive goods"
                    : "Open order"}
                </button>
              </td>
            </tr>
          ))}
          {!visible.length && (
            <tr>
              <td colSpan={8} className={styles.emptyCell}>
                {query || productFilter !== "all"
                  ? "No matching orders."
                  : app.role === "staff"
                    ? "No confirmed deliveries."
                    : filter === "open"
                      ? "No open orders"
                      : filter === "receiving"
                        ? "No confirmed deliveries to receive."
                        : "No completed orders."}
              </td>
            </tr>
          )}
        </tbody>
      </DataTable>
      {selected && (
        <section
          className={styles.panel}
          id="order-workflow-panel"
          aria-labelledby="order-workflow-title"
        >
          <div className={styles.panelHeading}>
            <h2 id="order-workflow-title" tabIndex={-1}>
              {selected.reference}
            </h2>
            <button
              type="button"
              className="button button-outline"
              onClick={() => {
                setSelectedId(null);
                returnFocus(opener.current);
              }}
            >
              Close order
            </button>
          </div>
          <OrderRow key={selected.id} order={selected} app={app} run={run} />
        </section>
      )}
    </>
  );
}
function OrderRow({ order, app, run }: { order: PurchaseOrder; app: AppState; run: RunAction }) {
  const product = app.products.find((p) => p.id === order.productId);
  const outbox = app.outbox.find((m) => m.orderId === order.id);
  const [receiptId, setReceiptId] = useState(() => crypto.randomUUID());
  const [confirmationId, setConfirmationId] = useState(() => crypto.randomUUID());
  const [usable, setUsable] = useState("");
  const [damaged, setDamaged] = useState("0");
  const receiptHelpId = useId();
  const received = Math.round((Number(usable) + Number(damaged)) * 1000);
  const remaining = Math.round(order.remaining * 1000);
  const validPrecision = [usable, damaged].every((value) => {
    const scaled = Number(value) * 10 ** (product?.precision ?? 0);
    return Number.isFinite(scaled) && Math.abs(scaled - Math.round(scaled)) <= 1e-7;
  });
  const validReceipt =
    usable !== "" &&
    damaged !== "" &&
    Number(usable) >= 0 &&
    Number(damaged) >= 0 &&
    validPrecision &&
    Number.isFinite(received) &&
    received > 0 &&
    received <= remaining;
  if (!product) return null;
  const receiptStep = 10 ** -product.precision;
  return (
    <article className="order-sheet">
      <StatusLabel
        attention={
          order.damageOpen ||
          ["NEEDS_REVIEW", "DISPATCH_FAILED", "DISPATCH_UNKNOWN"].includes(order.status)
        }
      >
        {orderStage(order, app)}
        {order.damageOpen ? " · Damaged goods need manager review" : ""}
      </StatusLabel>
      <div className="order-heading">
        <h3>{product.name}</h3>
      </div>
      <p>{app.suppliers.find((supplier) => supplier.id === order.supplierId)?.name}</p>
      <p>
        {fmt(order.quantity)} {order.unit} ordered · {fmt(order.remaining)} remaining
        {app.role === "manager"
          ? order.estimatedCostSen === null
            ? " · Unpriced · SIMULATED"
            : ` · Estimated ${money(order.estimatedCostSen)}`
          : ""}
      </p>
      <p>
        Expected delivery: {day(order.confirmedDate || order.expectedDate)}{" "}
        {order.confirmedDate ? "(supplier confirmed)" : "(requested, unconfirmed)"}
      </p>
      {!order.confirmedDate && !["CANCELLED", "RECEIVED"].includes(order.status) && (
        <p className="subtle">
          Awaiting supplier confirmation. Next day progresses the SIMULATED supplier.
        </p>
      )}
      {order.status === "NEEDS_REVIEW" && (
        <p className="warning">
          This order needs manager review. Receiving is on hold.
          {app.role === "manager"
            ? " Cancel the commitment with a reason, then analyse again to replace it."
            : " Ask the manager to review the order."}
        </p>
      )}
      {app.role === "manager" &&
        ["APPROVED_PENDING_DISPATCH", "DISPATCH_FAILED"].includes(order.status) && (
          <ActionForm
            run={run}
            action="dispatch"
            fixed={{ orderId: order.id }}
            submit={
              order.status === "DISPATCH_FAILED"
                ? "Retry SIMULATED request"
                : "Send SIMULATED request"
            }
          >
            <p className="subtle">SIMULATED channel. No real messages are sent.</p>
          </ActionForm>
        )}
      {app.role === "manager" &&
        ["SENT_SIMULATED", "SUPPLIER_CONFIRMED", "PARTIALLY_RECEIVED"].includes(order.status) && (
          <details open={order.status === "SENT_SIMULATED"}>
            <summary>
              {order.status === "SENT_SIMULATED"
                ? "Record supplier confirmation"
                : "Update confirmed arrival date"}
            </summary>
            <ActionForm
              key={app.demoDate}
              action="confirmOrder"
              run={run}
              fixed={{ orderId: order.id, reference: `ACK-${confirmationId}` }}
              submit="Record supplier confirmation (SIMULATED)"
              onSaved={() => setConfirmationId(crypto.randomUUID())}
            >
              <div className="form-grid">
                <Field
                  name="expectedDate"
                  label="Supplier-confirmed arrival"
                  type="date"
                  value={
                    order.confirmedDate && order.confirmedDate >= app.demoDate
                      ? order.confirmedDate
                      : order.expectedDate >= app.demoDate
                        ? order.expectedDate
                        : app.demoDate
                  }
                  min={app.demoDate}
                  help="A changed arrival date holds receiving for manager review."
                />
              </div>
              <label className="check-field">
                <input type="checkbox" name="confirmApprovedTerms" required />
                {order.estimatedCostSen === null
                  ? "Quantity matches the approved request; price remains unknown."
                  : "Quantity and reference price match the approved request."}{" "}
                SIMULATED supplier event.
              </label>
            </ActionForm>
          </details>
        )}
      {["SUPPLIER_CONFIRMED", "PARTIALLY_RECEIVED"].includes(order.status) &&
        order.confirmedDate &&
        order.confirmedDate > app.demoDate && (
          <p className="subtle">Receiving opens {day(order.confirmedDate)}.</p>
        )}
      {["SUPPLIER_CONFIRMED", "PARTIALLY_RECEIVED"].includes(order.status) &&
        order.confirmedDate &&
        order.confirmedDate <= app.demoDate &&
        app.closedThrough >= app.demoDate && (
          <p className="subtle">Day ended. Select Next day to receive goods.</p>
        )}
      {["SUPPLIER_CONFIRMED", "PARTIALLY_RECEIVED"].includes(order.status) &&
        order.confirmedDate &&
        order.confirmedDate <= app.demoDate &&
        app.closedThrough < app.demoDate && (
          <details open>
            <summary>Receive goods against this order</summary>
            <ActionForm
              key={app.demoDate}
              action="receive"
              run={run}
              fixed={{
                orderId: order.id,
                unit: product.unit,
                date: app.demoDate,
                sourceEventId: receiptId,
                reference: `RECEIPT-${receiptId}`,
              }}
              submit="Receive goods"
              submitDisabled={!validReceipt}
              onSaved={() => {
                setReceiptId(crypto.randomUUID());
                setUsable("");
                setDamaged("0");
              }}
            >
              <div className="form-grid">
                <label className="field">
                  Usable quantity ({order.unit})
                  <input
                    name="usable"
                    type="number"
                    inputMode={receiptStep === 1 ? "numeric" : "decimal"}
                    value={usable}
                    min={0}
                    max={order.remaining}
                    step={receiptStep}
                    required
                    aria-describedby={receiptHelpId}
                    onChange={(event) => setUsable(event.target.value)}
                  />
                </label>
              </div>
              <details>
                <summary>Damaged goods</summary>
                <div className="form-grid">
                  <label className="field">
                    Damaged quantity ({order.unit})
                    <input
                      name="damaged"
                      type="number"
                      inputMode={receiptStep === 1 ? "numeric" : "decimal"}
                      value={damaged}
                      min={0}
                      max={order.remaining}
                      step={receiptStep}
                      required
                      aria-describedby={receiptHelpId}
                      onChange={(event) => setDamaged(event.target.value)}
                    />
                  </label>
                </div>
              </details>
              <p id={receiptHelpId} className="subtle" role="status">
                {!validPrecision
                  ? `Use at most ${product.precision} decimal places for ${product.unit}.`
                  : usable === ""
                    ? `Enter the quantity received. Up to ${fmt(order.remaining)} ${order.unit} remain on this order.`
                    : !validReceipt
                      ? "Enter a positive total within the quantity remaining on this order."
                      : received === remaining
                        ? `Matches the remaining order: ${fmt(received / 1000)} ${order.unit}.`
                        : `Partial delivery: ${fmt(received / 1000)} of ${fmt(order.remaining)} ${order.unit}. The rest stays outstanding.`}
              </p>
              <p className="subtle">
                Only usable goods increase stock. Damaged goods reduce the order balance and need
                manager review.
              </p>
            </ActionForm>
          </details>
        )}
      {(app.role === "manager" || app.receipts.some((receipt) => receipt.orderId === order.id)) && (
        <details>
          <summary>
            {app.role === "manager"
              ? "SIMULATED supplier outbox and receipts"
              : "Previous receipts"}
          </summary>
          {app.role === "manager" && outbox && (
            <>
              <p>
                {status(outbox.status)} · {outbox.attempts} dispatch attempts
              </p>
              <pre>{outbox.message}</pre>
            </>
          )}
          {app.receipts
            .filter((r) => r.orderId === order.id)
            .map((r) => (
              <p key={r.id}>
                {r.date}: {r.usable} usable, {r.damaged} damaged {order.unit}. {r.reference}
              </p>
            ))}
        </details>
      )}
      {app.role === "manager" && order.damageOpen && (
        <details>
          <summary>Resolve damaged-goods exception</summary>
          <ActionForm
            run={run}
            action="resolveDamage"
            fixed={{ orderId: order.id }}
            submit="Record damage resolution"
          >
            <Field label="Resolution and evidence reference" name="reason" />
          </ActionForm>
        </details>
      )}
      {app.role === "manager" && !["RECEIVED", "CANCELLED"].includes(order.status) && (
        <details>
          <summary>Cancel this purchase commitment</summary>
          <ActionForm
            run={run}
            action="cancelOrder"
            fixed={{ orderId: order.id }}
            submit="Record cancellation"
          >
            <Field name="reason" label="Cancellation reason and evidence" />
            <p className="subtle">
              Explicitly resolve the supplier commitment. Existing receipts and activity remain
              recorded.
            </p>
          </ActionForm>
        </details>
      )}
    </article>
  );
}

function WhatIf({
  app,
  product,
  selected,
}: {
  app: AppState;
  product: Product;
  selected: (id: string) => void;
}) {
  const [result, setResult] = useState<PurchaseCalculation | null>(null);
  const lastWeek = [...product.weeks]
    .filter((week) => week.complete)
    .sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
  const [weeklySales, setWeeklySales] = useState(lastWeek ? String(lastWeek.quantity) : "");
  const [error, setError] = useState("");
  const p = product.policy;
  const confirmedOrders = app.orders.filter(
    (order) =>
      order.productId === product.id &&
      ["SUPPLIER_CONFIRMED", "PARTIALLY_RECEIVED"].includes(order.status) &&
      order.confirmedDate &&
      order.remaining > 0,
  );
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      setResult(
        calculatePurchase({
          stock: product.stock,
          unit: product.unit,
          decisionDate: app.demoDate,
          daily: Array(366).fill(Number(weeklySales) / 7),
          policy: p,
          inbound: confirmedOrders.map((order) => ({
            quantity: order.remaining,
            date: order.confirmedDate as string,
            confirmed: true,
          })),
          hasCommitment: app.orders.some(
            (order) =>
              order.productId === product.id &&
              (!["RECEIVED", "CANCELLED"].includes(order.status) || order.damageOpen),
          ),
        }),
      );
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Check scenario inputs.");
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h2>Plan ahead</h2>
          <p>
            Manual simulation using saved stock and policy. Not an AI forecast. No records are
            changed.
          </p>
        </div>
      </div>
      <div className="whatif-layout">
        <form className="app-form entry-sheet" onSubmit={calculate}>
          <div className="field">
            <span>Product</span>
            <DemoDropdown label="Product" value={product.id} onValueChange={selected}>
              {app.products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </DemoDropdown>
          </div>
          <label className="field">
            Expected weekly sales ({product.unit})
            <input
              name="weeklySales"
              type="number"
              inputMode={product.precision > 0 ? "decimal" : "numeric"}
              lang="en-MY"
              value={weeklySales}
              min={0}
              step={10 ** -product.precision}
              required
              onChange={(event) => {
                setWeeklySales(event.target.value);
                setResult(null);
                setError("");
              }}
            />
            {lastWeek && (
              <small>
                Starting value: {fmt(lastWeek.quantity)} {product.unit} sold in the last complete
                week.
              </small>
            )}
          </label>
          <details>
            <summary>Saved stock and purchasing policy</summary>
            <dl className="detail-list">
              <div>
                <dt>Stock available</dt>
                <dd>
                  {fmt(product.stock)} {product.unit}
                </dd>
              </div>
              <div>
                <dt>Confirmed incoming</dt>
                <dd>
                  {fmt(product.confirmedIncoming)} {product.unit}
                </dd>
              </div>
              <div>
                <dt>Lead time</dt>
                <dd>{p.leadTimeDays} days</dd>
              </div>
              <div>
                <dt>Review interval</dt>
                <dd>{p.reviewIntervalDays} days</dd>
              </div>
              <div>
                <dt>Safety stock</dt>
                <dd>
                  {fmt(p.safetyStock)} {product.unit}
                </dd>
              </div>
              <div>
                <dt>Pack size</dt>
                <dd>
                  {fmt(p.packSize)} {product.unit}
                </dd>
              </div>
              <div>
                <dt>Minimum order</dt>
                <dd>
                  {fmt(p.minimumOrder)} {product.unit}
                </dd>
              </div>
              <div>
                <dt>Next review</dt>
                <dd>{day(p.nextReviewDate)}</dd>
              </div>
              <div>
                <dt>Approval limit</dt>
                <dd>{money(p.maxOrderSen)}</dd>
              </div>
              {p.unitPriceSen !== null && (
                <div>
                  <dt>Reference unit price</dt>
                  <dd>
                    {money(p.unitPriceSen)} per {product.unit}
                  </dd>
                </div>
              )}
              {p.shippingSen !== null && (
                <div>
                  <dt>Reference shipping</dt>
                  <dd>{money(p.shippingSen)}</dd>
                </div>
              )}
            </dl>
            {confirmedOrders.map((order) => (
              <p key={order.id}>
                {order.reference}: {fmt(order.remaining)} {order.unit} due{" "}
                {day(order.confirmedDate)}.
              </p>
            ))}
          </details>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button button-primary" type="submit">
            Calculate manual estimate
          </button>
        </form>
        <div className="whatif-result" aria-live="polite">
          {result ? (
            <>
              <span className="plain-status">Manual simulation · {day(app.demoDate)}</span>
              <h2>
                {result.suggestedQuantity > 0
                  ? `${fmt(result.suggestedQuantity)} ${product.unit} suggested`
                  : result.status === "NO_ORDER_NEEDED"
                    ? "No purchase needed"
                    : status(result.status)}
              </h2>
              <p>
                {result.orderDate
                  ? `Review the order on ${day(result.orderDate)}.`
                  : "No order is proposed for this scenario."}{" "}
                {result.coverageDays === null
                  ? "Zero expected demand: coverage has no finite end date."
                  : `Stock alone covers about ${fmt(Math.round(result.coverageDays * 10) / 10)} days.`}
              </p>
              <p>
                {result.status === "NO_ORDER_NEEDED"
                  ? "Saved stock and confirmed deliveries cover this scenario."
                  : result.status === "MONITORING"
                    ? "The saved review date has not been reached."
                    : result.status === "WAITING_EXISTING_ORDER"
                      ? "Resolve the existing purchase before ordering more."
                      : result.status === "NEEDS_REVIEW"
                        ? "Review overdue deliveries before planning another order."
                        : "Expected sales and the safety buffer need more stock."}
              </p>
              {result.status === "URGENT_REVIEW" && (
                <p className="warning">A shortage may remain before delivery. Review the timing.</p>
              )}
              {result.estimatedCostSen !== null && (
                <p>Estimated total: {money(result.estimatedCostSen)}.</p>
              )}
              <p className="subtle">
                Assumes the same daily sales throughout the week. Uses saved stock, policy and
                confirmed deliveries.
              </p>
              {result.warnings.length > 0 && (
                <p className="subtle">
                  {result.warnings
                    .map((warning) =>
                      warning ===
                      "Reference price or shipping cost is unknown. Complete costs before approval."
                        ? "Supplier cost is unknown in this scenario."
                        : warning,
                    )
                    .join(" ")}
                </p>
              )}
            </>
          ) : (
            <>
              <h2>Compare a sales scenario</h2>
              <p>Choose expected weekly sales, then calculate a manual estimate.</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
