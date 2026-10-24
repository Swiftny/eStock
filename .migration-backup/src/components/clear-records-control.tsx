"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./estock-app.module.css";

export function ClearRecordsControl({
  label,
  phrase,
  description,
  disabled,
  onClear,
  confirmLabel = "Clear permanently",
  pendingLabel = "Clearing…",
}: {
  label: string;
  phrase: string;
  description: string;
  disabled: boolean;
  onClear: (confirmation: string) => Promise<string>;
  confirmLabel?: string;
  pendingLabel?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const running = useRef(false);
  const panelId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const feedback = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (expanded) cancel.current?.focus();
  }, [expanded]);

  function close() {
    if (running.current) return;
    setExpanded(false);
    setError("");
    trigger.current?.focus();
  }

  async function clear() {
    if (running.current || disabled || !expanded) return;
    running.current = true;
    setPending(true);
    setError("");
    try {
      setNotice(await onClear(phrase));
      setExpanded(false);
      requestAnimationFrame(() => feedback.current?.focus());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not clear these records.");
    } finally {
      running.current = false;
      setPending(false);
    }
  }

  return (
    <div className={styles.clearRecords} aria-busy={pending}>
      <button
        ref={trigger}
        className={styles.clearHistoryButton}
        type="button"
        aria-expanded={expanded}
        aria-controls={expanded ? panelId : undefined}
        disabled={disabled || pending}
        onClick={() => {
          setExpanded(true);
          setError("");
          setNotice("");
        }}
      >
        {label}
      </button>
      {notice && (
        <p ref={feedback} className={styles.notice} role="status" tabIndex={-1}>
          {notice}
        </p>
      )}
      {expanded && (
        <fieldset
          id={panelId}
          className={styles.clearHistoryConfirm}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              close();
            }
          }}
        >
          <legend className={styles.srOnly}>{label}</legend>
          <p>
            <strong>{label}?</strong>
          </p>
          <p>{description}</p>
          {error && (
            <p className={styles.errorNotice} role="alert">
              {error}
            </p>
          )}
          <div className={styles.clearHistoryActions}>
            <button
              className={styles.dangerButton}
              type="button"
              disabled={disabled || pending}
              onClick={() => void clear()}
            >
              {pending ? pendingLabel : confirmLabel}
            </button>
            <button
              ref={cancel}
              className={styles.secondaryButton}
              type="button"
              disabled={pending}
              onClick={close}
            >
              Cancel
            </button>
          </div>
        </fieldset>
      )}
    </div>
  );
}
