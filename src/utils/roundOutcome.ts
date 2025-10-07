import { bestTotal, isBust } from "../engine/totals";
import type { GameState, Hand, Seat } from "../engine/types";
import { filterSeatsForMode } from "../ui/config";

const MIN_AMOUNT = 0.005;

interface HandSummary {
  hand: Hand;
  seatIndex: number;
}

interface OutcomeTotals {
  totalBet: number;
  totalInsurance: number;
  basePayout: number;
  insurancePayout: number;
  hasBlackjackWin: boolean;
  hands: HandSummary[];
}

const accumulateOutcome = (game: GameState, seats: Seat[]): OutcomeTotals => {
  const blackjackMultiplier = game.rules.blackjackPayout === "6:5" ? 1.2 : 1.5;
  const dealerHand = game.dealer.hand;
  const dealerBlackjack = dealerHand.isBlackjack;
  const dealerBust = isBust(dealerHand);
  const dealerTotal = bestTotal(dealerHand);

  const totals: OutcomeTotals = {
    totalBet: 0,
    totalInsurance: 0,
    basePayout: 0,
    insurancePayout: 0,
    hasBlackjackWin: false,
    hands: []
  };

  for (const seat of seats) {
    for (const hand of seat.hands) {
      const bet = hand.bet ?? 0;
      const insuranceBet = hand.insuranceBet ?? 0;

      if (bet <= 0 && insuranceBet <= 0) {
        continue;
      }

      totals.hands.push({ hand, seatIndex: seat.index });
      totals.totalBet += bet;
      totals.totalInsurance += insuranceBet;

      if (dealerBlackjack) {
        if (insuranceBet > 0) {
          totals.insurancePayout += insuranceBet * 3;
        }
        if (hand.isBlackjack) {
          totals.basePayout += bet;
        }
        continue;
      }

      if (hand.isSurrendered) {
        totals.basePayout += bet / 2;
        continue;
      }

      if (isBust(hand)) {
        continue;
      }

      if (hand.isBlackjack) {
        totals.basePayout += bet * (1 + blackjackMultiplier);
        totals.hasBlackjackWin = true;
        continue;
      }

      if (dealerBust) {
        totals.basePayout += bet * 2;
        continue;
      }

      const playerTotal = bestTotal(hand);
      if (playerTotal > dealerTotal) {
        totals.basePayout += bet * 2;
      } else if (playerTotal === dealerTotal) {
        totals.basePayout += bet;
      }
    }
  }

  return totals;
};

export interface RoundOutcomeSummary {
  net: number;
  baseNet: number;
  insuranceNet: number;
  kind: "win" | "lose" | "push" | "blackjack";
  hasBlackjackWin: boolean;
  dealerBust: boolean;
  dealerTotal: number;
  dealerBlackjack: boolean;
  hands: HandSummary[];
}

export const calculateRoundOutcome = (game: GameState): RoundOutcomeSummary | null => {
  const seats = filterSeatsForMode(game.seats);
  const dealerHand = game.dealer.hand;
  const totals = accumulateOutcome(game, seats);

  if (totals.hands.length === 0) {
    return null;
  }

  const baseNet = Math.round((totals.basePayout - totals.totalBet) * 100) / 100;
  const insuranceNet = Math.round((totals.insurancePayout - totals.totalInsurance) * 100) / 100;
  const net = Math.round((baseNet + insuranceNet) * 100) / 100;

  let kind: RoundOutcomeSummary["kind"] = "push";
  if (net > MIN_AMOUNT) {
    kind = totals.hasBlackjackWin ? "blackjack" : "win";
  } else if (net < -MIN_AMOUNT) {
    kind = "lose";
  }

  return {
    net,
    baseNet,
    insuranceNet,
    kind,
    hasBlackjackWin: totals.hasBlackjackWin,
    dealerBust: isBust(dealerHand),
    dealerTotal: bestTotal(dealerHand),
    dealerBlackjack: dealerHand.isBlackjack,
    hands: totals.hands
  };
};

export type RoundOutcomeHandSummary = HandSummary;
