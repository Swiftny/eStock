"use client";

import { useEffect, useRef, useState } from "react";
import { DemoLaunchButton } from "./recommendation-demo";
import { Wordmark } from "./ui";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#human-control", label: "Human control" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="header-inner container">
        {/* biome-ignore lint/a11y/useValidAnchor: This real fragment link also closes the mobile menu. */}
        <a
          href="#page-top"
          aria-label="eStock home"
          className="home-link"
          onClick={() => setMenuOpen(false)}
        >
          <Wordmark />
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <DemoLaunchButton className="button button-small button-outline">
            Try the preview
          </DemoLaunchButton>
          <button
            ref={menuButton}
            className="menu-toggle button button-outline"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "Close menu" : "Menu"}
          </button>
        </div>
      </div>
      <nav
        id="mobile-navigation"
        className="mobile-nav container"
        aria-label="Mobile navigation"
        hidden={!menuOpen}
      >
        {links.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
