import { bestTotal } from "./totals";
import { type GameState, type Hand, type RuleConfig } from "./types";

function getActiveHand(state: GameState): Hand | undefined {
  if (state.activeHandId === null) {
    return undefined;
  }
  const seat = state.activeSeatIndex !== null ? state.seats[state.activeSeatIndex] : undefined;
  return seat?.hands.find((hand) => hand.id === state.activeHandId);
}

export function canHit(state: GameState, hand?: Hand): boolean {
  const target = hand ?? getActiveHand(state);
  if (!target) return false;
  if (target.isResolved || target.isSurrendered) return false;
  if (target.cards.length === 0) return false;
  if (target.cards.length === 2 && target.isBlackjack) return false;
  if (target.parentSeatIndex !== state.activeSeatIndex) return false;
  return true;
}

export function canStand(state: GameState, hand?: Hand): boolean {
  return canHit(state, hand);
}

export function canDouble(state: GameState, rules: RuleConfig, hand?: Hand): boolean {
  const target = hand ?? getActiveHand(state);
  if (!target) return false;
  if (target.cards.length !== 2) return false;
  if (target.isResolved || target.isSurrendered) return false;
  if (target.isBlackjack) return false;
  const seat = state.seats[target.parentSeatIndex];
  if (!rules.doubleAfterSplit && seat.hands[0].id !== target.id && seat.hands.length > 1) {
    return false;
  }
  const total = bestTotal(target);
  if (rules.doubleAllowed === "9to11" && (total < 9 || total > 11)) return false;
  if (rules.doubleAllowed === "10to11" && (total < 10 || total > 11)) return false;
  if (state.bankroll < target.bet) return false;
  return true;
}

function isPair(hand: Hand): boolean {
  if (hand.cards.length !== 2) return false;
  const [first, second] = hand.cards;
  return first.rank === second.rank;
}

export function canSplit(state: GameState, rules: RuleConfig, hand?: Hand): boolean {
  const target = hand ?? getActiveHand(state);
  if (!target) return false;
  if (!isPair(target)) return false;
  if (target.isResolved || target.isSurrendered) return false;
  const seat = state.seats[target.parentSeatIndex];
  if (seat.hands.length >= rules.splitMaxHands) return false;
  const [firstCard] = target.cards;
  if (!firstCard) return false;
  if (rules.splitPairsEqualRankOnly) {
    const secondCard = target.cards[1];
    if (!secondCard || firstCard.rank !== secondCard.rank) {
      return false;
    }
  }
  if (firstCard.rank === "A" && !rules.resplitAces) {
    const splitCount = seat.hands.filter((h) => h.cards[0]?.rank === "A").length;
    if (splitCount > 1) return false;
  }
  if (state.bankroll < target.bet) return false;
  return true;
}

export function canSurrender(state: GameState, rules: RuleConfig, hand?: Hand): boolean {
  if (rules.surrender === "none") return false;
  if (rules.surrender === "late" && state.phase !== "playerActions") return false;
  if (rules.surrender === "early" && state.phase !== "insurance") return false;
  const target = hand ?? getActiveHand(state);
  if (!target) return false;
  if (target.cards.length !== 2) return false;
  if (target.isResolved || target.isSurrendered || target.isBlackjack) return false;
  return true;
}

export function canTakeInsurance(state: GameState, _rules: RuleConfig, hand?: Hand): boolean {
  if (state.phase !== "insurance") return false;
  const target = hand ?? getActiveHand(state);
  if (!target) return false;
  if (target.insuranceBet !== undefined) return false;
  const dealerUpcard = state.dealer.upcard;
  if (!dealerUpcard || dealerUpcard.rank !== "A") return false;
  return true;
}

export function allowedActions(state: GameState, rules: RuleConfig, hand?: Hand): {
  hit: boolean;
  stand: boolean;
  double: boolean;
  split: boolean;
  surrender: boolean;
  insurance: boolean;
} {
  const target = hand ?? getActiveHand(state);
  return {
    hit: target ? canHit(state, target) : false,
    stand: target ? canStand(state, target) : false,
    double: target ? canDouble(state, rules, target) : false,
    split: target ? canSplit(state, rules, target) : false,
    surrender: target ? canSurrender(state, rules, target) : false,
    insurance: target ? canTakeInsurance(state, rules, target) : false,
  };
}
