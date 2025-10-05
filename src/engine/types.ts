export const NUMBER_OF_DECKS = 6;

export type Suit = "♠" | "♥" | "♦" | "♣";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface Hand {
  id: string;
  cards: Card[];
  bet: number;
  insuranceBet?: number;
  isDoubled?: boolean;
  isSurrendered?: boolean;
  isResolved: boolean;
  isBlackjack: boolean;
  parentSeatIndex: number;
  originatesFromSplit?: boolean;
}

export interface Seat {
  index: number;
  occupied: boolean;
  hands: Hand[];
  baseBet: number;
}

export interface Dealer {
  upcard?: Card;
  holeCard?: Card;
  hand: Hand;
}

export interface Shoe {
  cards: Card[];
  discard: Card[];
  cutIndex: number;
}

export type BlackjackPayout = "3:2" | "6:5";
export type DoubleRule = "anyTwo" | "9to11" | "10to11";
export type SurrenderRule = "none" | "late" | "early";

export interface RuleConfig {
  dealerStandsOnSoft17: boolean;
  blackjackPayout: BlackjackPayout;
  allowInsurance: boolean;
  surrender: SurrenderRule;
  doubleAllowed: DoubleRule;
  doubleAfterSplit: boolean;
  splitMaxHands: number;
  splitPairsEqualRankOnly: boolean;
  resplitAces: boolean;
  hitOnSplitAces: boolean;
  dealerPeekOnTenOrAce: boolean;
  numberOfDecks: number;
  penetration: number;
  minBet: number;
  maxBet: number;
  currency: string;
  enableHiLoCounter: boolean;
  enableSounds: boolean;
}

export type Phase = "betting" | "insurance" | "playerActions" | "dealerPlay" | "settlement";

export interface GameState {
  phase: Phase;
  seats: Seat[];
  dealer: Dealer;
  shoe: Shoe;
  activeSeatIndex: number | null;
  activeHandId: string | null;
  bankroll: number;
  messageLog: string[];
  roundCount: number;
  rules: RuleConfig;
  pendingReshuffle: boolean;
  insuranceOffered: boolean;
}
