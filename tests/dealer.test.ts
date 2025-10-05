import { describe, expect, it } from "vitest";
import { initGame, deal, playerStand, playDealer } from "../src/engine/engine";
import type { Card } from "../src/engine/types";

const card = (rank: Card["rank"], suit: Card["suit"] = "♠"): Card => ({ rank, suit });

describe("dealer play", () => {
  it("stands on soft 17 when configured", () => {
    const game = initGame({ dealerStandsOnSoft17: true });
    game.seats[0].occupied = true;
    game.seats[0].baseBet = 10;
    game.shoe.cards = [card("10"), card("6"), card("7"), card("A"), card("5"), card("10")];
    deal(game);
    playerStand(game);
    playDealer(game);
    expect(game.dealer.hand.cards).toHaveLength(2);
  });

  it("hits soft 17 when configured for H17", () => {
    const game = initGame({ dealerStandsOnSoft17: false });
    game.seats[0].occupied = true;
    game.seats[0].baseBet = 10;
    game.shoe.cards = [card("10"), card("6"), card("7"), card("A"), card("5"), card("10")];
    deal(game);
    playerStand(game);
    playDealer(game);
    expect(game.dealer.hand.cards.length).toBeGreaterThan(2);
  });
});
