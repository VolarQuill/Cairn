"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";

/**
 * Light/dark switch. The initial class is set by an inline script in the root
 * layout (to avoid a flash of the wrong theme), so here we only read it on mount
 * and toggle it thereafter, persisting the choice to localStorage.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      aria-pressed={dark}
      className={`group inline-flex h-9 w-9 items-center justify-center rounded-xl border border-cream-300 bg-cream-50 text-bark-100 transition hover:border-amber-100 hover:text-amber-100 hover:shadow-soft dark:border-forest-200/40 dark:bg-forest-300 dark:text-cream-200 dark:hover:border-amber-100 dark:hover:text-amber-50 ${className}`}
    >
      {/* Render a stable icon until mounted to avoid hydration mismatch. */}
      {mounted && dark ? (
        <Icon name="sun" size={18} className="transition-transform group-hover:rotate-45" />
      ) : (
        <Icon name="moon" size={18} className="transition-transform group-hover:-rotate-12" />
      )}
    </button>
  );
}
