import { describe, expect, it } from "vitest";
import {
  deal,
  initGame,
  playDealer,
  playerDouble,
  playerStand,
  playerSurrender,
  settleAllHands,
  setBet,
  sit,
  takeInsurance,
  offerInsurance
} from "../src/engine/engine";
import { type Card, type GameState } from "../src/engine/types";

function setShoe(state: GameState, cards: Card[]): void {
  state.shoe.cards = cards.slice().reverse();
  state.shoe.discard = [];
}

function occupySeat(state: GameState, amount: number): void {
  sit(state, 0);
  setBet(state, 0, amount);
}

describe("payouts and flow", () => {
  it("pays 3:2 for player blackjack", () => {
    const game = initGame();
    occupySeat(game, 10);
    setShoe(game, [
      { rank: "A", suit: "♠" },
      { rank: "K", suit: "♣" },
      { rank: "9", suit: "♦" },
      { rank: "7", suit: "♥" },
      { rank: "5", suit: "♣" }
    ]);
    deal(game);
    expect(game.phase).toBe("dealerPlay");
    playDealer(game);
    settleAllHands(game);
    expect(game.bankroll).toBeCloseTo(115);
  });

  it("pays 1:1 on standard wins and returns pushes", () => {
    const winGame = initGame();
    occupySeat(winGame, 20);
    setShoe(winGame, [
      { rank: "K", suit: "♠" },
      { rank: "Q", suit: "♣" },
      { rank: "9", suit: "♦" },
      { rank: "6", suit: "♥" },
      { rank: "10", suit: "♣" }
    ]);
    deal(winGame);
    playerStand(winGame);
    playDealer(winGame);
    settleAllHands(winGame);
    expect(winGame.bankroll).toBeCloseTo(120);

    const pushGame = initGame();
    occupySeat(pushGame, 10);
    setShoe(pushGame, [
      { rank: "10", suit: "♠" },
      { rank: "7", suit: "♣" },
      { rank: "9", suit: "♦" },
      { rank: "8", suit: "♥" }
    ]);
    deal(pushGame);
    playerStand(pushGame);
    playDealer(pushGame);
    settleAllHands(pushGame);
    expect(pushGame.bankroll).toBeCloseTo(100);
  });

  it("returns half the bet on surrender", () => {
    const game = initGame();
    occupySeat(game, 20);
    setShoe(game, [
      { rank: "9", suit: "♠" },
      { rank: "8", suit: "♣" },
      { rank: "7", suit: "♦" },
      { rank: "6", suit: "♥" },
      { rank: "10", suit: "♠" }
    ]);
    deal(game);
    playerSurrender(game);
    playDealer(game);
    settleAllHands(game);
    expect(game.bankroll).toBeCloseTo(90);
  });

  it("handles double downs", () => {
    const game = initGame();
    occupySeat(game, 10);
    setShoe(game, [
      { rank: "6", suit: "♠" },
      { rank: "5", suit: "♣" },
      { rank: "9", suit: "♦" },
      { rank: "6", suit: "♥" },
      { rank: "10", suit: "♣" },
      { rank: "8", suit: "♠" }
    ]);
    deal(game);
    playerDouble(game);
    playDealer(game);
    settleAllHands(game);
    expect(game.bankroll).toBeCloseTo(120);
  });

  it("breaks even when insurance wins against dealer blackjack", () => {
    const game = initGame();
    occupySeat(game, 10);
    setShoe(game, [
      { rank: "10", suit: "♠" },
      { rank: "8", suit: "♣" },
      { rank: "A", suit: "♦" },
      { rank: "K", suit: "♥" }
    ]);
    deal(game);
    expect(game.phase).toBe("insurance");
    const hand = game.seats[0].hands[0];
    takeInsurance(game, 0, hand.id, 5);
    offerInsurance(game);
    expect(game.phase).toBe("settlement");
    settleAllHands(game);
    expect(game.bankroll).toBeCloseTo(100);
  });
});
