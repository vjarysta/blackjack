import { describe, expect, it } from 'vitest'

import { initGame, playDealer } from '../src/engine/engine'
import { Card } from '../src/engine/types'

const aceSixHand = [{ rank: 'A', suit: '♠' }, { rank: '6', suit: '♦' }] as Card[]

describe('dealer play', () => {
  it('stands on soft 17 when S17 enabled', () => {
    const state = initGame()
    state.phase = 'dealerPlay'
    state.dealer.hand.cards = [...aceSixHand]
    state.dealer.hand.isResolved = false
    state.dealer.upcard = state.dealer.hand.cards[0]
    state.dealer.holeCard = state.dealer.hand.cards[1]
    state.shoe.cards = [{ rank: '2', suit: '♣' }]

    const result = playDealer(state)
    expect(result.dealer.hand.cards).toHaveLength(2)
    expect(result.phase).toBe('settlement')
  })

  it('hits soft 17 when H17 enabled', () => {
    const state = initGame({ dealerStandsOnSoft17: false })
    state.phase = 'dealerPlay'
    state.dealer.hand.cards = [...aceSixHand]
    state.dealer.hand.isResolved = false
    state.dealer.upcard = state.dealer.hand.cards[0]
    state.dealer.holeCard = state.dealer.hand.cards[1]
    state.shoe.cards = [
      { rank: '2', suit: '♣' },
      { rank: '4', suit: '♠' },
      { rank: '5', suit: '♣' },
    ]

    const result = playDealer(state)
    expect(result.dealer.hand.cards.length).toBeGreaterThan(2)
    expect(result.phase).toBe('settlement')
  })
})
