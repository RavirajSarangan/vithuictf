"use client";

import * as React from "react";

const STORAGE_KEY = "icvf-theme";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme | undefined;
  systemTheme: ResolvedTheme;
};

type ThemeSnapshot = {
  theme: Theme;
  systemTheme: ResolvedTheme;
  resolvedTheme: ResolvedTheme;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

const themeListeners = new Set<() => void>();

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyResolvedTheme(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light" || stored === "system") {
      return stored;
    }
  } catch {
    // Ignore storage access errors (private mode, blocked storage, etc.).
  }
  return "light";
}

function readThemeSnapshot(): ThemeSnapshot {
  const theme = readStoredTheme();
  const systemTheme = getSystemTheme();
  return { theme, systemTheme, resolvedTheme: resolveTheme(theme) };
}

const serverThemeSnapshot: ThemeSnapshot = {
  theme: "light",
  systemTheme: "light",
  resolvedTheme: "light",
};

let clientThemeSnapshot = serverThemeSnapshot;

function getThemeSnapshot(): ThemeSnapshot {
  if (typeof window === "undefined") return serverThemeSnapshot;
  clientThemeSnapshot = readThemeSnapshot();
  return clientThemeSnapshot;
}

function notifyThemeListeners() {
  themeListeners.forEach((listener) => listener());
}

function subscribeTheme(listener: () => void) {
  themeListeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMedia = () => listener();
  const onStorage = () => listener();

  media.addEventListener("change", onMedia);
  window.addEventListener("storage", onStorage);

  return () => {
    themeListeners.delete(listener);
    media.removeEventListener("change", onMedia);
    window.removeEventListener("storage", onStorage);
  };
}

/** Theme context without inline `<script>` — bootstrap runs via `next/script` in root layout. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const snapshot = React.useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    () => serverThemeSnapshot
  );

  React.useEffect(() => {
    applyResolvedTheme(snapshot.resolvedTheme);
  }, [snapshot.resolvedTheme]);

  const setTheme = React.useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage write errors.
    }
    applyResolvedTheme(resolveTheme(next));
    notifyThemeListeners();
  }, []);

  const value = React.useMemo(
    () => ({
      theme: snapshot.theme,
      setTheme,
      resolvedTheme: snapshot.resolvedTheme,
      systemTheme: snapshot.systemTheme,
    }),
    [snapshot, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
