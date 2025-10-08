import { bestTotal, getHandTotals, isBust } from "./totals";
import type { GameState, Hand, RuleConfig, Seat } from "./types";

const isPair = (hand: Hand, rules: RuleConfig): boolean => {
  if (hand.cards.length !== 2) {
    return false;
  }
  const [first, second] = hand.cards;
  if (rules.splitPairsEqualRankOnly) {
    return first.rank === second.rank;
  }
  const tenValueRanks = new Set(["10", "J", "Q", "K"]);
  if (tenValueRanks.has(first.rank) && tenValueRanks.has(second.rank)) {
    return true;
  }
  return first.rank === second.rank;
};

const seatHandCount = (seat: Seat): number => seat.hands.length;

export const canHit = (hand: Hand): boolean => {
  if (hand.isResolved || hand.isSurrendered || hand.isBlackjack) {
    return false;
  }
  if (hand.isSplitAce && hand.cards.length >= 2) {
    return false;
  }
  if (bestTotal(hand) === 21) {
    return false;
  }
  return !isBust(hand);
};

export const canStand = (hand: Hand): boolean => !hand.isResolved;

export const canDouble = (hand: Hand, rules: RuleConfig): boolean => {
  if (hand.isResolved || hand.isSurrendered) {
    return false;
  }
  if (hand.cards.length !== 2) {
    return false;
  }
  if (hand.isSplitHand && !rules.doubleAfterSplit) {
    return false;
  }
  if (hand.isDoubled) {
    return false;
  }
  if (hand.isBlackjack) {
    return false;
  }
  const totals = getHandTotals(hand);
  const candidate = totals.soft && totals.soft <= 21 ? totals.soft : totals.hard;
  switch (rules.doubleAllowed) {
    case "anyTwo":
      return true;
    case "9to11":
      return candidate >= 9 && candidate <= 11;
    case "10to11":
      return candidate >= 10 && candidate <= 11;
    default:
      return false;
  }
};

export const canSplit = (hand: Hand, seat: Seat, rules: RuleConfig): boolean => {
  if (hand.isResolved || hand.cards.length !== 2 || hand.isBlackjack) {
    return false;
  }
  if (!isPair(hand, rules)) {
    return false;
  }
  if (seatHandCount(seat) >= rules.splitMaxHands) {
    return false;
  }
  if (hand.cards[0].rank === "A" && seat.hands.filter((h) => h.isSplitAce).length > 0 && !rules.resplitAces) {
    return false;
  }
  return true;
};

export const canSurrender = (hand: Hand, rules: RuleConfig): boolean => {
  if (rules.surrender === "none") {
    return false;
  }
  if (hand.isResolved || hand.cards.length !== 2 || hand.isBlackjack) {
    return false;
  }
  if (hand.isSplitHand) {
    return false;
  }
  if (hand.hasActed) {
    return false;
  }
  return true;
};

export const canTakeInsurance = (state: GameState, hand: Hand): boolean => {
  if (!state.rules.allowInsurance) {
    return false;
  }
  if (state.phase !== "insurance") {
    return false;
  }
  if (hand.isResolved || hand.insuranceBet !== undefined) {
    return false;
  }
  return state.dealer.upcard?.rank === "A";
};

export const getLegalActions = (state: GameState, hand: Hand): {
  canHit: boolean;
  canStand: boolean;
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
} => {
  const seat = state.seats[hand.parentSeatIndex];
  return {
    canHit: canHit(hand),
    canStand: canStand(hand),
    canDouble: canDouble(hand, state.rules),
    canSplit: canSplit(hand, seat, state.rules),
    canSurrender: canSurrender(hand, state.rules)
  };
};

export const isBlackjackHand = (hand: Hand): boolean =>
  hand.cards.length === 2 && bestTotal(hand) === 21;
