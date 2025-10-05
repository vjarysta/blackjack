import { describe, expect, it } from "vitest";
import { initGame, settleAllHands } from "../src/engine/engine";

describe("settlement", () => {
  it("pays blackjack at configured rate", () => {
    const state = initGame();
    const seat = state.seats[0];
    seat.occupied = true;
    seat.hands = [
      {
        id: "h1",
        cards: [
          { rank: "A", suit: "♠" },
          { rank: "K", suit: "♥" },
        ],
        bet: 20,
        isResolved: false,
        isBlackjack: true,
        parentSeatIndex: 0,
      },
    ];
    state.dealer.hand.cards = [
      { rank: "9", suit: "♣" },
      { rank: "7", suit: "♦" },
    ];
    state.dealer.hand.isBlackjack = false;
    state.bankroll = 80; // 100 - bet

    settleAllHands(state);
    expect(state.bankroll).toBe(130);
  });

  it("returns push and handles surrender", () => {
    const state = initGame();
    const seat = state.seats[0];
    seat.occupied = true;
    seat.hands = [
      {
        id: "push",
        cards: [
          { rank: "10", suit: "♠" },
          { rank: "7", suit: "♥" },
        ],
        bet: 15,
        isResolved: false,
        isBlackjack: false,
        parentSeatIndex: 0,
      },
      {
        id: "surrender",
        cards: [
          { rank: "9", suit: "♠" },
          { rank: "7", suit: "♥" },
        ],
        bet: 20,
        isResolved: true,
        isBlackjack: false,
        isSurrendered: true,
        parentSeatIndex: 0,
      },
    ];
    state.dealer.hand.cards = [
      { rank: "10", suit: "♦" },
      { rank: "7", suit: "♣" },
    ];
    state.dealer.hand.isBlackjack = false;
    state.bankroll = 75; // 100 - 15 - 20 + surrender refund (10)

    settleAllHands(state);
    expect(state.bankroll).toBe(90); // push returns 15
  });

  it("pays insurance when dealer has blackjack", () => {
    const state = initGame();
    const seat = state.seats[0];
    seat.occupied = true;
    seat.hands = [
      {
        id: "insured",
        cards: [
          { rank: "9", suit: "♠" },
          { rank: "8", suit: "♥" },
        ],
        bet: 20,
        insuranceBet: 10,
        isResolved: false,
        isBlackjack: false,
        parentSeatIndex: 0,
      },
    ];
    state.dealer.hand.cards = [
      { rank: "A", suit: "♣" },
      { rank: "K", suit: "♦" },
    ];
    state.dealer.hand.isBlackjack = true;
    state.bankroll = 70; // 100 - bet 20 - insurance 10

    settleAllHands(state);
    expect(state.bankroll).toBe(100); // insurance returns 30
  });
});
