import { describe, expect, it } from "vitest";
import { initGame, deal, playerStand, playDealer, settleAllHands, takeInsurance, finishInsurance } from "../src/engine/engine";
import type { Card, GameState } from "../src/engine/types";

const card = (rank: Card["rank"], suit: Card["suit"] = "♠"): Card => ({ rank, suit });

const prepareSeat = (game: GameState, bet: number) => {
  game.seats[0].occupied = true;
  game.seats[0].baseBet = bet;
};

describe("payouts and insurance", () => {
  it("pays blackjack at 3:2", () => {
    const game = initGame();
    prepareSeat(game, 10);
    game.shoe.cards = [card("A"), card("9"), card("K"), card("5"), card("10")];
    deal(game);
    expect(game.bankroll).toBe(90);
    playerStand(game);
    playDealer(game);
    settleAllHands(game);
    expect(game.bankroll).toBeCloseTo(115);
  });

  it("pays even money on standard win", () => {
    const game = initGame();
    prepareSeat(game, 20);
    game.shoe.cards = [card("10"), card("5"), card("9"), card("6"), card("5"), card("10")];
    deal(game);
    playerStand(game);
    playDealer(game);
    settleAllHands(game);
    expect(game.bankroll).toBeCloseTo(120);
  });

  it("handles insurance when dealer has blackjack", () => {
    const game = initGame();
    prepareSeat(game, 10);
    game.shoe.cards = [card("A"), card("A"), card("9"), card("K"), card("5")];
    deal(game);
    const handId = game.seats[0].hands[0].id;
    takeInsurance(game, 0, handId, 5);
    finishInsurance(game);
    settleAllHands(game);
    expect(game.bankroll).toBeCloseTo(100);
  });
});
