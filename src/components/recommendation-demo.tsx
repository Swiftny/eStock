"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  exampleDemand,
  horizonDays,
  rawNeed,
  recommendedQuantity,
  reorderExample as item,
} from "@/lib/demo-fixture";
import { Icon, StatusLabel } from "./ui";

const dialogId = "recommendation-dialog";
const reviewEvent = "estock:review-example";
type Scenario = "ready" | "history" | "unavailable" | "covered";
type Decision = { kind: "approved" | "rejected"; quantity: number; note: string };

export function DemoLaunchButton({
  children,
  className = "button button-primary",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      className={className}
      type="button"
      onClick={() => {
        const dialog = document.getElementById(dialogId);
        if (dialog instanceof HTMLDialogElement && !dialog.open) {
          dialog.dispatchEvent(new Event(reviewEvent));
        }
      }}
    >
      {children}
    </button>
  );
}

export function RecommendationDemo() {
  const [scenario, setScenario] = useState<Scenario>("ready");
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(String(recommendedQuantity));
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [errors, setErrors] = useState<{ quantity?: string; note?: string }>({});
  const [activity, setActivity] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quantityInput = useRef<HTMLInputElement>(null);
  const noteInput = useRef<HTMLTextAreaElement>(null);
  const outcomeHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const dialog = document.getElementById(dialogId);
    if (!(dialog instanceof HTMLDialogElement)) return;
    const openExample = () => {
      if (timer.current) clearTimeout(timer.current);
      setScenario("ready");
      setLoading(false);
      dialog.showModal();
    };
    dialog.addEventListener(reviewEvent, openExample);
    return () => dialog.removeEventListener(reviewEvent, openExample);
  }, []);

  useEffect(() => {
    const dialog = document.getElementById(dialogId);
    if (dialog instanceof HTMLDialogElement && dialog.open) {
      (decision ? outcomeHeading : quantityInput).current?.focus();
    }
  }, [decision]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function reset() {
    setDecision(null);
    setQuantity(String(recommendedQuantity));
    setNote("");
    setErrors({});
    setActivity([]);
  }

  function changeScenario(value: Scenario) {
    if (timer.current) clearTimeout(timer.current);
    setScenario(value);
    setLoading(true);
    reset();
    timer.current = setTimeout(() => setLoading(false), 450);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (decision) return;
    const action = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ?? "approve";
    const qty = Number(quantity);
    const nextErrors: typeof errors = {};
    if (
      action === "approve" &&
      (!quantity ||
        !Number.isSafeInteger(qty) ||
        qty < item.minimumOrder ||
        qty % item.packSize !== 0)
    ) {
      nextErrors.quantity = "Enter a positive whole number in packs of 12, such as 60 or 72.";
    }
    if ((action === "reject" || qty !== recommendedQuantity) && !note.trim()) {
      nextErrors.note =
        action === "reject"
          ? "Add a reason before rejecting this recommendation."
          : "Explain the quantity change before approving.";
    }
    if (note.trim().length > 500) nextErrors.note = "Keep the note to 500 characters or fewer.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      (nextErrors.quantity ? quantityInput : noteInput).current?.focus();
      return;
    }
    const approved = action === "approve";
    const result: Decision = {
      kind: approved ? "approved" : "rejected",
      quantity: approved ? qty : recommendedQuantity,
      note: note.trim(),
    };
    setDecision(result);
    const entries = [
      `Manager ${approved ? "approved" : "rejected"} this synthetic recommendation.`,
    ];
    if (approved && qty !== recommendedQuantity)
      entries.push(`Quantity changed from ${recommendedQuantity} to ${qty} units.`);
    if (note.trim()) entries.push(`Manager note: ${note.trim()}`);
    entries.push(
      approved
        ? "Local demo outcome recorded. No supplier request was sent."
        : "No supplier request prepared. On-hand stock is unchanged.",
    );
    setActivity(entries);
  }

  const status = decision
    ? decision.kind === "approved"
      ? "Approved in demo"
      : "Rejected in demo"
    : "Awaiting approval";
  const tone = decision ? (decision.kind === "approved" ? "success" : "danger") : "pending";

  return (
    <>
      <section
        id="recommendation-preview"
        className="recommendation-preview"
        aria-label="Interactive synthetic purchase recommendation"
      >
        <div className="preview-toolbar">
          <span className="preview-location">
            <Icon name="recommend" />
            <span>
              Replenishment<span className="breadcrumb-separator">/</span>
              <strong>Review</strong>
            </span>
          </span>
          <span className="demo-label">Synthetic demo</span>
        </div>
        <div className="preview-case-bar">
          <div>
            <span className="small-label">Recommendation preview</span>
            <h2>Weekly stock review</h2>
          </div>
          <div className="scenario-field">
            <label htmlFor="example-scenario">Example scenario</label>
            <select
              id="example-scenario"
              value={scenario}
              onChange={(event) => changeScenario(event.target.value as Scenario)}
            >
              <option value="ready">Reorder due</option>
              <option value="history">Not enough history</option>
              <option value="unavailable">Analysis unavailable</option>
              <option value="covered">No restock needed</option>
            </select>
          </div>
        </div>
        <div
          className="preview-data-region"
          aria-live="polite"
          aria-atomic="true"
          aria-busy={loading}
        >
          {loading ? (
            <div className="preview-state">
              <span className="state-mark">…</span>
              <h3>Loading the synthetic example</h3>
              <p>The demo is switching scenarios. No forecast service is called.</p>
            </div>
          ) : scenario === "ready" ? (
            <div className="recommendation-content">
              <div className="stock-evidence">
                <div className="product-identity">
                  <span className="product-symbol">
                    <Icon name="receive" />
                  </span>
                  <div>
                    <h3>{item.product}</h3>
                    <p>
                      {item.sku} <span aria-hidden="true">·</span> Base unit: unit
                    </p>
                  </div>
                </div>
                <dl className="stock-facts">
                  <div>
                    <dt>Available stock</dt>
                    <dd>
                      {item.onHand}
                      <span> units</span>
                    </dd>
                    <small>Usable on hand</small>
                  </div>
                  <div>
                    <dt>Expected demand</dt>
                    <dd>
                      {exampleDemand}
                      <span> units</span>
                    </dd>
                    <small>Next {horizonDays} days</small>
                  </div>
                  <div>
                    <dt>Incoming stock</dt>
                    <dd>
                      {item.confirmedInbound}
                      <span> units</span>
                    </dd>
                    <small>Confirmed, day {item.inboundDay}</small>
                  </div>
                </dl>
                <div className="policy-note">
                  <span>3-day lead time</span>
                  <span>7-day review</span>
                  <span>20-unit buffer</span>
                </div>
              </div>
              <div className="purchase-summary">
                <StatusLabel tone={tone}>{status}</StatusLabel>
                <p className="small-label">
                  {decision?.kind === "approved" ? "Approved quantity" : "Recommended purchase"}
                </p>
                <p className="purchase-quantity">
                  {decision?.kind === "approved" ? decision.quantity : recommendedQuantity}
                  <span> units</span>
                </p>
                <p className="pack-detail">
                  {(decision?.kind === "approved" ? decision.quantity : recommendedQuantity) /
                    item.packSize}{" "}
                  packs × {item.packSize} units
                </p>
                <DemoLaunchButton className="button button-primary preview-review-button">
                  {decision ? "View demo outcome" : "Review recommendation"}
                  <Icon name="arrow" />
                </DemoLaunchButton>
              </div>
            </div>
          ) : (
            <div className="preview-state">
              <span className="state-mark">
                <Icon name={scenario === "covered" ? "check" : "records"} />
              </span>
              <h3>
                {scenario === "history"
                  ? "No recommendation yet"
                  : scenario === "unavailable"
                    ? "Demand estimate unavailable"
                    : "No purchase to review"}
              </h3>
              <p>
                {scenario === "history"
                  ? "This example has incomplete sales history. A recommendation needs at least 28 complete days."
                  : scenario === "unavailable"
                    ? "A failed analysis must stay visible. A quantity is never invented to fill the gap."
                    : "When stock and confirmed incoming supply cover demand and the buffer, no order is needed."}
              </p>
              <button
                className="button button-outline"
                type="button"
                onClick={() => changeScenario("ready")}
              >
                {scenario === "unavailable"
                  ? "Reload the working example"
                  : "Return to the reorder example"}
              </button>
            </div>
          )}
        </div>
        <div className="preview-footer">
          <span>
            <span className="small-label">
              {scenario === "ready" && !loading ? "Example calculation" : "Synthetic scenario"}
            </span>
            {scenario === "ready" && !loading ? (
              <>
                <strong>100 + 20 − 45 − 25 = {rawNeed}</strong>
                <span className="rounding-note">
                  Rounded to {recommendedQuantity} for packs of 12
                </span>
              </>
            ) : (
              <strong>No automated purchase quantity.</strong>
            )}
          </span>
          <span className="cutoff-note">
            Daily close
            <br />
            <strong>{item.cutoff} · MYT</strong>
          </span>
        </div>
      </section>
      <p className="preview-caption">
        Fixed synthetic example. No live AI inference, supplier connection or purchase.
      </p>

      <dialog
        id={dialogId}
        className="review-dialog"
        aria-labelledby="review-title"
        aria-describedby="review-description"
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = event.currentTarget.querySelectorAll<HTMLElement>(
            "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])",
          );
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className="dialog-header">
          <span className="demo-label">Local simulation</span>
          <button
            className="button button-text"
            type="button"
            onClick={() => (document.getElementById(dialogId) as HTMLDialogElement).close()}
          >
            Close <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="dialog-body">
          <p className="small-label">Manager review</p>
          <h2 id="review-title">Review the purchase.</h2>
          <p id="review-description">
            Reorder-due example: {item.product} · {recommendedQuantity} units recommended. Nothing
            you do here sends a message or places an order.
          </p>
          <div className="dialog-calculation">
            <span>Demand + buffer − stock − confirmed inbound</span>
            <strong>100 + 20 − 45 − 25 = 50 units</strong>
            <span>50 rounds up to 60 in packs of 12.</span>
          </div>
          <div className="dialog-policy">
            <span>
              Lead time <strong>3 days</strong>
            </span>
            <span>
              Review cycle <strong>7 days</strong>
            </span>
            <span>
              On hand <strong>45 units</strong>
            </span>
          </div>
          <div className="decision-announcement" role="status" aria-atomic="true">
            {decision && (
              <>
                <StatusLabel tone={tone}>{status}</StatusLabel>
                <h3 ref={outcomeHeading} tabIndex={-1}>
                  {decision.kind === "approved"
                    ? `${decision.quantity} units approved in this demo.`
                    : "Recommendation rejected in this demo."}
                </h3>
                <p>
                  {decision.kind === "approved"
                    ? "The next step in the planned workflow is a supplier request. This local simulation records your decision only."
                    : "The manager's reason stays with the decision. No purchase follows a rejection."}{" "}
                  Available stock remains 45 units.
                </p>
              </>
            )}
          </div>
          {!decision && (
            <form noValidate onSubmit={submit}>
              <div className="form-field">
                <label htmlFor="purchase-quantity">
                  Purchase quantity <span>(units)</span>
                </label>
                <input
                  ref={quantityInput}
                  id="purchase-quantity"
                  name="quantity"
                  type="number"
                  inputMode="numeric"
                  min={item.minimumOrder}
                  step={item.packSize}
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  aria-describedby={`quantity-hint${errors.quantity ? " quantity-error" : ""}`}
                  aria-invalid={!!errors.quantity}
                />
                <p id="quantity-hint" className="field-hint">
                  Order in packs of 12. Changes require a note.
                </p>
                {errors.quantity && (
                  <p id="quantity-error" className="field-error" role="alert">
                    {errors.quantity}
                  </p>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="manager-note">
                  Manager note <span>(required for changes or rejection)</span>
                </label>
                <textarea
                  ref={noteInput}
                  id="manager-note"
                  name="note"
                  rows={3}
                  maxLength={500}
                  placeholder="Explain your decision"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  aria-invalid={!!errors.note}
                  aria-describedby={errors.note ? "note-error" : undefined}
                />
                {errors.note && (
                  <p id="note-error" className="field-error" role="alert">
                    {errors.note}
                  </p>
                )}
              </div>
              <div className="review-actions">
                <button
                  type="submit"
                  name="decision"
                  value="approve"
                  className="button button-primary"
                >
                  Approve in demo
                  <Icon name="check" />
                </button>
                <button
                  type="submit"
                  name="decision"
                  value="reject"
                  className="button button-outline"
                >
                  Reject in demo
                </button>
              </div>
            </form>
          )}
          {activity.length > 0 && (
            <div className="local-activity">
              <h3>Local activity</h3>
              <ol>
                {activity.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ol>
            </div>
          )}
          {decision && (
            <button className="button button-outline reset-button" type="button" onClick={reset}>
              Reset demo
            </button>
          )}
        </div>
      </dialog>
    </>
  );
}
