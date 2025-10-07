import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

declare global {
  interface Window {
    localStorage: Storage;
  }
}

const originalLocation = window.location;

const mockLocation = (url: string) => {
  const resolved = new URL(url);
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      href: resolved.href,
      search: resolved.search,
      toString: () => resolved.toString(),
      assign: vi.fn(),
      reload: vi.fn(),
      replace: vi.fn()
    } as unknown as Location
  });
};

const loadConfig = async () => {
  const module = await import("../src/ui/config");
  return module;
};

beforeEach(() => {
  vi.resetModules();
  window.localStorage.clear();
  mockLocation("http://localhost/");
});

afterEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation
  });
});

describe("ui config", () => {
  it("defaults to single-seat mode and persists the choice", async () => {
    const config = await loadConfig();
    expect(config.UI_MODE).toBe("single");
    expect(window.localStorage.getItem("ui.mode")).toBe("single");
    expect(config.visibleSeatIds).toEqual([config.PRIMARY_SEAT_ID]);
    expect(config.visibleSeatIndexes).toEqual([config.PRIMARY_SEAT_INDEX]);
    expect(config.restrictSeatIndex(4)).toBe(config.PRIMARY_SEAT_INDEX);

    const seats = config.filterSeatsForMode([
      { index: 0 },
      { index: config.PRIMARY_SEAT_INDEX },
      { index: 4 }
    ]);
    expect(seats).toEqual([{ index: config.PRIMARY_SEAT_INDEX }]);
  });

  it("honours the query-string override and exposes all seats in multi mode", async () => {
    mockLocation("http://localhost/?mode=multi");
    const config = await loadConfig();

    expect(config.UI_MODE).toBe("multi");
    expect(window.localStorage.getItem("ui.mode")).toBe("multi");
    expect(config.visibleSeatIds).toEqual(config.ALL_SEATS);
    expect(config.visibleSeatIndexes).toEqual(config.ALL_SEATS.map((_, index) => index));
    expect(config.restrictSeatIndex(4)).toBe(4);

    const seats = config.filterSeatsForMode([
      { index: 0 },
      { index: config.PRIMARY_SEAT_INDEX },
      { index: 4 }
    ]);
    expect(seats).toEqual([
      { index: 0 },
      { index: config.PRIMARY_SEAT_INDEX },
      { index: 4 }
    ]);
  });

  it("falls back to stored mode when query params are invalid", async () => {
    window.localStorage.setItem("ui.mode", "multi");
    mockLocation("http://localhost/?mode=coop");
    const config = await loadConfig();

    expect(config.UI_MODE).toBe("multi");
    expect(window.localStorage.getItem("ui.mode")).toBe("multi");
  });
});
