import type { Card, Shoe } from "./types";

const SUITS: Card["suit"][] = ["♠", "♥", "♦", "♣"];
const RANKS: Card["rank"][] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const buildDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
};

const shuffle = (cards: Card[]): Card[] => {
  const shuffled = [...cards];
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj) {
    throw new Error("crypto.getRandomValues is required for shuffling");
  }
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const array = new Uint32Array(1);
    cryptoObj.getRandomValues(array);
    const j = array[0] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const createShoe = (decks: number, penetration: number): Shoe => {
  const shoeCards: Card[] = [];
  for (let i = 0; i < decks; i += 1) {
    shoeCards.push(...buildDeck());
  }
  const shuffled = shuffle(shoeCards);
  const cutIndex = Math.floor(shuffled.length * (1 - penetration));
  return {
    cards: shuffled,
    discard: [],
    cutIndex,
    needsReshuffle: false
  };
};

export const drawCard = (shoe: Shoe): Card => {
  if (shoe.cards.length === 0) {
    throw new Error("Shoe is empty - reshuffle required");
  }
  const card = shoe.cards.shift() as Card;
  if (!shoe.needsReshuffle && shoe.cards.length <= shoe.cutIndex) {
    shoe.needsReshuffle = true;
  }
  return card;
};

export const discard = (shoe: Shoe, cards: Card[]): void => {
  shoe.discard.push(...cards);
};

export const reshuffleIfNeeded = (shoe: Shoe, decks: number, penetration: number): Shoe => {
  if (!shoe.needsReshuffle) {
    return shoe;
  }
  return createShoe(decks, penetration);
};
