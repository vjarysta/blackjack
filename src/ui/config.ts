export type UIMode = "single" | "multi";

const DEFAULT_UI_MODE: UIMode = "single";
const STORAGE_KEY = "ui.mode";
const QUERY_KEY = "mode";

const isValidMode = (value: string | null): value is UIMode => value === "single" || value === "multi";

const readStoredMode = (): UIMode | null => {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isValidMode(stored) ? stored : null;
  } catch {
    return null;
  }
};

const persistMode = (mode: UIMode): void => {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore persistence errors
  }
};

const resolveMode = (): UIMode => {
  if (typeof window === "undefined") {
    return DEFAULT_UI_MODE;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const queryMode = params.get(QUERY_KEY);
    if (isValidMode(queryMode)) {
      persistMode(queryMode);
      return queryMode;
    }
  } catch {
    // ignore query parsing issues
  }
  const stored = readStoredMode();
  if (stored) {
    return stored;
  }
  persistMode(DEFAULT_UI_MODE);
  return DEFAULT_UI_MODE;
};

export const UI_MODE: UIMode = resolveMode();
export const PRIMARY_SEAT_ID = "seat-3" as const;
export const ALL_SEATS = ["seat-1", "seat-2", "seat-3", "seat-4", "seat-5"] as const;

export type SeatId = (typeof ALL_SEATS)[number];

const seatIndexMap = new Map<SeatId, number>(ALL_SEATS.map((id, index) => [id, index] as const));

export const seatIndexFromId = (seatId: SeatId): number => seatIndexMap.get(seatId) ?? 0;
export const seatIdFromIndex = (index: number): SeatId => ALL_SEATS[index] ?? PRIMARY_SEAT_ID;

export const PRIMARY_SEAT_INDEX = seatIndexFromId(PRIMARY_SEAT_ID);
export const isSingleSeatMode = UI_MODE === "single";

export const visibleSeatIds: SeatId[] = isSingleSeatMode ? [PRIMARY_SEAT_ID] : [...ALL_SEATS];
export const visibleSeatIndexes: number[] = visibleSeatIds.map((seatId) => seatIndexFromId(seatId));

export const restrictSeatIndex = (seatIndex: number): number =>
  isSingleSeatMode ? PRIMARY_SEAT_INDEX : seatIndex;

export const filterSeatsForMode = <T extends { index: number }>(seats: T[]): T[] => {
  if (!isSingleSeatMode) {
    return seats;
  }
  return seats.filter((seat) => seat.index === PRIMARY_SEAT_INDEX);
};
