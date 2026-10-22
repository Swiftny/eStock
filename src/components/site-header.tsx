"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "./ui";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 16);
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);

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
        <a className="button button-small button-primary landing-demo" href="/demo">
          Open demo
        </a>
      </div>
    </header>
  );
}
