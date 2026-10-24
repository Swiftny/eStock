"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Receipt } from "@/lib/server/estock/receiving";
import { ClearRecordsControl } from "./clear-records-control";
import styles from "./estock-app.module.css";

class ReceivingError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
async function request<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/estock/${path}`, {
    cache: "no-store",
    signal,
    ...(body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  const data = await response.json();
  if (!response.ok)
    throw new ReceivingError(
      data.error || "Could not load this receipt. Try again.",
      response.status,
    );
  return data;
}
const time = (value: string | null) =>
  value
    ? `${new Intl.DateTimeFormat("en-MY", {
        timeZone: "Asia/Kuala_Lumpur",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))} MYT`
    : "Not yet confirmed";

type Notification = {
  id: string;
  kind: string;
  receiptId: string;
  readAt: string | null;
  createdAt: string;
  actionable: boolean;
};
export function Notifications({
  role,
  onOpen,
}: {
  role: "manager" | "staff";
  onOpen: (id: string) => void;
}) {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [clearing, setClearing] = useState(false);
  const clearingRef = useRef(false);
  const notificationRevision = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: refresh restarts polling after an explicit user action.
  useEffect(() => {
    setLoading(true);
    const controller = new AbortController();
    let active = true,
      busy = false;
    const poll = async () => {
      if (busy || clearingRef.current) return;
      const revision = notificationRevision.current;
      busy = true;
      try {
        const result = await request<{ notifications: Notification[]; unread: number }>(
          "notifications",
          undefined,
          controller.signal,
        );
        if (active && revision === notificationRevision.current) {
          setItems(result.notifications);
          setUnread(result.unread);
          setError("");
        }
      } catch (cause) {
        if (active && revision === notificationRevision.current)
          setError(cause instanceof Error ? cause.message : "Notifications unavailable.");
      } finally {
        busy = false;
        if (active && revision === notificationRevision.current) setLoading(false);
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 8000);
    const focus = () => void poll();
    window.addEventListener("focus", focus);
    return () => {
      active = false;
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [refresh, role]);
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      opener.current?.focus();
    };
  }, [open]);
  return (
    <>
      <button
        type="button"
        className={`${styles.secondaryButton} ${styles.notificationTrigger}`}
        onClick={() => {
          setOpen(true);
          setRefresh((n) => n + 1);
        }}
        aria-label={`Notifications, ${unread} unread`}
      >
        Notifications{" "}
        {unread > 0 && (
          <span className={styles.navCount} aria-hidden="true">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <dialog
          ref={dialog}
          className={`${styles.dialog} ${styles.notificationDrawer}`}
          aria-labelledby="notifications-title"
          onCancel={() => setOpen(false)}
        >
          <div className={styles.dialogHead}>
            <h2 id="notifications-title">Notifications</h2>
            <button
              type="button"
              className={styles.closeButton}
              aria-label="Close notifications"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          <ClearRecordsControl
            label="Clear notifications"
            phrase="Clear Notifications"
            description="Permanently delete this account's notifications. Pending receiving checks remain available."
            disabled={!items.length || loading || clearing}
            onClear={async (confirmation) => {
              if (clearingRef.current) throw new Error("Notifications are already being cleared.");
              clearingRef.current = true;
              notificationRevision.current += 1;
              setClearing(true);
              setError("");
              try {
                const response = await fetch("/api/estock/notifications", {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ confirmation }),
                  cache: "no-store",
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || "Could not clear notifications.");
                setItems([]);
                setUnread(0);
                return `${result.deletedNotifications} notifications permanently deleted.`;
              } finally {
                clearingRef.current = false;
                setClearing(false);
                setRefresh((value) => value + 1);
              }
            }}
          />
          {loading && <p role="status">Loading notifications…</p>}
          {error && (
            <div className={styles.errorNotice} role="alert">
              <p>{error}</p>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => setRefresh((n) => n + 1)}
              >
                Retry notifications
              </button>
            </div>
          )}
          {!loading && !error && !items.length && (
            <p className={styles.quietEmpty}>No notifications yet.</p>
          )}
          <ul className={styles.notificationList}>
            {items.map((n) => (
              <li key={n.id}>
                <strong>
                  {n.kind === "DISCREPANCY"
                    ? "Receipt differences reported"
                    : n.actionable
                      ? "Receipt ready to check"
                      : "Receiving check closed"}
                </strong>
                <p>
                  {n.kind === "DISCREPANCY"
                    ? "Shared Staff confirmed the goods. Inventory is already updated."
                    : n.actionable
                      ? "Check the physical goods against the prepared receipt."
                      : "This receipt is no longer pending."}
                </p>
                <small>
                  {time(n.createdAt)}
                  {!n.readAt ? " · Unread" : ""}
                </small>
                <div className={styles.rowActions}>
                  {(n.kind === "DISCREPANCY" || n.actionable) && (
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      disabled={clearing}
                      onClick={async () => {
                        const revision = notificationRevision.current;
                        try {
                          await request(`notifications/${n.id}/read`, {});
                          if (revision !== notificationRevision.current) return;
                          setRefresh((v) => v + 1);
                          setOpen(false);
                          onOpen(n.receiptId);
                        } catch (cause) {
                          if (revision === notificationRevision.current) setError(String(cause));
                        }
                      }}
                    >
                      {role === "staff" ? "Open receiving check" : "View receipt differences"}
                    </button>
                  )}
                  {!n.readAt && (
                    <button
                      type="button"
                      className={styles.textButton}
                      disabled={clearing}
                      onClick={async () => {
                        const revision = notificationRevision.current;
                        try {
                          await request(`notifications/${n.id}/read`, {});
                          if (revision !== notificationRevision.current) return;
                          setRefresh((v) => v + 1);
                        } catch (cause) {
                          if (revision === notificationRevision.current) setError(String(cause));
                        }
                      }}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </dialog>
      )}
    </>
  );
}

export function ReceivingWorkspace({
  role,
  selectedId,
  onSelect,
  onCompleted,
}: {
  role: "manager" | "staff";
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCompleted: () => Promise<void>;
}) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [actualQuantities, setActualQuantities] = useState<Record<string, string>>({});
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const [stale, setStale] = useState(false);
  const displayedRevision = useRef<number | null>(null);
  const checking = useRef(false);
  const mutationRevision = useRef(0);
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      if (checking.current) return;
      const revision = mutationRevision.current;
      if (selectedId) {
        const result = await request<{ receipt: Receipt }>(
          `receiving/${selectedId}`,
          undefined,
          signal,
        );
        if (!signal?.aborted && revision === mutationRevision.current) {
          if (
            displayedRevision.current !== null &&
            displayedRevision.current !== result.receipt.revision
          ) {
            setStale(true);
            return;
          }
          displayedRevision.current = result.receipt.revision;
          setReceipt(result.receipt);
          setStale(false);
        }
      } else {
        const result = await request<{ receipts: Receipt[] }>("receiving", undefined, signal);
        if (!signal?.aborted) setReceipts(result.receipts);
      }
    },
    [selectedId],
  );
  useEffect(() => {
    const controller = new AbortController();
    let active = true,
      busy = false;
    setLoading(true);
    setReceipt(null);
    setError("");
    setActualQuantities({});
    setStale(false);
    displayedRevision.current = null;
    attempt.current = null;
    const poll = async () => {
      if (busy) return;
      busy = true;
      try {
        await refresh(controller.signal);
        if (active) setError("");
      } catch (cause) {
        if (active) {
          setError(String(cause instanceof Error ? cause.message : cause));
          if (cause instanceof ReceivingError && cause.status === 404) setStale(true);
        }
      } finally {
        busy = false;
        if (active) setLoading(false);
      }
    };
    void poll();
    const timer = setInterval(() => void poll(), 8000);
    const focus = () => void poll();
    window.addEventListener("focus", focus);
    return () => {
      active = false;
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [refresh]);
  const lines =
    receipt?.lines.map((line) => {
      const quantityText = actualQuantities[line.id] ?? String(line.expected);
      const actual = Number(quantityText);
      return {
        ...line,
        quantityText,
        valid: quantityText.trim() !== "" && Number.isSafeInteger(actual) && actual >= 0,
        enteredActual: actual,
      };
    }) || [];
  async function confirm() {
    if (
      !receipt ||
      checking.current ||
      pending ||
      stale ||
      !lines.length ||
      lines.some((l) => !l.valid)
    )
      return;
    checking.current = true;
    mutationRevision.current += 1;
    setPending(true);
    setError("");
    const payload = {
      expectedRevision: receipt.revision,
      confirmReceived: true,
      lines: lines.map((l) => ({
        id: l.id,
        actualQuantity: l.enteredActual,
      })),
    };
    const signature = JSON.stringify(payload);
    if (attempt.current?.signature !== signature)
      attempt.current = { signature, key: crypto.randomUUID() };
    try {
      const result = await request<{ receipt: Receipt }>(`receiving/${receipt.id}/confirm`, {
        ...payload,
        requestId: attempt.current.key,
      });
      setReceipt(result.receipt);
      attempt.current = null;
      await onCompleted();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not confirm. Try again.");
    } finally {
      checking.current = false;
      setPending(false);
    }
  }
  return (
    <>
      <div className={styles.pageHeading}>
        <div>
          <h1>{selectedId ? "Receiving check" : "Pending receiving checks"}</h1>
          <p>{selectedId ? "Review delivery details." : "View delivery checks."}</p>
        </div>
      </div>
      {loading && <p role="status">Loading receiving checks…</p>}
      {error && (
        <div className={styles.errorNotice} role="alert">
          <p>{error}</p>
          <button
            type="button"
            className={styles.textButton}
            onClick={() =>
              void refresh()
                .then(() => setError(""))
                .catch((e) => setError(String(e)))
            }
          >
            Refresh receiving check
          </button>
        </div>
      )}
      {!loading &&
        !selectedId &&
        (!receipts.length ? (
          <p className={styles.quietEmpty}>No receipts waiting for a physical check.</p>
        ) : (
          <ul className={styles.simpleList}>
            {receipts.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className={styles.simpleListButton}
                  onClick={() => onSelect(r.id)}
                >
                  <span>
                    <strong>{r.lines.map((l) => l.productName).join(", ")}</strong>
                    <small>
                      Sent {time(r.sentAt)} · {r.lines.length} lines
                    </small>
                  </span>
                  <span>Check goods</span>
                </button>
              </li>
            ))}
          </ul>
        ))}
      {stale && (
        <div className={styles.warningNotice} role="alert">
          <p>
            Manager recalled or resubmitted this receipt. Your displayed version has been kept
            unchanged. Reopen the latest check and inspect the goods again.
          </p>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={pending}
            onClick={async () => {
              displayedRevision.current = null;
              setActualQuantities({});
              attempt.current = null;
              try {
                await refresh();
                setError("");
              } catch (cause) {
                setError(
                  cause instanceof Error ? cause.message : "Receipt is not ready for checking.",
                );
              }
            }}
          >
            Reopen latest check
          </button>
        </div>
      )}
      {receipt && (
        <section aria-label="Prepared receipt">
          <p>
            Document date: {receipt.documentDate} · Manager sent {time(receipt.sentAt)}
          </p>
          {role === "staff" &&
            receipt.status === "AWAITING_STAFF" &&
            (receipt.documentType === "surat_pesanan" || receipt.documentType === "proforma") && (
              <div className={styles.warningNotice} role="status">
                <strong>Order document: confirm the goods arrived</strong>
                <p>Check each item against the physical delivery before confirming this receipt.</p>
              </div>
            )}
          {receipt.status === "RECEIVED" && (
            <p className={styles.notice} role="status">
              Shared Staff checked {time(receipt.receivedAt)}. Stock posted at confirmation
              {receipt.hasDiscrepancies ? " with differences" : ""}.
            </p>
          )}
          <div className={styles.draftLines}>
            {lines.map((line) =>
              role === "staff" && receipt.status === "AWAITING_STAFF" ? (
                <details
                  key={`${receipt.id}:${receipt.revision}:${line.id}`}
                  className={`${styles.draftLine} ${styles.receivingLine}`}
                >
                  <summary className={styles.receivingSummary}>
                    <span className={styles.receivingArrow}>
                      <svg
                        className={styles.receivingChevron}
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="m9 5 7 7-7 7" />
                      </svg>
                    </span>
                    <span className={styles.receivingSummaryText}>
                      <strong>{line.productName}</strong>
                      <span className={styles.receivingExpected}>
                        Expected: {line.expected} {line.unit}
                      </span>
                      {!line.valid ? (
                        <span className={styles.receivingInvalid}>Check received quantity</span>
                      ) : line.enteredActual !== line.expected ? (
                        <span>
                          Received: {line.enteredActual} {line.unit}
                        </span>
                      ) : null}
                    </span>
                  </summary>
                  <div className={styles.receivingEditor}>
                    <label className={styles.field}>
                      <span>How much did you receive? ({line.unit})</span>
                      <input
                        type="number"
                        min="0"
                        max={Number.MAX_SAFE_INTEGER}
                        step="1"
                        inputMode="numeric"
                        value={line.quantityText}
                        disabled={pending || stale}
                        aria-label={`How much did you receive for ${line.productName}?`}
                        aria-invalid={!line.valid}
                        aria-describedby={!line.valid ? `received-error-${line.id}` : undefined}
                        onChange={(e) =>
                          setActualQuantities((current) => ({
                            ...current,
                            [line.id]: e.target.value,
                          }))
                        }
                      />
                    </label>
                    {!line.valid && (
                      <p
                        id={`received-error-${line.id}`}
                        className={styles.errorNotice}
                        role="alert"
                      >
                        Enter a whole number of 0 or more.
                      </p>
                    )}
                  </div>
                </details>
              ) : (
                <article key={line.id} className={styles.draftLine}>
                  <h2>{line.productName}</h2>
                  <p>
                    Expected:{" "}
                    <strong>
                      {line.expected} {line.unit}
                    </strong>
                  </p>
                  {receipt.status === "RECEIVED" && (
                    <p>
                      {line.outcome === "MATCH"
                        ? "Matches"
                        : `${line.outcome === "SHORT" ? "Short" : "Extra"} by ${line.difference}`}{" "}
                      · Actually received:{" "}
                      <strong>
                        {line.actual} {line.unit}
                      </strong>
                    </p>
                  )}
                </article>
              ),
            )}
          </div>
          {role === "staff" && receipt.status === "AWAITING_STAFF" && (
            <div className={styles.approvalBox}>
              <h2>Confirm physical receipt</h2>
              <p>
                I have checked all included goods. Confirming adds the actual quantities shown above
                to inventory once.
              </p>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={pending || stale || !lines.length || lines.some((l) => !l.valid)}
                onClick={() => void confirm()}
              >
                {pending ? "Confirming…" : "Confirm received goods"}
              </button>
            </div>
          )}
        </section>
      )}
    </>
  );
}
