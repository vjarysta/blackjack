import React from "react";

export type InterfaceMode = "classic" | "mobile";

const DEFAULT_MODE: InterfaceMode = "classic";
const STORAGE_KEY = "blackjack.interfaceMode";
const QUERY_KEY = "ui";

const isInterfaceMode = (value: string | null): value is InterfaceMode =>
  value === "classic" || value === "mobile";

const readFromStorage = (): InterfaceMode | null => {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isInterfaceMode(stored) ? stored : null;
  } catch {
    return null;
  }
};

const persistMode = (mode: InterfaceMode): void => {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore write errors
  }
};

const resolveInitialMode = (): InterfaceMode => {
  if (typeof window === "undefined") {
    return DEFAULT_MODE;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const queryValue = params.get(QUERY_KEY);
    if (isInterfaceMode(queryValue)) {
      persistMode(queryValue);
      return queryValue;
    }
  } catch {
    // ignore query parsing issues
  }
  const stored = readFromStorage();
  if (stored) {
    return stored;
  }
  persistMode(DEFAULT_MODE);
  return DEFAULT_MODE;
};

const updateQueryParam = (mode: InterfaceMode): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    params.set(QUERY_KEY, mode);
    const search = params.toString();
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  } catch {
    // ignore history errors
  }
};

export const useInterfaceMode = (): [InterfaceMode, React.Dispatch<React.SetStateAction<InterfaceMode>>] => {
  const [mode, setMode] = React.useState<InterfaceMode>(() => resolveInitialMode());

  React.useEffect(() => {
    persistMode(mode);
    updateQueryParam(mode);
  }, [mode]);

  return [mode, setMode];
};
