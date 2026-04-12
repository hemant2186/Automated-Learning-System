"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLightTheme = theme === "light";
  const nextThemeLabel = isLightTheme ? "Switch to dark mode" : "Switch to light mode";

  return (
    <button
      type="button"
      className="nav-pill theme-toggle-button"
      onClick={toggleTheme}
      aria-label={nextThemeLabel}
      title={nextThemeLabel}
    >
      <span aria-hidden="true" className="theme-toggle-icon">
        {isLightTheme ? (
          <svg viewBox="0 0 24 24" className="theme-toggle-svg">
            <path
              d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="theme-toggle-svg">
            <circle cx="12" cy="12" r="4.5" fill="currentColor" />
            <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 2.5V5" />
              <path d="M12 19V21.5" />
              <path d="M2.5 12H5" />
              <path d="M19 12h2.5" />
              <path d="M5.2 5.2l1.8 1.8" />
              <path d="M17 17l1.8 1.8" />
              <path d="M18.8 5.2L17 7" />
              <path d="M7 17l-1.8 1.8" />
            </g>
          </svg>
        )}
      </span>
    </button>
  );
}
