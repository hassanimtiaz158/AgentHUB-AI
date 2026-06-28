"use client";

import { useTheme } from "@/app/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-[var(--border-subtle)] transition-colors duration-200 ease-[var(--ease-out)] focus-ring"
      style={{
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
      }}
    >
      {/* Track icon: sun (light) / moon (dark) */}
      <span
        className="absolute left-1.5 text-xs transition-opacity duration-200"
        style={{ opacity: isDark ? 0 : 1 }}
      >
        ☀
      </span>
      <span
        className="absolute right-1.5 text-xs transition-opacity duration-200"
        style={{ opacity: isDark ? 1 : 0 }}
      >
        ☾
      </span>

      {/* Thumb */}
      <span
        className="inline-block h-6 w-6 rounded-full shadow-sm transition-transform duration-200 ease-[var(--ease-out)]"
        style={{
          background: isDark
            ? "linear-gradient(135deg, #8b5cf6, #3b82f6)"
            : "linear-gradient(135deg, #fbbf24, #f59e0b)",
          transform: isDark ? "translateX(1.75rem)" : "translateX(0)",
        }}
      />
    </button>
  );
}
