"use client";

import { useEffect, useRef, useState } from "react";
import { Wordmark } from "./ui";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "The recommendation" },
  { href: "#human-control", label: "Your decision" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 16);
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    if (!("IntersectionObserver" in window))
      return () => window.removeEventListener("scroll", scroll);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(`#${entry.target.id}`);
      },
      { rootMargin: "-20% 0px -55% 0px" },
    );
    for (const link of links) {
      const target = document.querySelector(link.href);
      if (target) observer.observe(target);
    }
    return () => {
      window.removeEventListener("scroll", scroll);
      observer.disconnect();
    };
  }, []);
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
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="header-inner container">
        {/* biome-ignore lint/a11y/useValidAnchor: Fragment navigation also closes the mobile menu. */}
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
            <a
              key={link.href}
              href={link.href}
              aria-current={active === link.href ? "location" : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <a className="button button-small button-primary nav-demo" href="/demo">
            Open demo
          </a>
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
          <a
            key={link.href}
            href={link.href}
            aria-current={active === link.href ? "location" : undefined}
            onClick={() => {
              setMenuOpen(false);
              requestAnimationFrame(() =>
                document.querySelector<HTMLElement>(link.href)?.focus({ preventScroll: true }),
              );
            }}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
