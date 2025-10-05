import { describe, expect, it } from "vitest";
import {
  deal,
  initGame,
  playerDouble,
  playerSurrender,
  takeInsurance,
} from "../src/engine/engine";

function prepareSeat(state: ReturnType<typeof initGame>): void {
  const seat = state.seats[0];
  seat.occupied = true;
  seat.baseBet = 10;
}

describe("core actions", () => {
  it("deals two cards to player and dealer and marks blackjack", () => {
    const state = initGame();
    prepareSeat(state);
    state.shoe = {
      cards: [
        { rank: "3", suit: "♣" },
        { rank: "8", suit: "♥" },
        { rank: "10", suit: "♣" },
        { rank: "9", suit: "♦" },
        { rank: "A", suit: "♠" },
      ],
      discard: [],
      cutIndex: 1,
    };

    deal(state);

    const hand = state.seats[0].hands[0];
    expect(hand.cards.map((card) => card.rank)).toEqual(["A", "10"]);
    expect(hand.isBlackjack).toBe(true);
    expect(state.dealer.upcard?.rank).toBe("9");
    expect(state.dealer.hand.cards).toHaveLength(2);
    expect(state.bankroll).toBe(90);
    expect(state.phase).toBe("dealerPlay");
  });

  it("doubles a hand and draws exactly one card", () => {
    const state = initGame();
    prepareSeat(state);
    state.seats[0].hands = [
      {
        id: "h1",
        cards: [
          { rank: "9", suit: "♠" },
          { rank: "2", suit: "♥" },
        ],
        bet: 10,
        isResolved: false,
        isBlackjack: false,
        parentSeatIndex: 0,
      },
    ];
    state.bankroll = 90;
    state.phase = "playerActions";
    state.activeSeatIndex = 0;
    state.activeHandId = "h1";
    state.shoe.cards = [
      { rank: "5", suit: "♦" },
    ];

    playerDouble(state);
    const hand = state.seats[0].hands[0];
    expect(hand.bet).toBe(20);
    expect(hand.cards).toHaveLength(3);
    expect(hand.isDoubled).toBe(true);
    expect(hand.isResolved).toBe(true);
    expect(state.bankroll).toBe(80);
  });

  it("surrenders a hand and refunds half the bet", () => {
    const state = initGame();
    prepareSeat(state);
    state.seats[0].hands = [
      {
        id: "h1",
        cards: [
          { rank: "9", suit: "♠" },
          { rank: "7", suit: "♥" },
        ],
        bet: 20,
        isResolved: false,
        isBlackjack: false,
        parentSeatIndex: 0,
      },
    ];
    state.bankroll = 80;
    state.phase = "playerActions";
    state.activeSeatIndex = 0;
    state.activeHandId = "h1";

    playerSurrender(state);
    const hand = state.seats[0].hands[0];
    expect(hand.isSurrendered).toBe(true);
    expect(hand.isResolved).toBe(true);
    expect(state.bankroll).toBe(90);
  });

  it("takes insurance when dealer shows an ace", () => {
    const state = initGame();
    prepareSeat(state);
    state.seats[0].hands = [
      {
        id: "h1",
        cards: [
          { rank: "9", suit: "♠" },
          { rank: "7", suit: "♥" },
        ],
        bet: 20,
        isResolved: false,
        isBlackjack: false,
        parentSeatIndex: 0,
      },
    ];
    state.dealer.upcard = { rank: "A", suit: "♦" };
    state.phase = "insurance";
    state.bankroll = 90;

    takeInsurance(state, 0, "h1", 10);
    expect(state.seats[0].hands[0].insuranceBet).toBe(10);
    expect(state.bankroll).toBe(80);
  });
});
