import { describe, expect, it } from "vitest";
import {
  deal,
  initGame,
  offerInsurance,
  playDealer,
  playerStand,
  setBet,
  sit
} from "../src/engine/engine";
import { type Card, type GameState } from "../src/engine/types";

function setShoe(state: GameState, cards: Card[]): void {
  state.shoe.cards = cards.slice().reverse();
  state.shoe.discard = [];
}

describe("dealer play", () => {
  it("stands on soft 17 when S17 is enabled", () => {
    const game = initGame();
    sit(game, 0);
    setBet(game, 0, 10);
    setShoe(game, [
      { rank: "10", suit: "♠" },
      { rank: "9", suit: "♣" },
      { rank: "A", suit: "♦" },
      { rank: "6", suit: "♥" },
      { rank: "5", suit: "♣" },
      { rank: "4", suit: "♦" },
      { rank: "10", suit: "♦" }
    ]);
    deal(game);
    offerInsurance(game);
    playerStand(game);
    playDealer(game);
    expect(game.dealer.hand.cards).toHaveLength(2);
  });

  it("hits soft 17 when H17 is configured", () => {
    const game = initGame({ dealerStandsOnSoft17: false });
    sit(game, 0);
    setBet(game, 0, 10);
    setShoe(game, [
      { rank: "10", suit: "♠" },
      { rank: "9", suit: "♣" },
      { rank: "A", suit: "♦" },
      { rank: "6", suit: "♥" },
      { rank: "5", suit: "♣" },
      { rank: "4", suit: "♦" },
      { rank: "10", suit: "♦" }
    ]);
    deal(game);
    offerInsurance(game);
    playerStand(game);
    playDealer(game);
    expect(game.dealer.hand.cards.length).toBeGreaterThan(2);
  });
});
