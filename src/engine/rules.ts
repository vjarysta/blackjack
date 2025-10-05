import { bestTotal, getHandTotals, isBust } from './totals'
import { GameState, Hand } from './types'

const handHasTwoCards = (hand: Hand): boolean => hand.cards.length === 2

export const canHit = (hand: Hand, state: GameState): boolean => {
  if (state.phase !== 'playerActions') {
    return false
  }
  if (hand.isResolved || hand.isSurrendered) {
    return false
  }
  if (isBust(hand)) {
    return false
  }
  if (hand.isSplitAce && !state.rules.hitOnSplitAces && hand.cards.length >= 2) {
    return false
  }
  return true
}

export const canStand = (hand: Hand, state: GameState): boolean => {
  if (state.phase !== 'playerActions') {
    return false
  }
  if (hand.isResolved) {
    return false
  }
  if (hand.isSurrendered) {
    return false
  }
  return true
}

export const canDouble = (hand: Hand, state: GameState): boolean => {
  if (state.phase !== 'playerActions') {
    return false
  }
  if (hand.isResolved || hand.isSurrendered || hand.isDoubled) {
    return false
  }
  if (!handHasTwoCards(hand)) {
    return false
  }
  if (hand.isFromSplit && !state.rules.doubleAfterSplit) {
    return false
  }
  if (hand.isSplitAce) {
    return false
  }
  const totals = getHandTotals(hand)
  switch (state.rules.doubleAllowed) {
    case 'anyTwo':
      return true
    case '9to11':
      return totals.hard >= 9 && totals.hard <= 11
    case '10to11':
      return totals.hard === 10 || totals.hard === 11
    default:
      return false
  }
}

export const canSplit = (hand: Hand, state: GameState): boolean => {
  if (state.phase !== 'playerActions') {
    return false
  }
  if (!handHasTwoCards(hand)) {
    return false
  }
  if (hand.isFromSplit && hand.isSplitAce && !state.rules.resplitAces) {
    return false
  }
  if (hand.isResolved || hand.isSurrendered) {
    return false
  }
  const seat = state.seats.find((s) => s.index === hand.parentSeatIndex)
  if (!seat) {
    return false
  }
  if (seat.hands.length >= state.rules.splitMaxHands) {
    return false
  }
  const [first, second] = hand.cards
  if (!first || !second) {
    return false
  }
  if (state.rules.splitPairsEqualRankOnly) {
    if (first.rank !== second.rank) {
      return false
    }
  } else {
    const firstValue = bestTotal({ ...hand, cards: [first] })
    const secondValue = bestTotal({ ...hand, cards: [second] })
    if (firstValue !== secondValue) {
      return false
    }
  }
  return true
}

export const canSurrender = (hand: Hand, state: GameState): boolean => {
  if (state.phase !== 'playerActions') {
    return false
  }
  if (state.rules.surrender === 'none') {
    return false
  }
  if (!handHasTwoCards(hand)) {
    return false
  }
  if (hand.isFromSplit) {
    return false
  }
  if (hand.isResolved || hand.isSurrendered) {
    return false
  }
  return true
}

export const canTakeInsurance = (hand: Hand, state: GameState): boolean => {
  if (!state.rules.allowInsurance) {
    return false
  }
  if (state.phase !== 'insurance') {
    return false
  }
  if (hand.insuranceBet !== undefined) {
    return false
  }
  if (!state.dealer.upcard || state.dealer.upcard.rank !== 'A') {
    return false
  }
  return true
}
