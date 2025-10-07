import React from "react";

export type DisplayMode = "classic" | "noirjack";

const DISPLAY_QUERY_KEY = "skin";
const LEGACY_QUERY_KEY = "ui";
const DISPLAY_STORAGE_KEY = "ui.display";
const DEFAULT_MODE: DisplayMode = "noirjack";

const mapLegacyMode = (value: string | null): DisplayMode | null => {
  if (!value) {
    return null;
  }
  if (value === "classic") {
    return "classic";
  }
  if (value === "mobile" || value === "noirjack") {
    return "noirjack";
  }
  return null;
};

const readStoredMode = (): DisplayMode | null => {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(DISPLAY_STORAGE_KEY);
    const mapped = mapLegacyMode(stored);
    if (mapped) {
      return mapped;
    }
  } catch {
    // ignore storage errors
  }
  return null;
};

const persistMode = (mode: DisplayMode): void => {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(DISPLAY_STORAGE_KEY, mode);
  } catch {
    // ignore storage errors
  }
};

const setQueryParam = (mode: DisplayMode): void => {
  if (typeof window === "undefined" || typeof window.history === "undefined") {
    return;
  }
  try {
    const url = new URL(window.location.href);
    if (mode === DEFAULT_MODE) {
      url.searchParams.delete(DISPLAY_QUERY_KEY);
      url.searchParams.delete(LEGACY_QUERY_KEY);
    } else {
      url.searchParams.set(DISPLAY_QUERY_KEY, mode);
      url.searchParams.set(LEGACY_QUERY_KEY, mode);
    }
    window.history.replaceState({}, "", url.toString());
  } catch {
    // ignore URL issues
  }
};

const resolveInitialMode = (): DisplayMode => {
  if (typeof window === "undefined") {
    return DEFAULT_MODE;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const queryMode = params.get(DISPLAY_QUERY_KEY) ?? params.get(LEGACY_QUERY_KEY);
    const mappedQuery = mapLegacyMode(queryMode);
    if (mappedQuery) {
      persistMode(mappedQuery);
      return mappedQuery;
    }
  } catch {
    // ignore query parse errors
  }
  const stored = readStoredMode();
  if (stored) {
    return stored;
  }
  persistMode(DEFAULT_MODE);
  return DEFAULT_MODE;
};

export const getInitialDisplayMode = (): DisplayMode => resolveInitialMode();

export const useDisplayMode = (): [DisplayMode, (mode: DisplayMode) => void] => {
  const [mode, setMode] = React.useState<DisplayMode>(() => resolveInitialMode());

  const updateMode = React.useCallback((next: DisplayMode) => {
    setMode(next);
    persistMode(next);
    setQueryParam(next);
  }, []);

  React.useEffect(() => {
    persistMode(mode);
    setQueryParam(mode);
  }, [mode]);

  return [mode, updateMode];
};
