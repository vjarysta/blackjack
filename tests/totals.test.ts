import { describe, expect, it } from "vitest";
import { getHandTotals, bestTotal, isBlackjack, isBust } from "../src/engine/totals";
import { type Hand } from "../src/engine/types";

function createHand(cards: Array<{ rank: string; suit?: string }>): Hand {
  return {
    id: "test",
    cards: cards.map((card) => ({ rank: card.rank as Hand["cards"][number]["rank"], suit: (card.suit as Hand["cards"][number]["suit"]) ?? "♠" })),
    bet: 10,
    isResolved: false,
    isBlackjack: false,
    parentSeatIndex: 0,
  };
}

describe("hand totals", () => {
  it("computes hard and soft totals with multiple aces", () => {
    const hand = createHand([
      { rank: "A" },
      { rank: "A" },
      { rank: "9" },
    ]);
    const totals = getHandTotals(hand);
    expect(totals.hard).toBe(11);
    expect(totals.soft).toBe(21);
    expect(bestTotal(hand)).toBe(21);
  });

  it("detects blackjack on first two cards", () => {
    const hand = createHand([
      { rank: "A" },
      { rank: "K" },
    ]);
    hand.isBlackjack = true;
    expect(isBlackjack(hand)).toBe(true);
  });

  it("detects bust", () => {
    const hand = createHand([
      { rank: "10" },
      { rank: "9" },
      { rank: "5" },
    ]);
    expect(isBust(hand)).toBe(true);
  });
});
