import type { Hand } from "./types";

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
  K: 10
};

export interface HandTotals {
  hard: number;
  soft?: number;
}

export const getHandTotals = (hand: Hand): HandTotals => {
  let hardTotal = 0;
  let aceCount = 0;

  for (const card of hand.cards) {
    if (card.rank === "A") {
      aceCount += 1;
      hardTotal += 1;
    } else {
      hardTotal += RANK_VALUES[card.rank];
    }
  }

  const softTotalCandidate = aceCount > 0 && hardTotal + 10 <= 21 ? hardTotal + 10 : undefined;

  return {
    hard: hardTotal,
    soft: softTotalCandidate && softTotalCandidate <= 21 ? softTotalCandidate : undefined
  };
};

export const bestTotal = (hand: Hand): number => {
  const totals = getHandTotals(hand);
  return totals.soft ?? totals.hard;
};

export const isBust = (hand: Hand): boolean => bestTotal(hand) > 21;

export const isSoft = (hand: Hand): boolean => {
  const totals = getHandTotals(hand);
  return totals.soft !== undefined && totals.soft !== totals.hard;
};
