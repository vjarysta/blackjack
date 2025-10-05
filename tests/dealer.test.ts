import { describe, expect, it } from "vitest";
import { initGame, playDealer } from "../src/engine/engine";
import { bestTotal } from "../src/engine/totals";

describe("dealer play", () => {
  it("stands on soft 17 when configured", () => {
    const state = initGame();
    state.phase = "dealerPlay";
    state.dealer.hand.cards = [
      { rank: "A", suit: "♠" },
      { rank: "6", suit: "♥" },
    ];
    state.dealer.hand.isBlackjack = false;
    state.shoe.cards = [
      { rank: "5", suit: "♣" },
    ];

    playDealer(state);
    expect(state.dealer.hand.cards).toHaveLength(2);
    expect(bestTotal(state.dealer.hand)).toBe(17);
  });

  it("hits soft 17 when H17 rules enabled", () => {
    const state = initGame();
    state.rules.dealerStandsOnSoft17 = false;
    state.phase = "dealerPlay";
    state.dealer.hand.cards = [
      { rank: "A", suit: "♠" },
      { rank: "6", suit: "♥" },
    ];
    state.dealer.hand.isBlackjack = false;
    state.shoe.cards = [
      { rank: "4", suit: "♦" },
      { rank: "3", suit: "♣" },
    ];

    playDealer(state);
    expect(state.dealer.hand.cards).toHaveLength(3);
    expect(bestTotal(state.dealer.hand)).toBe(20);
  });
});
