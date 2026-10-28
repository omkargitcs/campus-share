import { useSyncExternalStore } from "react";

const KEY = "cs-theme";
const query = () => window.matchMedia("(prefers-color-scheme: dark)");

const stored = () => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
};

// First visit: follow the system. After the person toggles: their choice wins.
const resolve = () => stored() ?? (query().matches ? "dark" : "light");

const listeners = new Set();
let current = typeof window === "undefined" ? "light" : resolve();

const apply = (theme) => {
  document.documentElement.dataset.theme = theme;
};

const setTheme = (theme, persist) => {
  current = theme;
  apply(theme);
  if (persist) {
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* private mode: the choice just won't survive a reload */
    }
  }
  listeners.forEach((l) => l());
};

if (typeof window !== "undefined") {
  apply(current);
  // keep following the system until the person makes a choice
  query().addEventListener("change", (e) => {
    if (!stored()) setTheme(e.matches ? "dark" : "light", false);
  });
  // another tab changed it
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) setTheme(resolve(), false);
  });
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const useTheme = () => {
  const theme = useSyncExternalStore(subscribe, () => current, () => "light");
  return {
    theme,
    toggle: () => setTheme(theme === "dark" ? "light" : "dark", true),
  };
};
