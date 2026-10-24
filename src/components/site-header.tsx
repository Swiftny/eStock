"use client";

import { useEffect, useRef, useState } from "react";
import { Wordmark } from "./ui";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const confirmDialog = useRef<HTMLDialogElement>(null);
  const signInLink = useRef<HTMLAnchorElement>(null);
  const signOutButton = useRef<HTMLButtonElement>(null);
  const signedOut = useRef(false);

  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 16);
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let busy = false;
    const refreshSession = async () => {
      if (busy) return;
      busy = true;
      try {
        const response = await fetch("/api/estock/session", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Account status unavailable. Reload to try again.");
        const session = await response.json();
        if (!controller.signal.aborted) {
          setAuthenticated(session.authenticated === true);
          setError("");
        }
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : "Account status unavailable.");
      } finally {
        busy = false;
      }
    };
    void refreshSession();
    window.addEventListener("pageshow", refreshSession);
    window.addEventListener("focus", refreshSession);
    return () => {
      controller.abort();
      window.removeEventListener("pageshow", refreshSession);
      window.removeEventListener("focus", refreshSession);
    };
  }, []);

  useEffect(() => {
    const element = confirmDialog.current;
    if (!confirming || !element) return;
    element.showModal();
    return () => {
      element.close();
      signOutButton.current?.focus();
    };
  }, [confirming]);

  useEffect(() => {
    if (authenticated || !signedOut.current) return;
    signedOut.current = false;
    signInLink.current?.focus();
  }, [authenticated]);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setError("");
    try {
      const response = await fetch("/api/estock/session", { method: "DELETE", cache: "no-store" });
      if (!response.ok && response.status !== 401)
        throw new Error("Could not sign out. Try again.");
      signedOut.current = true;
      setConfirming(false);
      setAuthenticated(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign out. Try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="header-inner container">
        <a href="#page-top" aria-label="eStock home" className="home-link">
          <Wordmark />
        </a>
        <nav className="landing-navigation" aria-label="Main navigation">
          <a className="landing-text-link" href="#page-top">
            Overview
          </a>
          <a className="landing-text-link" href="#roles">
            Your team
          </a>
          <a className="landing-text-link" href="#how-it-works">
            How it works
          </a>
        </nav>
        <div className="landing-header-actions">
          {authenticated ? (
            <button
              ref={signOutButton}
              className="button button-small button-outline landing-signin"
              type="button"
              disabled={signingOut}
              onClick={() => {
                setError("");
                setConfirming(true);
              }}
            >
              Sign out
            </button>
          ) : (
            <a
              ref={signInLink}
              className="button button-small button-outline landing-signin"
              href="/login"
            >
              Sign in
            </a>
          )}
          <a className="button button-small button-primary landing-demo" href="/demo">
            Open demo
          </a>
        </div>
        {error && !confirming && (
          <p className="landing-session-error" role="alert">
            {error}
          </p>
        )}
      </div>
      {confirming && (
        <dialog
          ref={confirmDialog}
          className="signout-dialog"
          aria-labelledby="signout-title"
          aria-describedby="signout-detail"
          onCancel={(event) => {
            event.preventDefault();
            if (!signingOut) setConfirming(false);
          }}
          onClose={() => setConfirming(false)}
        >
          <h2 id="signout-title">Sign out of eStock?</h2>
          <p id="signout-detail">You will need the access code to sign in again.</p>
          {error && (
            <p className="landing-session-error" role="alert">
              {error}
            </p>
          )}
          <div className="signout-actions">
            <button
              className="button button-small button-outline"
              type="button"
              disabled={signingOut}
              onClick={() => setConfirming(false)}
            >
              Stay signed in
            </button>
            <button
              className="button button-small button-primary"
              type="button"
              disabled={signingOut}
              onClick={() => void signOut()}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </dialog>
      )}
    </header>
  );
}
