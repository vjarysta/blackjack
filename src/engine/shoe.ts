import { type Card, type Shoe, type Suit, type Rank } from "./types";

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function createDeck(): Card[] {
  const deck: Card[] = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      deck.push({ suit, rank });
    });
  });
  return deck;
}

function shuffle(cards: Card[]): void {
  const cryptoArray = new Uint32Array(cards.length);
  crypto.getRandomValues(cryptoArray);
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = cryptoArray[i] % (i + 1);
    const temp = cards[i];
    cards[i] = cards[j];
    cards[j] = temp;
  }
}

export function createShoe(decks: number, penetration: number): Shoe {
  const cards: Card[] = [];
  for (let i = 0; i < decks; i += 1) {
    cards.push(...createDeck());
  }
  shuffle(cards);
  const totalCards = cards.length;
  const cutIndex = Math.max(1, Math.floor(totalCards * (1 - penetration)));
  return {
    cards,
    discard: [],
    cutIndex,
  };
}

export function drawCard(shoe: Shoe): Card {
  if (shoe.cards.length === 0) {
    throw new Error("Shoe is empty");
  }
  const card = shoe.cards.pop();
  if (!card) {
    throw new Error("Unable to draw card");
  }
  return card;
}

export function discard(shoe: Shoe, cards: Card[]): void {
  shoe.discard.push(...cards);
}

export function needsReshuffle(shoe: Shoe): boolean {
  return shoe.cards.length <= shoe.cutIndex;
}

export function reshuffle(_shoe: Shoe, decks: number, penetration: number): Shoe {
  return createShoe(decks, penetration);
}
