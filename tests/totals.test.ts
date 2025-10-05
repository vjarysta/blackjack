import { describe, expect, it } from 'vitest'

import { getHandTotals, isBust, isSoft, bestTotal } from '../src/engine/totals'
import { Hand } from '../src/engine/types'

const makeHand = (ranks: Hand['cards'][number]['rank'][]): Hand => ({
  id: 'hand',
  cards: ranks.map((rank) => ({ rank, suit: '♠' })),
  bet: 10,
  isResolved: false,
  isBlackjack: false,
  outcome: 'pending',
  parentSeatIndex: 0,
})

describe('hand totals', () => {
  it('computes soft totals with multiple aces correctly', () => {
    const hand = makeHand(['A', 'A', '9'])
    const totals = getHandTotals(hand)
    expect(totals.hard).toBe(11)
    expect(totals.soft).toBe(21)
    expect(bestTotal(hand)).toBe(21)
    expect(isSoft(hand)).toBe(true)
  })

  it('identifies hard totals without soft alternative', () => {
    const hand = makeHand(['10', '7'])
    const totals = getHandTotals(hand)
    expect(totals.hard).toBe(17)
    expect(totals.soft).toBeUndefined()
    expect(bestTotal(hand)).toBe(17)
    expect(isSoft(hand)).toBe(false)
  })

  it('treats soft seventeen as not bust', () => {
    const hand = makeHand(['A', '6'])
    expect(isBust(hand)).toBe(false)
    expect(isSoft(hand)).toBe(true)
    expect(bestTotal(hand)).toBe(17)
  })

  it('marks hand as bust when exceeding 21', () => {
    const hand = makeHand(['K', '9', '5'])
    expect(isBust(hand)).toBe(true)
  })
})
