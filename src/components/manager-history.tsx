"use client";

import { useEffect, useState } from "react";
import { type HistoryMovement, matchesHistorySearch, receiptHistory } from "@/lib/estock-history";
import type { Receipt } from "@/lib/server/estock/receiving";
import styles from "./estock-app.module.css";

export function ManagerHistory({
  movements,
  onRefresh,
  formatDate,
  formatTime,
}: {
  movements: HistoryMovement[];
  onRefresh: () => Promise<void>;
  formatDate: (value: string | null | undefined) => string;
  formatTime: (value: string | null | undefined) => string;
}) {
  const [received, setReceived] = useState<Receipt[]>([]);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [section, setSection] = useState<"receipts" | "activity">("receipts");
  const [receiptSearch, setReceiptSearch] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [activitySearch, setActivitySearch] = useState("");
  const [activityType, setActivityType] = useState("ALL");
  useEffect(() => {
    let active = true;
    setRefreshing(true);
    void Promise.all([
      onRefresh(),
      fetch("/api/estock/receiving", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) throw new Error("Could not load receipts");
        const result = await response.json();
        if (active) setReceived(result.receipts);
      }),
    ])
      .catch(() => {
        if (active) setError("History could not refresh. Try Refresh history again.");
      })
      .finally(() => {
        if (active) setRefreshing(false);
      });
    return () => {
      active = false;
    };
  }, [onRefresh]);
  const receipts = receiptHistory(movements.filter((m) => m.actorRole === "manager"));
  const visibleReceipts = receipts.filter(
    (receipt) =>
      (!documentDate || receipt.documentDate === documentDate) &&
      receipt.lines.some((line) => matchesHistorySearch(line, receiptSearch)),
  );
  const visibleReceived = received.filter(
    (r) =>
      (!documentDate || r.documentDate === documentDate) &&
      r.lines.some((l) =>
        [l.productName, l.rawName, l.reviewedName, l.expected, l.actual, l.unit]
          .join(" ")
          .toLowerCase()
          .includes(receiptSearch.toLowerCase()),
      ),
  );
  const activity = movements.filter((movement) => movement.type !== "INTAKE");
  const visibleActivity = activity.filter(
    (movement) =>
      (activityType === "ALL" || movement.type === activityType) &&
      matchesHistorySearch(movement, activitySearch),
  );

  return (
    <>
      <div className={styles.pageHeading}>
        <div>
          <h1>History</h1>
          <p>Review stock records.</p>
        </div>
        <button
          className={styles.secondaryButton}
          type="button"
          disabled={refreshing}
          onClick={async () => {
            setRefreshing(true);
            setError("");
            try {
              await onRefresh();
              const response = await fetch("/api/estock/receiving", { cache: "no-store" });
              if (!response.ok) throw new Error("Could not load receipts");
              setReceived((await response.json()).receipts);
            } catch {
              setError("History could not refresh. Try Refresh history again.");
            } finally {
              setRefreshing(false);
            }
          }}
        >
          {refreshing ? "Refreshing…" : "Refresh history"}
        </button>
      </div>
      {error && (
        <p className={styles.errorNotice} role="alert">
          {error}
        </p>
      )}
      <div className={styles.historySections}>
        <button
          type="button"
          className={section === "receipts" ? styles.navActive : styles.navItem}
          aria-pressed={section === "receipts"}
          onClick={() => setSection("receipts")}
        >
          Receipt history
        </button>
        <button
          type="button"
          className={section === "activity" ? styles.navActive : styles.navItem}
          aria-pressed={section === "activity"}
          onClick={() => setSection("activity")}
        >
          Stock activity
        </button>
      </div>
      {section === "receipts" ? (
        <section aria-labelledby="receipt-history-heading">
          <h2 id="receipt-history-heading">Receipt history</h2>
          <p className={styles.smallCopy}>
            Completed deliveries, including missing goods. Pending documents stay in Drafts.
          </p>
          <div className={styles.historyFilters}>
            <label className={styles.field}>
              <span>Search receipts</span>
              <input
                type="search"
                value={receiptSearch}
                onChange={(event) => setReceiptSearch(event.target.value)}
                placeholder="Product, description or quantity"
              />
            </label>
            <label className={styles.field}>
              <span>Document date</span>
              <input
                type="date"
                value={documentDate}
                onChange={(event) => setDocumentDate(event.target.value)}
              />
            </label>
          </div>
          <p role="status">
            {visibleReceipts.length + visibleReceived.length} of {receipts.length + received.length}{" "}
            completed receipts
          </p>
          <div className={styles.historyList}>
            {visibleReceived.map((r) => (
              <article className={styles.historyItem} key={r.id}>
                <h3>Document date: {formatDate(r.documentDate)}</h3>
                <p>{r.hasDiscrepancies ? "Received with differences" : "Received"}</p>
                <ul className={styles.receiptLines}>
                  {r.lines.map((l) => (
                    <li key={l.id}>
                      <strong>{l.productName}</strong>
                      <span>
                        {l.actual} {l.unit} received · expected {l.expected}
                        {l.outcome !== "MATCH"
                          ? ` · ${l.outcome === "SHORT" ? "Short" : "Extra"} by ${l.difference}`
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
                <details className={styles.sourceDetails}>
                  <summary>View receipt details</summary>
                  <p>Manager prepared and sent: {formatTime(r.sentAt)} MYT</p>
                  <p>Shared Staff checked: {formatTime(r.receivedAt)} MYT</p>
                  <p>Stock posted: {formatTime(r.receivedAt)} MYT</p>
                  {r.lines.map((l) => (
                    <p key={l.id}>
                      {l.productName}: read from document {l.rawName} ·{" "}
                      {l.rawQuantity ?? "Unreadable"} {l.rawUnit} · Manager expected {l.expected}{" "}
                      {l.unit} · Shared Staff received {l.actual} {l.unit}
                    </p>
                  ))}
                </details>
              </article>
            ))}
          </div>
          {!visibleReceipts.length && !visibleReceived.length ? (
            <div className={styles.quietEmpty}>
              <h3>
                {receipts.length + received.length
                  ? "No matching receipts"
                  : "No completed receipts yet"}
              </h3>
              <p>
                {receipts.length + received.length
                  ? "Try another search or clear the document date."
                  : "Staff confirmation records the delivery here, including an entirely missing delivery."}
              </p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {visibleReceipts.map((receipt) => (
                <article key={receipt.draftId} className={styles.historyItem}>
                  <h3>Document date: {formatDate(receipt.documentDate)}</h3>
                  <ul className={styles.receiptLines}>
                    {receipt.lines.map((line) => (
                      <li key={line.id}>
                        <strong>{line.productName}</strong>
                        <span>
                          +{line.quantity} {line.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <details className={styles.sourceDetails}>
                    <summary>View receipt details</summary>
                    <dl className={styles.historyMeta}>
                      <div>
                        <dt>Approved at</dt>
                        <dd>{formatTime(receipt.approvedAt)} MYT</dd>
                      </div>
                      <div>
                        <dt>Account</dt>
                        <dd>Manager ({receipt.managerAccountId})</dd>
                      </div>
                    </dl>
                    {receipt.lines.map((line) => (
                      <div key={line.id} className={styles.receiptLineDetails}>
                        <h4>{line.productName}</h4>
                        <p>
                          Read from bon: {line.rawName || "Name unreadable"} ·{" "}
                          {line.rawQuantity ?? "Quantity unreadable"}{" "}
                          {line.rawUnit || "unit not found"}
                        </p>
                        <p>
                          Reviewed description: {line.reviewedName || line.rawName || "Unreadable"}
                        </p>
                        <p>
                          Approved: {line.quantity} {line.unit} of {line.productName}
                        </p>
                      </div>
                    ))}
                  </details>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section aria-labelledby="stock-activity-heading">
          <h2 id="stock-activity-heading">Stock activity</h2>
          <p className={styles.smallCopy}>
            Take and usable Return events, plus Manager opening balances.
          </p>
          <div className={styles.historyFilters}>
            <label className={styles.field}>
              <span>Search stock activity</span>
              <input
                type="search"
                value={activitySearch}
                onChange={(event) => setActivitySearch(event.target.value)}
                placeholder="Product, account or quantity"
              />
            </label>
            <label className={styles.field}>
              <span>Movement type</span>
              <select
                value={activityType}
                data-placeholder={activityType === "ALL"}
                onChange={(event) => setActivityType(event.target.value)}
              >
                <option value="ALL">All stock activity</option>
                <option value="TAKE">Take</option>
                <option value="RETURN">Return</option>
                <option value="OPENING">Manager opening balance</option>
              </select>
            </label>
          </div>
          <p role="status">
            {visibleActivity.length} of {activity.length} stock events
          </p>
          {!visibleActivity.length ? (
            <div className={styles.quietEmpty}>
              <h3>{activity.length ? "No matching stock activity" : "No stock activity yet"}</h3>
              <p>
                {activity.length
                  ? "Try another search or choose All stock activity."
                  : "Opening, Take and Return events will appear here."}
              </p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {visibleActivity.map((item) => (
                <article key={item.id} className={styles.historyItem}>
                  <div className={styles.historyTop}>
                    <div>
                      <h3>{item.productName}</h3>
                      <span className={styles.historyType}>
                        {item.type === "OPENING"
                          ? "Manager opening balance"
                          : item.type === "TAKE"
                            ? "Take"
                            : "Return"}
                      </span>
                    </div>
                    <strong className={styles.historyQuantity}>
                      {item.delta >= 0 ? "+" : ""}
                      {item.delta} {item.unit}
                    </strong>
                  </div>
                  <dl className={styles.historyMeta}>
                    <div>
                      <dt>Recorded at</dt>
                      <dd>{formatTime(item.createdAt)} MYT</dd>
                    </div>
                    <div>
                      <dt>Account</dt>
                      <dd>{item.actorAccountId === "staff" ? "Shared Staff" : "Manager"}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
