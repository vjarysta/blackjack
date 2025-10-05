import { describe, expect, it } from "vitest";
import {
  canSplit
} from "../src/engine/rules";
import {
  deal,
  initGame,
  playerSplit,
  setBet,
  sit
} from "../src/engine/engine";
import { type GameState, type Hand } from "../src/engine/types";

function setShoe(state: GameState, cards: Hand["cards"]): void {
  state.shoe.cards = cards.slice().reverse();
  state.shoe.discard = [];
}

describe("splitting rules", () => {
  it("prevents splitting unequal ranks when equal-rank rule is enabled", () => {
    const game = initGame();
    sit(game, 0);
    setBet(game, 0, 10);
    setShoe(game, [
      { rank: "10", suit: "♠" },
      { rank: "K", suit: "♣" },
      { rank: "9", suit: "♦" },
      { rank: "6", suit: "♥" }
    ]);
    deal(game);
    expect(() => playerSplit(game)).toThrow();
  });

  it("marks split aces as complete when hitting after split aces is disabled", () => {
    const game = initGame();
    sit(game, 0);
    setBet(game, 0, 10);
    setShoe(game, [
      { rank: "A", suit: "♠" },
      { rank: "A", suit: "♣" },
      { rank: "9", suit: "♦" },
      { rank: "6", suit: "♥" },
      { rank: "5", suit: "♠" },
      { rank: "4", suit: "♣" }
    ]);
    deal(game);
    playerSplit(game);
    const seat = game.seats[0];
    seat.hands.forEach((hand) => {
      expect(hand.isResolved).toBe(true);
    });
  });

  it("disallows resplitting aces when the rule is disabled", () => {
    const game = initGame();
    const seat = game.seats[0];
    const hand: Hand = {
      id: "split-aces",
      bet: 10,
      cards: [
        { rank: "A", suit: "♠" },
        { rank: "A", suit: "♥" }
      ],
      isResolved: false,
      isBlackjack: false,
      parentSeatIndex: 0,
      originatesFromSplit: true
    };
    seat.hands = [hand];
    expect(canSplit(hand, seat, game.rules)).toBe(false);
  });

  it("respects the maximum number of split hands", () => {
    const game = initGame();
    const seat = game.seats[0];
    seat.hands = Array.from({ length: game.rules.splitMaxHands }, (_, index) => ({
      id: `hand-${index}`,
      bet: 10,
      cards: [
        { rank: "8", suit: "♠" },
        { rank: "8", suit: "♥" }
      ],
      isResolved: false,
      isBlackjack: false,
      parentSeatIndex: 0,
      originatesFromSplit: false
    }));
    const target = seat.hands[0];
    expect(canSplit(target, seat, game.rules)).toBe(false);
  });
});
