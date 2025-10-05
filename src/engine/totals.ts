import { type Hand } from "./types";

const RANK_VALUES: Record<string, number> = {
  A: 11,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 10,
  Q: 10,
  K: 10,
};

export function getHandTotals(hand: Hand): { hard: number; soft?: number } {
  let hard = 0;
  let aceCount = 0;

  hand.cards.forEach((card) => {
    if (card.rank === "A") {
      aceCount += 1;
      hard += 1;
    } else {
      hard += RANK_VALUES[card.rank];
    }
  });

  let soft: number | undefined;
  if (aceCount > 0) {
    const candidate = hard + 10;
    if (candidate <= 21) {
      soft = candidate;
    }
  }

  return { hard, soft };
}

export function bestTotal(hand: Hand): number {
  const totals = getHandTotals(hand);
  return totals.soft ?? totals.hard;
}

export function isSoft(hand: Hand): boolean {
  const totals = getHandTotals(hand);
  return totals.soft !== undefined && totals.soft !== totals.hard;
}

export function isBust(hand: Hand): boolean {
  return getHandTotals(hand).hard > 21;
}

export function isBlackjack(hand: Hand): boolean {
  return hand.cards.length === 2 && bestTotal(hand) === 21;
}
