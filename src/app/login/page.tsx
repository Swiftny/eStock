"use client";

import { type FormEvent, useRef, useState } from "react";
import { Wordmark } from "@/components/ui";
import styles from "./login.module.css";

export default function LoginPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "manager", accessCode: String(data.get("accessCode") || "") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not sign in. Try again.");
      window.location.assign("/demo");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in. Try again.");
      setPending(false);
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }

  return (
    <div className={styles.page}>
      <a className="skip-link" href="#login-main">
        Skip to sign in
      </a>
      <header>
        <div className={styles.headerInner}>
          <a href="/" className="home-link" aria-label="eStock home">
            <Wordmark />
          </a>
          <a href="/" className={styles.backLink}>
            Back to overview
          </a>
        </div>
      </header>
      <main id="login-main" className={styles.main} tabIndex={-1}>
        <p className={styles.eyebrow}>Your stock workspace</p>
        <h1>Welcome back.</h1>
        <p className={styles.description}>Sign in to keep your stock and next orders in view.</p>
        <form className={styles.form} onSubmit={signIn} aria-busy={pending}>
          <label htmlFor="access-code">Workspace access code</label>
          <input
            id="access-code"
            name="accessCode"
            type="password"
            autoComplete="current-password"
            aria-describedby="access-code-help"
            aria-invalid={error ? true : undefined}
            disabled={pending}
            maxLength={200}
          />
          <p id="access-code-help" className={styles.help}>
            Leave this blank if no access code has been set.
          </p>
          {error && (
            <p ref={errorRef} className={styles.error} role="alert" tabIndex={-1}>
              {error}
            </p>
          )}
          <button type="submit" className="button button-primary" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
          <span className="sr-only" role="status">
            {pending ? "Signing in to your workspace…" : ""}
          </span>
        </form>
        <a href="/demo" className={styles.tryLink}>
          Try it now
        </a>
      </main>
    </div>
  );
}
