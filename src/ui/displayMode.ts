import React from "react";

export type DisplayMode = "classic" | "noirjack";

const DISPLAY_QUERY_KEY = "ui";
const DISPLAY_STORAGE_KEY = "ui.display";
const DEFAULT_MODE: DisplayMode = "classic";

const isValidMode = (value: string | null): value is DisplayMode => value === "classic" || value === "noirjack";

const mapLegacyMode = (value: string | null): DisplayMode | null => {
  if (value === "mobile") {
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
    if (isValidMode(stored)) {
      return stored;
    }
    const legacy = mapLegacyMode(stored);
    if (legacy) {
      persistMode(legacy);
      return legacy;
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
    } else {
      url.searchParams.set(DISPLAY_QUERY_KEY, mode);
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
    const queryMode = params.get(DISPLAY_QUERY_KEY);
    if (isValidMode(queryMode)) {
      persistMode(queryMode);
      return queryMode;
    }
    const legacy = mapLegacyMode(queryMode);
    if (legacy) {
      persistMode(legacy);
      return legacy;
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
