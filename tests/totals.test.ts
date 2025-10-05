import { describe, expect, it } from "vitest";
import { getHandTotals, bestTotal, isBust } from "../src/engine/totals";
import type { Hand } from "../src/engine/types";

const createHand = (ranks: string[]): Hand => ({
  id: "test",
  cards: ranks.map((rank) => ({ rank: rank as Hand["cards"][number]["rank"], suit: "♠" })),
  bet: 10,
  isResolved: false,
  isBlackjack: false,
  parentSeatIndex: 0
});

describe("hand totals", () => {
  it("computes soft totals with multiple aces", () => {
    const hand = createHand(["A", "A", "9"]);
    const totals = getHandTotals(hand);
    expect(totals.hard).toBe(11);
    expect(totals.soft).toBe(21);
  });

  it("computes hard totals when busting", () => {
    const hand = createHand(["K", "9", "5"]);
    expect(bestTotal(hand)).toBe(24);
    expect(isBust(hand)).toBe(true);
  });

  it("identifies blackjack totals", () => {
    const hand = createHand(["A", "K"]);
    expect(bestTotal(hand)).toBe(21);
  });
});
