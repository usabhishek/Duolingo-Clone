"use client";

import { useEffect, useState } from "react";

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.body.dataset.theme = theme;
}

/** Dark/light mode toggle stored in localStorage */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : prefersDark ? "dark" : "light";
    applyTheme(theme);
    setMounted(true);
  }, []);

  if (!mounted) return <>{children}</>;
  return <>{children}</>;
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
    setMounted(true);
  }, []);

  const toggle = () => {
    const nextDark = !document.documentElement.classList.contains("dark");
    applyTheme(nextDark ? "dark" : "light");
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    setDark(nextDark);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] p-2 text-lg text-[var(--text-primary)] transition hover:scale-105"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {mounted && dark ? "☀️" : "🌙"}
    </button>
  );
}
