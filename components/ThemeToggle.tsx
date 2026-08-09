"use client";

import { useEffect, useState } from "react";

const LIGHT = "cupcake";
const DARK = "forest";

// Accessible light/dark switch: real <button>, keyboard-focusable, labelled,
// reflects state via aria-pressed, and persists the choice to localStorage.
// The inline script in the layout applies the saved/system theme pre-paint, so
// this only needs to read + flip it.
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.getAttribute("data-theme") === DARK);
  }, []);

  function toggle() {
    const next = isDark ? LIGHT : DARK;
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore (private mode etc.)
    }
    setIsDark(next === DARK);
  }

  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-ghost btn-sm btn-circle"
      aria-label={label}
      aria-pressed={isDark}
      title={label}
    >
      {/* Render a stable icon until mounted to avoid hydration mismatch. */}
      <span aria-hidden className="text-base leading-none">
        {!mounted ? "🌗" : isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
