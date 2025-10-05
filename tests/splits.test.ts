import { describe, expect, it } from "vitest";
import { initGame, playerSplit } from "../src/engine/engine";
import { canSplit } from "../src/engine/rules";
import { type Hand } from "../src/engine/types";

function createPairHand(rank: Hand["cards"][number]["rank"], bet: number, seatIndex: number): Hand {
  return {
    id: `hand-${rank}`,
    cards: [
      { rank, suit: "♠" },
      { rank, suit: "♥" },
    ],
    bet,
    isResolved: false,
    isBlackjack: false,
    parentSeatIndex: seatIndex,
  };
}

describe("split rules", () => {
  it("allows equal rank split but not mixed tens when restricted", () => {
    const state = initGame();
    const seat = state.seats[0];
    seat.occupied = true;
    seat.baseBet = 10;
    seat.hands = [createPairHand("8", 10, 0)];
    state.phase = "playerActions";
    state.activeSeatIndex = 0;
    state.activeHandId = seat.hands[0].id;

    expect(canSplit(state, state.rules, seat.hands[0])).toBe(true);

    const mixedHand: Hand = {
      ...createPairHand("10", 10, 0),
      cards: [
        { rank: "10", suit: "♠" },
        { rank: "K", suit: "♥" },
      ],
      id: "mixed",
    };
    seat.hands[0] = mixedHand;
    expect(canSplit(state, state.rules, seat.hands[0])).toBe(false);
  });

  it("prevents resplitting aces when disabled and resolves split aces immediately when hits disallowed", () => {
    const state = initGame();
    const seat = state.seats[0];
    seat.occupied = true;
    seat.baseBet = 15;
    seat.hands = [createPairHand("A", 15, 0)];
    state.phase = "playerActions";
    state.activeSeatIndex = 0;
    state.activeHandId = seat.hands[0].id;
    state.bankroll = 100;

    state.shoe.cards = [
      { rank: "5", suit: "♣" },
      { rank: "4", suit: "♦" },
      { rank: "3", suit: "♠" },
      { rank: "2", suit: "♥" },
    ];

    playerSplit(state);
    expect(seat.hands).toHaveLength(2);
    expect(seat.hands.every((hand) => hand.isResolved)).toBe(true);

    state.activeHandId = seat.hands[0].id;
    expect(canSplit(state, state.rules, seat.hands[0])).toBe(false);
  });
});
