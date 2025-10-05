import { describe, expect, it } from "vitest";
import { getHandTotals, bestTotal, isBust, isSoft } from "../src/engine/totals";
import { type Hand } from "../src/engine/types";

function createHand(cards: Hand["cards"]): Hand {
  return {
    id: "test",
    cards,
    bet: 10,
    isResolved: false,
    isBlackjack: false,
    parentSeatIndex: 0
  };
}

describe("hand totals", () => {
  it("computes soft totals with multiple aces", () => {
    const hand = createHand([
      { rank: "A", suit: "♠" },
      { rank: "A", suit: "♥" },
      { rank: "9", suit: "♦" }
    ]);
    const totals = getHandTotals(hand);
    expect(totals.soft).toBe(21);
    expect(totals.hard).toBe(11);
    expect(bestTotal(hand)).toBe(21);
    expect(isSoft(hand)).toBe(true);
  });

  it("detects bust when totals exceed 21", () => {
    const hand = createHand([
      { rank: "K", suit: "♠" },
      { rank: "9", suit: "♥" },
      { rank: "5", suit: "♦" }
    ]);
    expect(isBust(hand)).toBe(true);
  });
});
