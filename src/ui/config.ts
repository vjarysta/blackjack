export type UiMode = "single" | "multi";

export const PRIMARY_SEAT_ID = "seat-3";
export const ALL_SEATS = ["seat-1", "seat-2", "seat-3", "seat-4", "seat-5"] as const;

const DEFAULT_UI_MODE: UiMode = "single";
const MODE_QUERY_KEY = "mode";
const MODE_STORAGE_KEY = "ui.mode";

const isUiMode = (value: string | null): value is UiMode => value === "single" || value === "multi";

const readModeFromQuery = (): UiMode | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const param = params.get(MODE_QUERY_KEY);
    return isUiMode(param) ? param : null;
  } catch {
    return null;
  }
};

const readModeFromStorage = (): UiMode | null => {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
    return isUiMode(stored) ? stored : null;
  } catch {
    return null;
  }
};

const persistMode = (mode: UiMode): void => {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    // ignore storage failures
  }
};

const resolveUiMode = (): UiMode => {
  const fromQuery = readModeFromQuery();
  if (fromQuery) {
    persistMode(fromQuery);
    return fromQuery;
  }
  const fromStorage = readModeFromStorage();
  if (fromStorage) {
    return fromStorage;
  }
  return DEFAULT_UI_MODE;
};

export const UI_MODE: UiMode = resolveUiMode();

export const PRIMARY_SEAT_INDEX = Math.max(0, ALL_SEATS.indexOf(PRIMARY_SEAT_ID));

export const isSingleSeatMode = UI_MODE === "single";
