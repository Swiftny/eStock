"use client";

import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type {
  ActionName,
  ActionResult,
  AppState,
  Policy,
  Product,
  PurchaseCalculation,
  PurchaseOrder,
  Recommendation,
} from "@/lib/contracts";
import { manualEstimate } from "@/lib/purchasing";
import { Wordmark } from "./ui";

const fmt = (value: number) =>
  new Intl.NumberFormat("en-MY", { maximumFractionDigits: 3 }).format(value);
const money = (sen: number | null) =>
  sen === null
    ? "Unknown costs"
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
    MOCK_BASELINE: "Mock adapter · saved-history baseline",
    BASELINE_FALLBACK: "Baseline fallback · see the saved reason",
    BASELINE_SELECTED: "Baseline selected after model evaluation",
    RUNPOD: "RunPod model inference",
    CACHE: "Saved result replay",
  })[value || ""] || "No demand estimate";
const status = (value: string) =>
  ({
    PENDING_APPROVAL: "Ready for manager review",
    URGENT_REVIEW: "Urgent: shortage needs review",
    NO_ORDER_NEEDED: "No purchase needed",
    MONITORING: "Next review scheduled",
    NEEDS_DATA: "More complete history needed",
    NEEDS_REVIEW: "Review required",
    WAITING_EXISTING_ORDER: "Resolve the existing order",
    APPROVED: "Purchase approved",
    REJECTED: "Recommendation rejected",
    SUPERSEDED: "Stock changed: analyse again",
    APPROVED_PENDING_DISPATCH: "Ready to dispatch",
    SENT_SIMULATED: "Simulated message sent",
    SUPPLIER_CONFIRMED: "Supplier confirmed",
    PARTIALLY_RECEIVED: "Partially received",
    RECEIVED: "Received",
    CANCELLED: "Cancelled",
    DISPATCH_FAILED: "Simulated dispatch failed",
    DISPATCH_UNKNOWN: "Dispatch outcome unknown",
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

function attentionPriority(product: Product, app: AppState) {
  const current = product.recommendation?.status;
  if (current === "URGENT_REVIEW") return 0;
  if (["PENDING_APPROVAL", "NEEDS_REVIEW", "WAITING_EXISTING_ORDER"].includes(current || ""))
    return 1;
  if (
    current === "APPROVED" &&
    app.orders.some(
      (order) =>
        order.productId === product.id &&
        (!["RECEIVED", "CANCELLED"].includes(order.status) || order.damageOpen),
    )
  )
    return 1;
  if (!current || ["NEEDS_DATA", "SUPERSEDED"].includes(current)) return 2;
  return 3;
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
        defaultValue={value}
        required={required}
        step={step}
        min={min}
        max={max}
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
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} name={name} defaultValue={value}>
        {children}
      </select>
    </label>
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
}: {
  action: ActionName;
  run: RunAction;
  fixed?: Record<string, unknown>;
  children: ReactNode;
  submit: string;
  className?: string;
  onSaved?: (result: ActionResult) => void;
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
      const result = await run(action, input, attempt.current.key, action !== "closeDay");
      setSaved(result.message);
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
        <button className="button button-primary" type="submit">
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
      <Field
        name="unitPriceSen"
        label="Reference price per base unit (MYR sen)"
        type="number"
        value={p?.unitPriceSen ?? undefined}
        min={0}
        step={1}
        required={false}
        help="100 sen = MYR 1.00. Blank means unknown."
      />
      <Field
        name="shippingSen"
        label="Shipping per order (MYR sen)"
        type="number"
        value={p?.shippingSen ?? undefined}
        min={0}
        step={1}
        required={false}
        help="Enter 0 only when known to be zero."
      />
      <Field
        name="maxOrderSen"
        label="Approval limit (MYR sen)"
        type="number"
        value={p?.maxOrderSen ?? 200000}
        min={1}
        step={1}
      />
      <Field
        name="nextReviewDate"
        label="Next routine review"
        type="date"
        value={p?.nextReviewDate ?? app.demoDate}
      />
    </div>
  );
}

function Calculation({
  calc,
  product,
  rec,
}: {
  calc: PurchaseCalculation;
  product?: Product;
  rec?: Recommendation;
}) {
  const unit = product?.unit || "units";
  return (
    <div className="calculation-detail">
      <dl className="detail-list">
        <div>
          <dt>Daily / weekly demand</dt>
          <dd>
            {fmt(calc.dailyDemand)} / {fmt(calc.weeklyDemand)} {unit}
          </dd>
        </div>
        <div>
          <dt>Coverage from stock alone</dt>
          <dd>
            {calc.coverageDays === null
              ? "No demand in this estimate"
              : `${fmt(calc.coverageDays)} days`}
          </dd>
        </div>
        <div>
          <dt>Safety threshold reached</dt>
          <dd>{day(calc.safetyDate)}</dd>
        </div>
        <div>
          <dt>Stockout without a new order</dt>
          <dd>{day(calc.stockoutDate)}</dd>
        </div>
        <div>
          <dt>Suggested ordering date</dt>
          <dd>{calc.orderDate ? day(calc.orderDate) : "No new purchase proposed"}</dd>
        </div>
        <div>
          <dt>Expected arrival if ordered now</dt>
          <dd>{day(calc.arrivalDate)}</dd>
        </div>
        <div>
          <dt>Protection period</dt>
          <dd>
            {calc.horizonDays} days ({calc.effectiveReviewDays} review days + lead time)
          </dd>
        </div>
        {product && Number.isFinite(calc.usableStock) && (
          <div>
            <dt>Demand + safety − stock − eligible inbound</dt>
            <dd>
              {fmt(calc.demand)} + {fmt(calc.safetyStock)} − {fmt(calc.usableStock)} −{" "}
              {fmt(calc.eligibleInbound)}
            </dd>
          </div>
        )}
        <div>
          <dt>Raw need / packaged order</dt>
          <dd>
            {fmt(calc.rawQuantity)} / {fmt(calc.suggestedQuantity)} {unit}
          </dd>
        </div>
        <div>
          <dt>Packaging</dt>
          <dd>
            {fmt(calc.packs)} packs of {calc.packSize ?? product?.policy.packSize} {unit}
          </dd>
        </div>
      </dl>
      {rec && (
        <p className="subtle">
          {source(rec.source)}. Data through {day(rec.cutoffDate)}. Decision date{" "}
          {day(rec.decisionDate)}. Daily boundary estimate; no arrival-hour promise.
        </p>
      )}
      <details>
        <summary>Projected daily stock</summary>
        <p className="subtle">
          Opening stock + confirmed incoming − estimated demand. Negative balances indicate unmet
          demand, not physical negative stock.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Demand</th>
                <th>Incoming</th>
                <th>Without order</th>
                <th>With order</th>
              </tr>
            </thead>
            <tbody>
              {calc.projections.slice(0, Math.max(30, calc.horizonDays)).map((d) => (
                <tr key={d.date}>
                  <th scope="row">{d.date}</th>
                  <td>{fmt(d.demand)}</td>
                  <td>{fmt(d.inbound)}</td>
                  <td>{fmt(d.closingStock)}</td>
                  <td>{fmt(d.withOrder)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function History({ product }: { product: Product }) {
  return (
    <details>
      <summary>Sales history and weekly totals</summary>
      {!product.history.length && (
        <p>
          No saved sales history yet. Record sales and close complete days, or import history dated
          before the ledger start.
        </p>
      )}
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
  const [ack, setAck] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const decisionAttempt = useRef<{ signature: string; key: string } | null>(null);
  useEffect(() => {
    opener.current = document.activeElement;
    dialog.current?.showModal();
    return () => {
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
  }, []);
  const p = product.policy;
  const reviewWarnings = [
    ...rec.warnings,
    ...(Number(amount) < (rec.calculation?.suggestedQuantity || 0)
      ? [
          "This is below the suggested quantity. Coverage may be insufficient; review the calculation before approving.",
        ]
      : []),
  ];
  const total =
    p.unitPriceSen === null || p.shippingSen === null || !Number.isFinite(Number(amount))
      ? null
      : Math.round(Number(amount) * p.unitPriceSen) + p.shippingSen;
  async function decide(decision: "approve" | "reject") {
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
    } finally {
      setPending(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="app-dialog"
      onCancel={close}
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
        <p>Manager review · synthetic purchase</p>
        <button type="button" className="button button-text" onClick={close}>
          Close
        </button>
      </div>
      <h2 id="review-title">Order {product.name}?</h2>
      <p>{rec.reason}</p>
      <dl className="review-facts">
        <div>
          <dt>Supplier</dt>
          <dd>{app.suppliers.find((s) => s.id === p.supplierId)?.name}</dd>
        </div>
        <div>
          <dt>Estimated total</dt>
          <dd>{money(total)}</dd>
        </div>
        <div>
          <dt>Expected arrival</dt>
          <dd>{day(rec.calculation?.arrivalDate || null)}</dd>
        </div>
        <div>
          <dt>Packaging / minimum</dt>
          <dd>
            {p.packSize} {product.unit} per pack / {p.minimumOrder} {product.unit}
          </dd>
        </div>
      </dl>
      <p className="subtle">
        Reference prices, not a supplier quotation. Approval creates one purchase order and a
        simulated message; it does not add physical stock.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void decide("approve");
        }}
      >
        <fieldset disabled={pending}>
          <label className="field">
            Quantity ({product.unit})
            <input
              type="number"
              min={10 ** -product.precision}
              step={10 ** -product.precision}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setAck(false);
              }}
              required
            />
          </label>
          <label className="field">
            Reason (required for a change or rejection)
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          </label>
          {reviewWarnings.length > 0 && (
            <div className="warning">
              <ul>
                {reviewWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
              <label className="check-field">
                <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />I
                have reviewed these warnings and the estimate source.
              </label>
            </div>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button type="submit" className="button button-primary">
              {pending ? "Recording…" : "Confirm approval"}
            </button>
            <button
              type="button"
              className="button button-outline"
              onClick={() => void decide("reject")}
            >
              Reject with reason
            </button>
          </div>
        </fieldset>
      </form>
    </dialog>
  );
}

export function DemoApp() {
  const [app, setApp] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSession, setNeedsSession] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [view, setView] = useState("today");
  const [selectedId, setSelectedId] = useState("product-cartons");
  const [review, setReview] = useState<{ product: Product; rec: Recommendation } | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/demo", { cache: "no-store" });
      const data = await r.json();
      if (r.status === 401) {
        setNeedsSession(true);
        return;
      }
      if (!r.ok) throw new Error(data.error);
      setApp(data);
      setNeedsSession(false);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load stock records.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function run(
    action: ActionName,
    input: Record<string, unknown>,
    key = crypto.randomUUID(),
    quiet = false,
  ): Promise<ActionResult> {
    const r = await fetch("/api/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, input, key }),
    });
    const result = await r.json();
    if (!r.ok) {
      if (r.status === 401) setNeedsSession(true);
      throw new Error(result.error || "Could not save.");
    }
    setApp(result.state);
    setFeedback(quiet ? "" : result.message);
    return result;
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
    setBusy(true);
    setError("");
    const data = values(event.currentTarget);
    try {
      const r = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not choose role.");
    } finally {
      setBusy(false);
    }
  }
  const product = app?.products.find((p) => p.id === selectedId) || app?.products[0];
  return (
    <div className="demo-shell">
      <a className="skip-link" href="#app-main">
        Skip to stock workspace
      </a>
      <header className="app-header">
        <a href="/" className="home-link" aria-label="eStock landing page">
          <Wordmark />
        </a>
        <span>Synthetic workspace</span>
        {app && !needsSession && (
          <button
            type="button"
            className="button button-text"
            onClick={() => setNeedsSession(true)}
          >
            Demo {app.role}
          </button>
        )}
      </header>
      {needsSession ? (
        <main id="app-main" className="session-panel">
          <p className="eyebrow">Local synthetic demo</p>
          <h1>Choose your role.</h1>
          <p>
            Saved stock, purchases and activity are shared across these demo roles. This role
            selector simulates identity; permissions are checked on the server.
          </p>
          <form className="app-form" onSubmit={login}>
            <Select label="Demo role" name="role" value="manager">
              <option value="manager">Manager · review and approve</option>
              <option value="staff">Stock staff · record and receive</option>
            </Select>
            <Field
              label="Demo access code (if configured)"
              name="accessCode"
              type="password"
              required={false}
            />
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
      ) : app && product ? (
        <>
          <nav className="app-nav" aria-label="Workspace">
            {[
              ["today", "Needs attention"],
              ["stock", "Stock records"],
              ["orders", "Purchase orders"],
              ["whatif", "What-if"],
              ["activity", "Activity"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-current={view === key ? "page" : undefined}
                onClick={() => {
                  setView(key);
                  setError("");
                  setFeedback("");
                }}
              >
                {label}
              </button>
            ))}
          </nav>
          <main id="app-main" className="app-main" tabIndex={-1}>
            <div className="workspace-context">
              <span>{app.organisation.name}</span>
              <span>Open day: {day(app.demoDate)} · MYT</span>
            </div>
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
            {view === "today" && (
              <>
                <div className="page-heading">
                  <div>
                    <h1>What needs attention?</h1>
                    <p>Review a purchase, resolve an order or check the latest closing stock.</p>
                  </div>
                  <button
                    className="button button-outline"
                    type="button"
                    disabled={busy}
                    onClick={() => void quick("analyse", { productId: product.id })}
                  >
                    {busy ? "Analysing…" : "Analyse selected stock"}
                  </button>
                </div>
                <label className="product-selector">
                  Product to analyse
                  <select value={product.id} onChange={(e) => setSelectedId(e.target.value)}>
                    {app.products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="attention-list">
                  {[...app.products]
                    .sort((a, b) => attentionPriority(a, app) - attentionPriority(b, app))
                    .map((p) => {
                      const r = p.recommendation;
                      const calc = r?.calculation;
                      const linkedOrder = app.orders.find(
                        (order) => order.recommendationId === r?.id,
                      );
                      const canReview =
                        r && ["PENDING_APPROVAL", "URGENT_REVIEW"].includes(r.status);
                      const pending = app.analyses.find(
                        (a) => a.productId === p.id && a.status === "PENDING",
                      );
                      return (
                        <article className="attention-row" key={p.id}>
                          <div>
                            <span
                              className={`plain-status ${r?.status === "URGENT_REVIEW" ? "urgent" : ""}`}
                            >
                              {r?.status === "APPROVED" && linkedOrder
                                ? status(linkedOrder.status)
                                : r
                                  ? status(r.status)
                                  : "Ready for first analysis"}
                            </span>
                            <h2>{p.name}</h2>
                            <p>
                              {r?.status === "APPROVED" && linkedOrder
                                ? `${linkedOrder.reference}: ${fmt(linkedOrder.remaining)} ${p.unit} remain to receive. Stock remaining: ${fmt(p.stock)} ${p.unit}.${linkedOrder.damageOpen ? " Damaged goods need manager review." : ""}`
                                : r?.status === "REJECTED"
                                  ? `Purchase rejected. ${r.decisionReason || "The decision is recorded in Activity."} Next routine review: ${day(p.policy.nextReviewDate)}.`
                                  : calc && r?.status !== "SUPERSEDED"
                                    ? `${calc.orderDate ? `Review ${day(calc.orderDate)}. ` : ""}${calc.suggestedQuantity > 0 ? `Suggested order: ${fmt(calc.suggestedQuantity)} ${p.unit}. ` : ""}${r?.reason}`
                                    : `${fmt(p.stock)} ${p.unit} remaining. ${p.stock <= p.policy.safetyStock ? "Stock is at or below your safety threshold. " : ""}Analyse completed daily records for a purchase recommendation.`}
                            </p>
                            {calc && (
                              <p className="subtle">
                                {source(r?.source || null)} · Data through{" "}
                                {day(r?.cutoffDate || null)}
                              </p>
                            )}
                          </div>
                          <div className="row-action">
                            {pending ? (
                              <button
                                type="button"
                                className="button button-outline"
                                disabled={busy}
                                onClick={() =>
                                  void quick("pollAnalysis", { analysisId: pending.id })
                                }
                              >
                                Check pending analysis
                              </button>
                            ) : canReview && app.role === "manager" ? (
                              <button
                                className="button button-primary"
                                type="button"
                                onClick={() => setReview({ product: p, rec: r })}
                              >
                                Review purchase
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="button button-outline"
                                onClick={() => {
                                  setSelectedId(p.id);
                                  setView(
                                    r?.status === "WAITING_EXISTING_ORDER" ||
                                      r?.status === "APPROVED"
                                      ? "orders"
                                      : "stock",
                                  );
                                }}
                              >
                                {canReview
                                  ? "View for manager"
                                  : r && ["WAITING_EXISTING_ORDER", "APPROVED"].includes(r.status)
                                    ? "Follow purchase order"
                                    : "View stock"}
                              </button>
                            )}
                          </div>
                          {r && (
                            <details className="row-details">
                              <summary>Calculation and supporting records</summary>
                              <p>{r.reason}</p>
                              {r.warnings.length > 0 && (
                                <ul className="warning-list">
                                  {r.warnings.map((w) => (
                                    <li key={w}>{w}</li>
                                  ))}
                                </ul>
                              )}
                              {calc && <Calculation calc={calc} product={p} rec={r} />}
                              <History product={p} />
                              <details>
                                <summary>Analysis method and saved metadata</summary>
                                {app.analyses
                                  .filter((a) => a.productId === p.id)
                                  .slice(0, 5)
                                  .map((a) => (
                                    <div key={a.id} className="metadata-block">
                                      <p>
                                        {a.status} · {source(a.source)}
                                      </p>
                                      <p>
                                        {a.modelId || "No model"} · revision{" "}
                                        {a.modelRevision || "unavailable"}
                                      </p>
                                      <p>
                                        Cutoff {a.cutoffDate} · {a.generatedAt} · runtime{" "}
                                        {a.forecast?.runtimeMs ?? "unavailable"} ms
                                      </p>
                                      {a.error && <p className="warning">{a.error}</p>}
                                      <p>Input hash: {a.inputHash}</p>
                                      {a.forecast?.evaluation && (
                                        <pre>{JSON.stringify(a.forecast.evaluation, null, 2)}</pre>
                                      )}
                                    </div>
                                  ))}
                              </details>
                            </details>
                          )}
                        </article>
                      );
                    })}
                </div>
                <p className="app-footnote">
                  Recorded-data analysis uses complete saved synthetic days. Forecast mode:{" "}
                  {app.forecastMode === "MOCK"
                    ? "mock adapter, no AI inference"
                    : "RunPod adapter configured"}
                  . Weekly guesses belong in What-if.
                </p>
              </>
            )}
            {view === "stock" && (
              <StockView app={app} product={product} selected={setSelectedId} run={run} />
            )}
            {view === "orders" && <OrdersView app={app} run={run} />}
            {view === "whatif" && <WhatIf demoDate={app.demoDate} />}
            {view === "activity" && (
              <>
                <div className="page-heading">
                  <div>
                    <h1>Activity history</h1>
                    <p>Recorded actions, decisions and stock changes. Times shown in MYT.</p>
                  </div>
                </div>
                <ol className="activity-timeline">
                  {app.activity.map((event) => (
                    <li key={event.id}>
                      <div>
                        <strong>{event.action}</strong>
                        <time dateTime={event.at}>
                          {new Date(event.at).toLocaleString("en-MY", {
                            timeZone: "Asia/Kuala_Lumpur",
                          })}{" "}
                          · {event.actor}
                        </time>
                      </div>
                      <p>{event.detail}</p>
                      <details>
                        <summary>Before and after record</summary>
                        <pre>
                          {JSON.stringify({ before: event.before, after: event.after }, null, 2)}
                        </pre>
                      </details>
                    </li>
                  ))}
                </ol>
              </>
            )}
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
        </>
      ) : (
        <main id="app-main" className="session-panel">
          <h1>{loading ? "Opening stock records…" : "Could not load the workspace"}</h1>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {!loading && (
            <button className="button button-primary" type="button" onClick={() => void refresh()}>
              Retry loading
            </button>
          )}
        </main>
      )}
    </div>
  );
}

function StockView({
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
  const [preview, setPreview] = useState<ActionResult["preview"]>();
  const [csv, setCsv] = useState("");
  const [importType, setImportType] = useState("history");
  const [allowCorrections, setAllowCorrections] = useState(false);
  const [correctionReason, setCorrectionReason] = useState("");
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Record stock activity</h1>
          <p>Sales reduce physical stock once. Receiving stays with its purchase order.</p>
        </div>
      </div>
      <label className="product-selector">
        Product
        <select value={product.id} onChange={(e) => selected(e.target.value)}>
          {app.products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="stock-context">
        <strong>
          {fmt(product.stock)} {product.unit}
          <span>Stock remaining</span>
        </strong>
        <p>
          {fmt(product.confirmedIncoming)} {product.unit} supplier-confirmed incoming
          <br />
          Ledger starts {day(product.ledgerStartDate)}
        </p>
      </div>
      <section className="entry-sheet" key={product.id}>
        <h2>Record a sale or outgoing stock</h2>
        <ActionForm
          action="recordMovement"
          run={run}
          fixed={{ productId: product.id, unit: product.unit, sourceEventId: eventId }}
          submit="Save stock movement"
          onSaved={() => setEventId(crypto.randomUUID())}
        >
          <div className="form-grid">
            <Select label="Movement type" name="type" value="SALE">
              <option value="SALE">Sale</option>
              <option value="INTERNAL_USE">Internal use</option>
              <option value="DAMAGE_OR_LOSS">Damage or loss</option>
              <option value="CUSTOMER_RETURN_USABLE">Usable customer return</option>
              {app.role === "manager" && (
                <>
                  <option value="ADJUSTMENT_IN">Manager adjustment in</option>
                  <option value="ADJUSTMENT_OUT">Manager adjustment out</option>
                </>
              )}
            </Select>
            <Field
              label={`Quantity (${product.unit})`}
              name="quantity"
              type="number"
              min={10 ** -product.precision}
              step={10 ** -product.precision}
            />
            <Field
              label="Business date"
              name="date"
              type="date"
              value={app.demoDate}
              min={app.demoDate}
              max={app.demoDate}
            />
            <Field
              label="Synthetic reference"
              name="reference"
              help="For example, SALE-001. Use a new reference for each event."
            />
          </div>
          <Field label="Reason (required except for sales)" name="reason" required={false} />
          <details>
            <summary>Transaction identifier</summary>
            <p className="subtle">
              {eventId}. Retries of this saved source event cannot post stock twice.
            </p>
          </details>
          <p className="subtle">
            The demand model uses sales only. Internal consumption does not have its own model in
            this MVP.
          </p>
        </ActionForm>
      </section>
      <details className="workspace-details">
        <summary>Close the day and prepare analysis</summary>
        <p>
          Confirm all products’ sales for {day(app.demoDate)} are complete. This explicitly records
          zero-sales days and advances the demo clock by one day. You cannot add transactions to a
          closed day.
        </p>
        <ActionForm
          key={app.demoDate}
          action="closeDay"
          run={run}
          fixed={{ date: app.demoDate }}
          submit={`Close ${day(app.demoDate)}`}
        >
          <label className="check-field">
            <input name="confirmComplete" type="checkbox" required />
            All sales records for this day are complete, including products with zero sales.
          </label>
          <fieldset>
            <legend>Stockouts during the day, even if later replenished</legend>
            <p className="subtle">
              Select any affected products. Zero closing stock is flagged automatically.
            </p>
            {app.products.map((p) => (
              <label className="check-field" key={p.id}>
                <input type="checkbox" name="stockoutProductIds" value={p.id} />
                {p.name}
              </label>
            ))}
          </fieldset>
        </ActionForm>
      </details>
      <History product={product} />
      <details className="workspace-details">
        <summary>Stock movements for {product.name}</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Movement</th>
                <th>Quantity ({product.unit})</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {app.movements
                .filter((m) => m.productId === product.id)
                .map((m) => (
                  <tr key={m.id}>
                    <th scope="row">{m.date}</th>
                    <td>{status(m.type)}</td>
                    <td>{fmt(m.quantity)}</td>
                    <td>{m.reference}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
      {app.role === "manager" && (
        <>
          <details className="workspace-details">
            <summary>Purchasing configuration</summary>
            <ActionForm
              key={`${product.id}:${product.policy.version}`}
              run={run}
              action="updatePolicy"
              fixed={{ productId: product.id, expectedVersion: product.policy.version }}
              submit="Save purchasing policy"
            >
              <PolicyFields p={product.policy} state={app} precision={product.precision} />
            </ActionForm>
          </details>
          <details className="workspace-details">
            <summary>Create a synthetic product</summary>
            <ActionForm
              run={run}
              action="createProduct"
              submit="Create product"
              onSaved={(r) => r.entityId && selected(r.entityId)}
            >
              <div className="form-grid">
                <Field name="sku" label="Unique synthetic SKU" />
                <Field name="name" label="Product name" />
                <Field name="unit" label="Base unit (for example units, kg)" />
                <Select name="precision" label="Quantity precision">
                  <option value="0">Whole units</option>
                  <option value="1">1 decimal place</option>
                  <option value="2">2 decimal places</option>
                  <option value="3">3 decimal places</option>
                </Select>
                <Field
                  name="openingStock"
                  label="Opening stock"
                  type="number"
                  step="0.001"
                  min={0}
                  value={0}
                />
              </div>
              <label className="check-field">
                <input name="createOpening" type="checkbox" defaultChecked />
                Create this opening balance now. Uncheck only when an opening CSV will supply it.
              </label>
              <PolicyFields state={app} precision={3} />
              <p className="subtle">
                The unit and precision are permanent for this SKU. Enter synthetic records only.
              </p>
            </ActionForm>
          </details>
          <details className="workspace-details">
            <summary>Import synthetic CSV</summary>
            <p className="subtle">
              History imports must precede the ledger start. Opening imports only accept an
              uninitialised product. Preview validates every row; import revalidates atomically.
            </p>
            <a className="inline-link" href="/fixtures/history-example.csv" download>
              Download history CSV example
            </a>
            <ActionForm
              run={run}
              action="previewImport"
              fixed={{ type: importType, csv, allowCorrections, correctionReason }}
              submit="Preview CSV"
              onSaved={(r) => setPreview(r.preview)}
            >
              <label className="field">
                Import type
                <select
                  value={importType}
                  onChange={(e) => {
                    setImportType(e.target.value);
                    setPreview(undefined);
                  }}
                >
                  <option value="history">Daily sales history</option>
                  <option value="opening">Opening balance movements</option>
                </select>
              </label>
              <label className="field">
                Choose a CSV file
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCsv(await file.text());
                      setPreview(undefined);
                    }
                  }}
                />
              </label>
              <label className="field">
                CSV content
                <textarea
                  value={csv}
                  onChange={(e) => {
                    setCsv(e.target.value);
                    setPreview(undefined);
                  }}
                  rows={5}
                  required
                />
              </label>
              <details>
                <summary>Required CSV headers</summary>
                <pre>
                  {importType === "history"
                    ? "source_record_id,sku,business_date,quantity_sold,data_complete,stockout_flag"
                    : "source_event_id,sku,occurred_at,movement_type,quantity,reference,reason"}
                </pre>
              </details>
              {importType === "history" && (
                <details>
                  <summary>Correct an existing history record</summary>
                  <label className="check-field">
                    <input
                      type="checkbox"
                      checked={allowCorrections}
                      onChange={(e) => {
                        setAllowCorrections(e.target.checked);
                        setPreview(undefined);
                      }}
                    />
                    Replace matching source IDs as reviewed corrections. Preserve SKU and date.
                  </label>
                  <label className="field">
                    Correction reason
                    <textarea
                      value={correctionReason}
                      onChange={(e) => {
                        setCorrectionReason(e.target.value);
                        setPreview(undefined);
                      }}
                      maxLength={500}
                    />
                  </label>
                </details>
              )}
            </ActionForm>
            {preview && (
              <div className="import-result">
                <p>
                  {preview.rows} rows · {preview.duplicates} identical duplicates ·{" "}
                  {preview.corrections || 0} corrections ·{" "}
                  {preview.valid ? "Valid" : "Fix errors before importing"}
                </p>
                {preview.errors.map((e) => (
                  <p className="form-error" key={`${e.row}:${e.message}`}>
                    Row {e.row}: {e.message}
                  </p>
                ))}
                {preview.valid && (
                  <ActionForm
                    run={run}
                    action="commitImport"
                    fixed={{ type: importType, csv, allowCorrections, correctionReason }}
                    submit="Import validated CSV"
                  >
                    <p>Imported aggregate history never changes physical stock.</p>
                  </ActionForm>
                )}
              </div>
            )}
          </details>
        </>
      )}
    </>
  );
}

function OrdersView({ app, run }: { app: AppState; run: RunAction }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Follow the next delivery</h1>
          <p>
            Approval, simulated dispatch, supplier acknowledgement and receiving are separate
            events.
          </p>
        </div>
      </div>
      {!app.orders.length && (
        <div className="empty-state">
          <h2>No purchase orders yet.</h2>
          <p>
            Approve a valid recommendation in Needs attention to create one order and one outbox
            message.
          </p>
        </div>
      )}
      {app.orders.map((order) => (
        <OrderRow key={order.id} order={order} app={app} run={run} />
      ))}
    </>
  );
}
function OrderRow({ order, app, run }: { order: PurchaseOrder; app: AppState; run: RunAction }) {
  const product = app.products.find((p) => p.id === order.productId);
  const outbox = app.outbox.find((m) => m.orderId === order.id);
  const [receiptId, setReceiptId] = useState(() => crypto.randomUUID());
  if (!product) return null;
  return (
    <article className="order-sheet">
      <span className="plain-status">
        {status(order.status)}
        {order.damageOpen ? " · Damaged goods need manager review" : ""}
      </span>
      <div className="order-heading">
        <h2>{product.name}</h2>
        <span>{order.reference}</span>
      </div>
      <p>
        {fmt(order.quantity)} {order.unit} ordered · {fmt(order.remaining)} remaining ·{" "}
        {money(order.estimatedCostSen)}
      </p>
      <p>
        Expected delivery: {day(order.confirmedDate || order.expectedDate)}{" "}
        {order.confirmedDate ? "(supplier confirmed)" : "(requested, unconfirmed)"}
      </p>
      {app.role === "manager" &&
        ["APPROVED_PENDING_DISPATCH", "DISPATCH_FAILED"].includes(order.status) && (
          <ActionForm
            run={run}
            action="dispatch"
            fixed={{ orderId: order.id }}
            submit={
              order.status === "DISPATCH_FAILED"
                ? "Retry simulated dispatch"
                : "Dispatch to simulator"
            }
          >
            <p className="subtle">SIMULATED channel. No real messages are sent.</p>
            <details>
              <summary>Test dispatch failure</summary>
              <label className="check-field">
                <input type="checkbox" name="simulateFailure" />
                Save a simulated failure, then retry this same message.
              </label>
            </details>
          </ActionForm>
        )}
      {app.role === "manager" &&
        ["SENT_SIMULATED", "SUPPLIER_CONFIRMED", "PARTIALLY_RECEIVED"].includes(order.status) && (
          <details open={order.status === "SENT_SIMULATED"}>
            <summary>
              {order.status === "SENT_SIMULATED"
                ? "Record synthetic supplier acknowledgement"
                : "Update confirmed arrival date"}
            </summary>
            <ActionForm
              action="confirmOrder"
              run={run}
              fixed={{ orderId: order.id }}
              submit="Save synthetic acknowledgement"
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
                />
                <Field name="reference" label="Synthetic acknowledgement reference" />
              </div>
              <label className="check-field">
                <input type="checkbox" name="confirmApprovedTerms" required />
                Quantity and price match the approved request. This is a synthetic supplier event.
              </label>
            </ActionForm>
          </details>
        )}
      {["SUPPLIER_CONFIRMED", "PARTIALLY_RECEIVED"].includes(order.status) && (
        <details open>
          <summary>Receive goods against this order</summary>
          <ActionForm
            action="receive"
            run={run}
            fixed={{ orderId: order.id, unit: product.unit, sourceEventId: receiptId }}
            submit="Record goods received"
            onSaved={() => setReceiptId(crypto.randomUUID())}
          >
            <div className="form-grid">
              <Field
                name="usable"
                label={`Usable quantity (${order.unit})`}
                type="number"
                value={0}
                min={0}
                step={10 ** -product.precision}
              />
              <Field
                name="damaged"
                label={`Damaged quantity (${order.unit})`}
                type="number"
                value={0}
                min={0}
                step={10 ** -product.precision}
              />
              <Field
                name="date"
                label="Received on"
                type="date"
                value={app.demoDate}
                min={app.demoDate}
                max={app.demoDate}
              />
              <Field name="reference" label="Synthetic receipt evidence/reference" />
            </div>
            <p className="subtle">
              Only usable goods increase stock. Usable + damaged reduce the remaining order. Receipt
              reference is recorded with this receipt.
            </p>
          </ActionForm>
        </details>
      )}
      <details>
        <summary>SIMULATED supplier outbox and receipts</summary>
        {outbox && (
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

function WhatIf({ demoDate }: { demoDate: string }) {
  const [result, setResult] = useState<PurchaseCalculation | null>(null);
  const [inputs, setInputs] = useState<{
    safetyStock: number;
    stock: number;
    packSize: number;
    unitPriceSen: number | null;
  } | null>(null);
  const [error, setError] = useState("");
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const v = values(event.currentTarget);
    setError("");
    try {
      const input = {
        stock: Number(v.stock),
        weeklySales: Number(v.weeklySales),
        leadTimeDays: Number(v.leadTimeDays),
        reviewIntervalDays: Number(v.reviewIntervalDays),
        safetyStock: Number(v.safetyStock),
        packSize: Number(v.packSize),
        minimumOrder: Number(v.minimumOrder),
        unitPriceSen: v.unitPriceSen === null ? null : Number(v.unitPriceSen),
        date: demoDate,
      };
      setResult(manualEstimate(input));
      setInputs(input);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Check scenario inputs.");
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>What if sales change?</h1>
          <p>
            Manual estimate. Scenario inputs stay separate from saved stock and sales. This is
            arithmetic, not an AI forecast.
          </p>
        </div>
      </div>
      <div className="whatif-layout">
        <form className="app-form entry-sheet" onSubmit={calculate}>
          <div className="form-grid">
            <Field
              label="Current stock (units)"
              name="stock"
              type="number"
              value={45}
              min={0}
              step="0.001"
            />
            <Field
              label="Expected weekly sales (units)"
              name="weeklySales"
              type="number"
              value={70}
              min={0}
              step="0.001"
            />
            <Field
              label="Supplier lead time (days)"
              name="leadTimeDays"
              type="number"
              value={3}
              min={1}
              max={14}
            />
            <Select name="reviewIntervalDays" label="Review interval" value="7">
              <option value="7">7 days</option>
              <option value="30">30 days</option>
            </Select>
            <Field
              label="Safety stock (units)"
              name="safetyStock"
              type="number"
              value={20}
              min={0}
              step="0.001"
            />
            <Field
              label="Units per pack"
              name="packSize"
              type="number"
              value={12}
              min={0.001}
              step="0.001"
            />
            <Field
              label="Minimum order (units)"
              name="minimumOrder"
              type="number"
              value={12}
              min={0}
              step="0.001"
            />
            <Field
              label="Reference unit price (MYR sen)"
              name="unitPriceSen"
              type="number"
              min={0}
              step={1}
              required={false}
            />
          </div>
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
              <span className="plain-status">Manual estimate · {day(demoDate)}</span>
              <h2>
                {result.suggestedQuantity > 0
                  ? `${fmt(result.suggestedQuantity)} units suggested`
                  : "No purchase needed"}
              </h2>
              <p>
                {result.orderDate
                  ? `Review the order on ${day(result.orderDate)}.`
                  : "No order is proposed for this scenario."}{" "}
                {result.coverageDays === null
                  ? "Zero expected demand: coverage has no finite end date."
                  : `Stock alone covers about ${fmt(result.coverageDays)} days.`}
              </p>
              <p>{result.reason}</p>
              <ul className="warning-list">
                {result.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
              <p className="subtle">
                Assumes constant weekly demand, no incoming orders and review due today. Shipping is
                unknown. No operational records are saved.
              </p>
              <details>
                <summary>Calculation, dates and daily projection</summary>
                <p>
                  Stock {inputs?.stock}; safety stock {inputs?.safetyStock}; daily demand is weekly
                  demand ÷ 7. Estimated merchandise cost excludes unknown shipping.
                </p>
                <Calculation calc={result} />
                <p>
                  Packaging: {inputs?.packSize} units per pack. Merchandise reference:{" "}
                  {money(
                    inputs?.unitPriceSen === null || inputs?.unitPriceSen === undefined
                      ? null
                      : Math.round(result.suggestedQuantity * inputs.unitPriceSen),
                  )}
                  . Shipping is not included.
                </p>
              </details>
            </>
          ) : (
            <>
              <h2>Try your own numbers.</h2>
              <p>See when stock reaches your buffer and how packaging affects the next purchase.</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
