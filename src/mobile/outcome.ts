import { bestTotal, isBust } from "../engine/totals";
import type { GameState, Seat } from "../engine/types";

export const MIN_AMOUNT = 0.005;

export type OutcomeKind = "win" | "lose" | "push" | "blackjack" | "insurance";

export interface OutcomeSummary {
  net: number;
  baseNet: number;
  insuranceNet: number;
  hasBlackjackWin: boolean;
}

const roundToCents = (value: number): number => Math.round(value * 100) / 100;

export const summarizeSeatOutcome = (game: GameState, seat: Seat | null): OutcomeSummary | null => {
  if (!seat) {
    return null;
  }
  const dealerHand = game.dealer.hand;
  const dealerBlackjack = dealerHand.isBlackjack;
  const dealerBust = isBust(dealerHand);
  const dealerTotal = bestTotal(dealerHand);

  let totalBet = 0;
  let totalInsurance = 0;
  let basePayout = 0;
  let insurancePayout = 0;
  let hasBlackjackWin = false;

  const blackjackMultiplier = game.rules.blackjackPayout === "6:5" ? 1.2 : 1.5;

  for (const hand of seat.hands) {
    const bet = hand.bet ?? 0;
    const insuranceBet = hand.insuranceBet ?? 0;

    totalBet += bet;
    totalInsurance += insuranceBet;

    if (dealerBlackjack) {
      if (insuranceBet > 0) {
        insurancePayout += insuranceBet * 3;
      }
      if (hand.isBlackjack) {
        basePayout += bet;
      }
      continue;
    }

    if (hand.isSurrendered) {
      basePayout += bet / 2;
      continue;
    }

    if (isBust(hand)) {
      continue;
    }

    if (hand.isBlackjack) {
      basePayout += bet * (1 + blackjackMultiplier);
      hasBlackjackWin = true;
      continue;
    }

    if (dealerBust) {
      basePayout += bet * 2;
      continue;
    }

    const playerTotal = bestTotal(hand);
    if (playerTotal > dealerTotal) {
      basePayout += bet * 2;
    } else if (playerTotal === dealerTotal) {
      basePayout += bet;
    }
  }

  if (totalBet <= 0 && totalInsurance <= 0) {
    return null;
  }

  const baseNet = roundToCents(basePayout - totalBet);
  const insuranceNet = roundToCents(insurancePayout - totalInsurance);
  const net = roundToCents(baseNet + insuranceNet);

  return { net, baseNet, insuranceNet, hasBlackjackWin };
};

export const resolveOutcomeKind = (outcome: OutcomeSummary): OutcomeKind => {
  const { net, baseNet, insuranceNet, hasBlackjackWin } = outcome;
  if (net > MIN_AMOUNT) {
    if (insuranceNet > MIN_AMOUNT && baseNet <= MIN_AMOUNT) {
      return "insurance";
    }
    return hasBlackjackWin ? "blackjack" : "win";
  }
  if (net < -MIN_AMOUNT) {
    return "lose";
  }
  return "push";
};
