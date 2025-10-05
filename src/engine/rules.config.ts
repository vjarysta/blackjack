import { type RuleConfig } from "./types";

export const NUMBER_OF_DECKS = 6;

export const defaultRules: RuleConfig = {
  dealerStandsOnSoft17: true,
  blackjackPayout: "3:2",
  allowInsurance: true,
  surrender: "late",
  doubleAllowed: "anyTwo",
  doubleAfterSplit: true,
  splitMaxHands: 4,
  splitPairsEqualRankOnly: true,
  resplitAces: false,
  hitOnSplitAces: false,
  dealerPeekOnTenOrAce: true,
  numberOfDecks: NUMBER_OF_DECKS,
  penetration: 0.75,
  minBet: 1,
  maxBet: Number.POSITIVE_INFINITY,
  currency: "EUR",
  enableHiLoCounter: false,
  enableSounds: false,
};
