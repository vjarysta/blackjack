import { type Hand } from "./types";

const RANK_VALUES: Record<string, number> = {
  A: 1,
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
  K: 10
};

export function getHandTotals(hand: Hand): { hard: number; soft?: number } {
  let total = 0;
  let aceCount = 0;
  hand.cards.forEach((card) => {
    total += RANK_VALUES[card.rank];
    if (card.rank === "A") {
      aceCount += 1;
    }
  });
  const hard = total;
  const soft = aceCount > 0 && total + 10 <= 21 ? total + 10 : undefined;
  return { hard, soft };
}

export function bestTotal(hand: Hand): number {
  const totals = getHandTotals(hand);
  return totals.soft ?? totals.hard;
}

export function isBust(hand: Hand): boolean {
  const totals = getHandTotals(hand);
  if (totals.soft !== undefined && totals.soft <= 21) {
    return false;
  }
  return totals.hard > 21;
}

export function isSoft(hand: Hand): boolean {
  const totals = getHandTotals(hand);
  return totals.soft !== undefined && totals.soft <= 21;
}
