import { Hand } from './types'

export interface HandTotals {
  hard: number
  soft?: number
}

const rankValues: Record<Hand['cards'][number]['rank'], number> = {
  A: 11,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 10,
  Q: 10,
  K: 10,
}

export const getHandTotals = (hand: Hand): HandTotals => {
  let total = 0
  let aceCount = 0

  hand.cards.forEach((card) => {
    if (card.rank === 'A') {
      aceCount += 1
      total += 11
    } else {
      total += rankValues[card.rank]
    }
  })

  while (total > 21 && aceCount > 0) {
    total -= 10
    aceCount -= 1
  }

  const hard = total - aceCount * 10
  const soft = aceCount > 0 ? total : undefined

  return { hard, soft }
}

export const bestTotal = (hand: Hand): number => {
  const totals = getHandTotals(hand)
  return totals.soft ?? totals.hard
}

export const isBust = (hand: Hand): boolean => {
  const totals = getHandTotals(hand)
  return totals.soft === undefined ? totals.hard > 21 : false
}

export const isSoft = (hand: Hand): boolean => {
  const totals = getHandTotals(hand)
  return totals.soft !== undefined
}
