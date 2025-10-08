import { describe, expect, it } from "vitest";
import {
  initGame,
  deal,
  playerDouble,
  playerHit,
  playerSurrender,
  playDealer,
  settleAllHands
} from "../src/engine/engine";
import type { Card } from "../src/engine/types";

const card = (rank: Card["rank"], suit: Card["suit"] = "♠"): Card => ({ rank, suit });

describe("double and surrender", () => {
  it("enforces double rule window", () => {
    const game = initGame({ doubleAllowed: "10to11" });
    game.seats[0].occupied = true;
    game.seats[0].baseBet = 10;
    game.shoe.cards = [card("5"), card("6"), card("4"), card("10")];
    deal(game);
    expect(() => playerDouble(game)).toThrow();
  });

  it("doubles bet and draws one card", () => {
    const game = initGame();
    game.seats[0].occupied = true;
    game.seats[0].baseBet = 10;
    game.shoe.cards = [card("5"), card("6"), card("6"), card("10"), card("9"), card("5")];
    deal(game);
    playerDouble(game);
    expect(game.seats[0].hands[0].bet).toBe(20);
    expect(game.seats[0].hands[0].cards).toHaveLength(3);
    expect(game.bankroll).toBe(80);
    playDealer(game);
    settleAllHands(game);
    expect(game.bankroll).toBeGreaterThanOrEqual(80);
  });

  it("allows late surrender and refunds half bet", () => {
    const game = initGame();
    game.seats[0].occupied = true;
    game.seats[0].baseBet = 10;
    game.shoe.cards = [card("9"), card("6"), card("7"), card("10")];
    deal(game);
    playerSurrender(game);
    expect(game.seats[0].hands[0].isSurrendered).toBe(true);
    expect(game.bankroll).toBe(95);
  });

  it("auto stands when hit results in 21", () => {
    const game = initGame();
    game.seats[0].occupied = true;
    game.seats[0].baseBet = 10;
    game.shoe.cards = [card("10"), card("7"), card("5"), card("6"), card("6"), card("K")];
    deal(game);
    playerHit(game);
    const hand = game.seats[0].hands[0];
    expect(hand.isResolved).toBe(true);
    expect(game.phase).toBe("dealerPlay");
    expect(game.activeHandId).toBeNull();
  });
});
