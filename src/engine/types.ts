export type Suit = '♠' | '♥' | '♦' | '♣'
export type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'

export interface Card {
  suit: Suit
  rank: Rank
}

export type HandOutcome =
  | 'pending'
  | 'blackjack'
  | 'win'
  | 'lose'
  | 'push'
  | 'bust'
  | 'surrender'

export interface Hand {
  id: string
  cards: Card[]
  bet: number
  insuranceBet?: number
  isDoubled?: boolean
  isSurrendered?: boolean
  isResolved: boolean
  isBlackjack: boolean
  outcome: HandOutcome
  parentSeatIndex: number
  isFromSplit?: boolean
  isSplitAce?: boolean
}

export interface Seat {
  index: number
  occupied: boolean
  hands: Hand[]
  baseBet: number
}

export interface Dealer {
  upcard?: Card
  holeCard?: Card
  hand: Hand
  hasPeeked: boolean
}

export interface Shoe {
  cards: Card[]
  discard: Card[]
  cutIndex: number
  decks: number
  penetration: number
  initialCount: number
  needsShuffle: boolean
}

export type BlackjackPayout = '3:2' | '6:5'
export type SurrenderRule = 'none' | 'late' | 'early'
export type DoubleRule = 'anyTwo' | '9to11' | '10to11'

export interface RuleConfig {
  dealerStandsOnSoft17: boolean
  blackjackPayout: BlackjackPayout
  allowInsurance: boolean
  surrender: SurrenderRule
  doubleAllowed: DoubleRule
  doubleAfterSplit: boolean
  splitMaxHands: number
  splitPairsEqualRankOnly: boolean
  resplitAces: boolean
  hitOnSplitAces: boolean
  dealerPeekOnTenOrAce: boolean
  numberOfDecks: number
  penetration: number
  minBet: number
  maxBet: number
  currency: 'EUR'
  enableHiLoCounter: boolean
  enableSounds: boolean
}

export type Phase = 'betting' | 'insurance' | 'playerActions' | 'dealerPlay' | 'settlement'

export interface GameState {
  phase: Phase
  seats: Seat[]
  dealer: Dealer
  shoe: Shoe
  activeSeatIndex: number | null
  activeHandId: string | null
  bankroll: number
  messageLog: string[]
  roundCount: number
  rules: RuleConfig
}
