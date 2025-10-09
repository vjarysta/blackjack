import { PRIMARY_SEAT_INDEX, filterSeatsForMode } from "../../ui/config";
import { bestTotal, isBust } from "../../engine/totals";
import {
  canDouble,
  canHit,
  canSplit,
  canSurrender,
} from "../../engine/rules";
import type { GameState, Hand, Seat } from "../../engine/types";
import type { ResultKind } from "./ResultToast";

export interface HandResolution {
  net: number;
  outcome: ResultKind;
  detail?: string;
}

export interface SettlementSummary {
  kind: ResultKind;
  amount: number;
  details?: string;
}

export interface ActionContext {
  hand: Hand;
  hit: boolean;
  stand: boolean;
  double: boolean;
  split: boolean;
  surrender: boolean;
}

export interface ActionAvailability {
  hit: boolean;
  stand: boolean;
  double: boolean;
  split: boolean;
  surrender: boolean;
  deal: boolean;
  finishInsurance: boolean;
  playDealer: boolean;
  nextRound: boolean;
}

const normalizeAmount = (value: number): number => {
  const rounded = Math.round(value * 100) / 100;
  return Math.abs(rounded) < 0.005 ? 0 : rounded;
};

export const hasReadySeat = (game: GameState): boolean => {
  const seat = game.seats[PRIMARY_SEAT_INDEX];
  if (!seat?.occupied) {
    return false;
  }
  if (seat.baseBet < game.rules.minBet || seat.baseBet > game.rules.maxBet) {
    return false;
  }
  return seat.baseBet > 0 && seat.baseBet <= game.bankroll;
};

export const findActiveHand = (game: GameState): Hand | null => {
  if (!game.activeHandId) {
    return null;
  }
  for (const seat of filterSeatsForMode(game.seats)) {
    const hand = seat.hands.find((candidate) => candidate.id === game.activeHandId);
    if (hand) {
      return hand;
    }
  }
  return null;
};

export const describeHand = (hand: Hand, game: GameState): HandResolution => {
  const bet = hand.bet;
  const insurance = hand.insuranceBet ?? 0;
  const dealerHand = game.dealer.hand;
  const dealerBust = isBust(dealerHand);
  const dealerBlackjack = dealerHand.isBlackjack;
  const playerBust = isBust(hand);
  const blackjackMultiplier = game.rules.blackjackPayout === "6:5" ? 1.2 : 1.5;

  let net = 0;
  let outcome: ResultKind = "push";
  let detail: string | undefined;

  if (hand.isSurrendered) {
    net -= bet / 2;
    outcome = "lose";
    detail = "Surrendered";
  } else if (dealerBlackjack) {
    if (hand.isBlackjack) {
      outcome = "push";
      detail = "Blackjack push";
    } else {
      net -= bet;
      outcome = "lose";
      detail = "Dealer blackjack";
    }
  } else if (playerBust) {
    net -= bet;
    outcome = "lose";
    detail = "Player busts";
  } else if (hand.isBlackjack) {
    net += bet * blackjackMultiplier;
    outcome = "blackjack";
    detail = `Blackjack ${game.rules.blackjackPayout}`;
  } else if (dealerBust) {
    net += bet;
    outcome = "win";
    detail = "Dealer busts";
  } else {
    const playerTotal = bestTotal(hand);
    const dealerTotal = bestTotal(dealerHand);
    if (playerTotal > dealerTotal) {
      net += bet;
      outcome = "win";
      detail = `${playerTotal} vs ${dealerTotal}`;
    } else if (playerTotal === dealerTotal) {
      outcome = "push";
      detail = `${playerTotal} each`;
    } else {
      net -= bet;
      outcome = "lose";
      detail = `${playerTotal} vs ${dealerTotal}`;
    }
  }

  if (insurance > 0) {
    if (dealerBlackjack) {
      net += insurance * 2;
      detail = detail ? `${detail} • Insurance pays` : "Insurance pays";
    } else {
      net -= insurance;
      detail = detail ? `${detail} • Insurance lost` : "Insurance lost";
    }
  }

  return { net, outcome, detail };
};

export const summarizeSettlement = (game: GameState): SettlementSummary | null => {
  const seat = game.seats[PRIMARY_SEAT_INDEX];
  if (!seat || !seat.occupied) {
    return null;
  }
  const hands = seat.hands;
  if (!hands || hands.length === 0) {
    return null;
  }

  const resolutions = hands.map((hand) => describeHand(hand, game));
  const total = resolutions.reduce((sum, entry) => sum + entry.net, 0);
  const amount = normalizeAmount(total);
  const anyBlackjack = resolutions.some(
    (entry) => entry.outcome === "blackjack" && entry.net > 0
  );

  let kind: ResultKind;
  if (amount > 0) {
    kind = anyBlackjack ? "blackjack" : "win";
  } else if (amount < 0) {
    kind = "lose";
  } else {
    kind = "push";
  }

  const details =
    resolutions.length > 1
      ? `${resolutions.length} hands settled`
      : resolutions[0]?.detail;

  const meaningful = resolutions.some(
    (entry) => Math.abs(entry.net) > 0.004 || entry.outcome !== "push"
  );
  if (!meaningful && amount === 0) {
    return { kind: "push", amount: 0, details };
  }

  return { kind, amount, details };
};

export const deriveActionContext = (
  game: GameState,
  hand: Hand | null,
  seat: Seat | null
): ActionContext | null => {
  if (!hand || !seat || game.phase !== "playerActions") {
    return null;
  }
  return {
    hand,
    hit: canHit(hand),
    stand: !hand.isResolved,
    double: canDouble(hand, game.rules) && game.bankroll >= hand.bet,
    split: canSplit(hand, seat, game.rules) && game.bankroll >= hand.bet,
    surrender: canSurrender(hand, game.rules),
  };
};

export const deriveActionAvailability = (
  game: GameState,
  context: ActionContext | null
): ActionAvailability => ({
  hit: Boolean(context?.hit),
  stand: Boolean(context?.stand),
  double: Boolean(context?.double),
  split: Boolean(context?.split),
  surrender: Boolean(context?.surrender),
  deal: game.phase === "betting" && hasReadySeat(game),
  finishInsurance: game.phase === "insurance",
  playDealer: game.phase === "dealerPlay",
  nextRound: game.phase === "settlement",
});

export const deriveFaceDownIndexes = (game: GameState): number[] => {
  if (game.phase === "settlement" || game.phase === "dealerPlay") {
    return [];
  }
  if (game.dealer.holeCard) {
    return [1];
  }
  return [];
};

export const deriveDealerStatus = (
  game: GameState,
  faceDownIndexes: number[]
): string => {
  if (faceDownIndexes.length > 0 && game.dealer.upcard) {
    return `Showing ${game.dealer.upcard.rank}`;
  }
  if (game.dealer.hand.cards.length > 0) {
    return `Total ${bestTotal(game.dealer.hand)}`;
  }
  return "Waiting";
};

export const selectPrimarySeat = (game: GameState): Seat | null =>
  game.seats[PRIMARY_SEAT_INDEX] ?? null;

export const deriveInsuranceOffer = (
  game: GameState,
  seat: Seat | null
): { handId: string | null; amount: number } => {
  if (game.phase !== "insurance" || !seat) {
    return { handId: null, amount: 0 };
  }
  const hand = seat.hands.find(
    (candidate) => candidate.insuranceBet === undefined && !candidate.isResolved
  );
  if (!hand) {
    return { handId: null, amount: 0 };
  }
  return { handId: hand.id, amount: Math.min(hand.bet / 2, game.bankroll) };
};

export const calculateTotalCardCount = (game: GameState): number => {
  const dealerCount = game.dealer.hand.cards.length + (game.dealer.holeCard ? 1 : 0);
  const playerCount = game.seats.reduce((sum, seatItem) => {
    const seatCards = seatItem.hands.reduce(
      (inner, currentHand) => inner + currentHand.cards.length,
      0
    );
    return sum + seatCards;
  }, 0);
  return dealerCount + playerCount;
};
