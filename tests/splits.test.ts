import { describe, expect, it } from 'vitest'

import { initGame, playerSplit } from '../src/engine/engine'
import { Hand } from '../src/engine/types'

const createBaseHand = (ranks: Hand['cards'][number]['rank'][]): Hand => ({
  id: 'test-hand',
  cards: ranks.map((rank) => ({ rank, suit: '♠' })),
  bet: 10,
  isResolved: false,
  isBlackjack: false,
  outcome: 'pending',
  parentSeatIndex: 0,
})

const setupSplitState = (ranks: Hand['cards'][number]['rank'][] ) => {
  const game = initGame()
  const seat = game.seats[0]
  seat.occupied = true
  seat.baseBet = 10
  seat.hands = [createBaseHand(ranks)]
  game.phase = 'playerActions'
  game.activeSeatIndex = 0
  game.activeHandId = seat.hands[0].id
  game.bankroll = 100
  game.shoe.cards = [
    { rank: '5', suit: '♣' },
    { rank: '9', suit: '♦' },
  ]
  return game
}

describe('splitting rules', () => {
  it('splits equal ranked cards and deals one card to each', () => {
    const game = setupSplitState(['8', '8'])
    const beforeBankroll = game.bankroll

    const result = playerSplit(game)
    const seat = result.seats[0]
    expect(seat.hands).toHaveLength(2)
    expect(seat.hands.every((hand) => hand.cards.length === 2)).toBe(true)
    expect(result.bankroll).toBe(beforeBankroll - seat.baseBet)
    expect(seat.hands.every((hand) => hand.isFromSplit)).toBe(true)
  })

  it('prevents splitting mismatched ten-value cards when rule requires equal ranks', () => {
    const game = setupSplitState(['10', 'J'])
    const result = playerSplit(game)
    expect(result.seats[0].hands).toHaveLength(1)
  })

  it('prevents resplitting aces when rule disabled', () => {
    const game = initGame()
    const seat = game.seats[0]
    seat.occupied = true
    seat.baseBet = 10
    seat.hands = [
      {
        ...createBaseHand(['A', 'A']),
        isFromSplit: true,
        isSplitAce: true,
      },
    ]
    game.phase = 'playerActions'
    game.activeSeatIndex = 0
    game.activeHandId = seat.hands[0].id
    game.bankroll = 100
    const result = playerSplit(game)
    expect(result.seats[0].hands).toHaveLength(1)
  })

  it('marks split aces as resolved when hits are not allowed', () => {
    const game = setupSplitState(['A', 'A'])
    const result = playerSplit(game)
    const seat = result.seats[0]
    expect(seat.hands.every((hand) => hand.isSplitAce)).toBe(true)
    expect(seat.hands.every((hand) => hand.isResolved)).toBe(true)
  })
})
