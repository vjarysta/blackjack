import { type Card, type Rank, type Shoe, type Suit } from "./types";

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS: Rank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K"
];

function shuffle(cards: Card[]): void {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi) {
    throw new Error("Cryptographic API not available for shuffle");
  }
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const array = new Uint32Array(1);
    cryptoApi.getRandomValues(array);
    const j = array[0] % (i + 1);
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
}

function cutThreshold(total: number, penetration: number): number {
  return total - Math.floor(total * penetration);
}

export function createShoe(decks: number, penetration: number): Shoe {
  const cards: Card[] = [];
  for (let d = 0; d < decks; d += 1) {
    SUITS.forEach((suit) => {
      RANKS.forEach((rank) => {
        cards.push({ suit, rank });
      });
    });
  }
  shuffle(cards);
  return {
    cards,
    discard: [],
    cutIndex: cutThreshold(cards.length, penetration)
  };
}

export function drawCard(shoe: Shoe): Card {
  const card = shoe.cards.pop();
  if (!card) {
    throw new Error("Shoe is empty");
  }
  return card;
}

export function discard(shoe: Shoe, cards: Card[]): void {
  shoe.discard.push(...cards);
}

export function shouldReshuffle(shoe: Shoe): boolean {
  return shoe.cards.length <= shoe.cutIndex;
}

export function rebuildShoe(shoe: Shoe, decks: number, penetration: number): void {
  const fresh = createShoe(decks, penetration);
  shoe.cards = fresh.cards;
  shoe.discard = fresh.discard;
  shoe.cutIndex = fresh.cutIndex;
}
