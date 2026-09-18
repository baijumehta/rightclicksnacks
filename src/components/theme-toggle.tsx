"use client";

import { useSyncExternalStore } from "react";

export const THEME_KEY = "snacks-theme";
const THEME_EVENT = "snacks-theme-change";

type Choice = "system" | "light" | "dark";

/**
 * Light / dark / follow-the-system.
 *
 * The `data-theme` attribute on <html> is the single source of truth: the boot
 * script sets it before first paint, and this control reads it back through
 * `useSyncExternalStore` rather than copying it into state with an effect.
 * That keeps one value authoritative instead of two that can disagree.
 *
 * "system" means removing the attribute rather than writing the OS's current
 * preference, so the page keeps tracking the OS if it changes while the tab
 * is open.
 */
function subscribe(onChange: () => void): () => void {
  // Our own changes, and changes made in another tab.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_KEY) return;
    applyToDocument(
      event.newValue === "light" || event.newValue === "dark" ? event.newValue : "system",
    );
    onChange();
  };
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): Choice {
  const value = document.documentElement.getAttribute("data-theme");
  return value === "light" || value === "dark" ? value : "system";
}

// Nothing is known about the visitor's choice on the server.
const getServerSnapshot = (): Choice => "system";

function applyToDocument(next: Choice): void {
  const root = document.documentElement;
  if (next === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", next);
}

export function ThemeToggle() {
  const choice = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function pick(next: Choice) {
    applyToDocument(next);
    try {
      if (next === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private mode: the choice still applies for this page view */
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  const options: { value: Choice; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <SunIcon /> },
    { value: "system", label: "Follow system", icon: <SystemIcon /> },
    { value: "dark", label: "Dark", icon: <MoonIcon /> },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="no-print inline-flex items-center rounded-lg border border-line bg-surface p-0.5"
    >
      {options.map((option) => {
        const active = choice === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            title={option.label}
            onClick={() => pick(option.value)}
            className={`flex size-7 items-center justify-center rounded-md transition-colors ${
              active
                ? "bg-accent-fill text-on-accent"
                : "text-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Runs before first paint so a dark-mode visitor never sees a white flash.
 * Inlined in <head> as a plain string: a React component would not run until
 * hydration, which is far too late.
 */
export const themeBootScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_KEY,
)});if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})()`;

const ICON = {
  width: 15,
  height: 15,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function SunIcon() {
  return (
    <svg {...ICON}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg {...ICON}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg {...ICON}>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
