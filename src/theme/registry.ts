import React from "react";
import type { ThemeDefinition, ThemeIdentity } from "./types";

const registry = new Map<string, ThemeDefinition>();

export const DEFAULT_THEME_ID = "solo";
const STORAGE_KEY = "ui.theme";

export const registerTheme = (definition: ThemeDefinition): void => {
  registry.set(definition.id, definition);
};

export const getRegisteredThemes = (): ThemeIdentity[] =>
  Array.from(registry.values()).map(({ id, label }) => ({ id, label }));

export const getThemeDefinition = (themeId: string): ThemeDefinition | undefined =>
  registry.get(themeId);

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

const setDataTheme = (themeId: string): void => {
  if (!isBrowser) {
    return;
  }
  document.documentElement.dataset.theme = themeId;
};

export const resolveInitialThemeId = (): string => {
  if (!isBrowser) {
    return DEFAULT_THEME_ID;
  }
  const params = new URLSearchParams(window.location.search);
  const queryTheme = params.get("theme");
  if (queryTheme && registry.has(queryTheme)) {
    return queryTheme;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && registry.has(stored)) {
    return stored;
  }
  return DEFAULT_THEME_ID;
};

export const useThemePreference = (): {
  themeId: string;
  setThemeId: (themeId: string) => void;
  themes: ThemeIdentity[];
} => {
  const [themeId, setThemeIdState] = React.useState(() => {
    const initial = resolveInitialThemeId();
    setDataTheme(initial);
    return initial;
  });

  const setThemeId = React.useCallback((nextId: string) => {
    const fallback = registry.has(nextId) ? nextId : DEFAULT_THEME_ID;
    setThemeIdState(fallback);
    setDataTheme(fallback);
    if (isBrowser) {
      window.localStorage.setItem(STORAGE_KEY, fallback);
    }
  }, []);

  React.useEffect(() => {
    setDataTheme(themeId);
  }, [themeId]);

  const themeList = React.useMemo(() => getRegisteredThemes(), []);

  return {
    themeId,
    setThemeId,
    themes: themeList,
  };
};
