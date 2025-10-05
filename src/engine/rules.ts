import { bestTotal, isBust } from "./totals";
import { type Hand, type RuleConfig, type Seat } from "./types";

export function canHit(hand: Hand): boolean {
  return !hand.isResolved && !hand.isSurrendered && !hand.isBlackjack && !isBust(hand);
}

export function canStand(hand: Hand): boolean {
  return !hand.isResolved;
}

function totalAllowsDouble(rule: RuleConfig, hand: Hand): boolean {
  const total = bestTotal(hand);
  if (rule.doubleAllowed === "anyTwo") {
    return true;
  }
  if (rule.doubleAllowed === "9to11") {
    return total >= 9 && total <= 11;
  }
  return total === 10 || total === 11;
}

export function canDouble(hand: Hand, rule: RuleConfig): boolean {
  if (hand.isResolved || hand.isSurrendered || hand.isBlackjack || hand.isDoubled) {
    return false;
  }
  if (hand.cards.length !== 2) {
    return false;
  }
  if (hand.originatesFromSplit && !rule.doubleAfterSplit) {
    return false;
  }
  return totalAllowsDouble(rule, hand);
}

function isPair(hand: Hand, equalRankOnly: boolean): boolean {
  if (hand.cards.length !== 2) {
    return false;
  }
  const [first, second] = hand.cards;
  if (!first || !second) {
    return false;
  }
  if (equalRankOnly) {
    return first.rank === second.rank;
  }
  const value = (rank: string): number => {
    if (rank === "A") return 11;
    if (rank === "K" || rank === "Q" || rank === "J" || rank === "10") return 10;
    return Number(rank);
  };
  return value(first.rank) === value(second.rank);
}

export function canSplit(hand: Hand, seat: Seat, rules: RuleConfig): boolean {
  if (hand.isResolved || hand.isSurrendered || hand.isBlackjack) {
    return false;
  }
  if (!isPair(hand, rules.splitPairsEqualRankOnly)) {
    return false;
  }
  if (seat.hands.length >= rules.splitMaxHands) {
    return false;
  }
  const firstRank = hand.cards[0]?.rank;
  if (firstRank === "A") {
    if (hand.originatesFromSplit && !rules.resplitAces) {
      return false;
    }
  }
  return true;
}

export function canSurrender(hand: Hand, rules: RuleConfig): boolean {
  if (rules.surrender === "none") {
    return false;
  }
  if (hand.isResolved || hand.isSurrendered || hand.isBlackjack) {
    return false;
  }
  return hand.cards.length === 2;
}

export function canTakeInsurance(hand: Hand, rules: RuleConfig): boolean {
  if (!rules.allowInsurance) {
    return false;
  }
  if (hand.insuranceBet !== undefined) {
    return false;
  }
  return hand.cards.length === 2;
}
