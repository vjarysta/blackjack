import { describe, expect, it } from "vitest";
import { initGame, deal, playerSplit } from "../src/engine/engine";
import { canSplit } from "../src/engine/rules";
import type { Card, GameState } from "../src/engine/types";

const card = (rank: Card["rank"], suit: Card["suit"] = "♠"): Card => ({ rank, suit });

const setupPairHand = (ranks: [Card["rank"], Card["rank"]]): GameState => {
  const game = initGame();
  game.seats[0].occupied = true;
  game.seats[0].baseBet = 10;
  game.shoe.cards = [card(ranks[0]), card("5"), card(ranks[1]), card("6"), card("9"), card("8")];
  deal(game);
  return game;
};

describe("splits", () => {
  it("allows splitting equal rank pairs", () => {
    const game = setupPairHand(["8", "8"]);
    playerSplit(game);
    expect(game.seats[0].hands).toHaveLength(2);
  });

  it("prevents splitting unequal ten-value cards when rule set", () => {
    const game = setupPairHand(["K", "Q"]);
    const seat = game.seats[0];
    expect(canSplit(seat.hands[0], seat, game.rules)).toBe(false);
  });

  it("marks split aces as resolved when hitting not allowed", () => {
    const game = setupPairHand(["A", "A"]);
    playerSplit(game);
    const hands = game.seats[0].hands;
    expect(hands.every((hand) => hand.isResolved)).toBe(true);
  });
});
