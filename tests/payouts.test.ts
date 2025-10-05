import { describe, expect, it } from 'vitest'

import {
  initGame,
  playerDouble,
  playerSurrender,
  settleAllHands,
  takeInsurance,
} from '../src/engine/engine'
import { bestTotal } from '../src/engine/totals'
import { GameState, Hand } from '../src/engine/types'

let handCounter = 0

const createHand = (cards: Hand['cards']): Hand => ({
  id: `hand-${handCounter += 1}`,
  cards,
  bet: 20,
  isResolved: false,
  isBlackjack: false,
  outcome: 'pending',
  parentSeatIndex: 0,
})

const prepareSettlementState = (hand: Hand, dealerCards: Hand['cards']): GameState => {
  const game = initGame()
  const seat = game.seats[0]
  seat.occupied = true
  seat.baseBet = hand.bet
  seat.hands = [hand]
  game.phase = 'settlement'
  game.activeSeatIndex = null
  game.activeHandId = null
  game.bankroll = 0
  game.dealer.hand.cards = dealerCards
  game.dealer.upcard = dealerCards[0]
  game.dealer.holeCard = dealerCards[1]
  const dealerEvalHand: Hand = {
    id: 'dealer-test',
    cards: dealerCards,
    bet: 0,
    isResolved: false,
    isBlackjack: false,
    outcome: 'pending',
    parentSeatIndex: -1,
  }
  game.dealer.hand.isBlackjack = dealerCards.length === 2 && bestTotal(dealerEvalHand) === 21
  return game
}

describe('payouts and side actions', () => {
  it('pays 3:2 for a natural blackjack', () => {
    const playerHand = createHand([
      { rank: 'A', suit: '♠' },
      { rank: 'K', suit: '♥' },
    ])
    playerHand.isBlackjack = true
    playerHand.isResolved = true
    const game = prepareSettlementState(playerHand, [
      { rank: '9', suit: '♣' },
      { rank: '8', suit: '♦' },
    ])

    const settled = settleAllHands(game)
    expect(settled.bankroll).toBeCloseTo(50)
    expect(settled.seats[0].hands[0].outcome).toBe('blackjack')
  })

  it('pushes when both dealer and player have blackjack', () => {
    const playerHand = createHand([
      { rank: 'A', suit: '♠' },
      { rank: 'K', suit: '♥' },
    ])
    playerHand.isBlackjack = true
    playerHand.isResolved = true
    const dealerCards = [
      { rank: 'A', suit: '♦' },
      { rank: 'J', suit: '♣' },
    ]
    const game = prepareSettlementState(playerHand, dealerCards)

    const settled = settleAllHands(game)
    expect(settled.bankroll).toBe(playerHand.bet)
    expect(settled.seats[0].hands[0].outcome).toBe('push')
  })

  it('returns half the bet when surrendering late', () => {
    const game = initGame()
    const seat = game.seats[0]
    seat.occupied = true
    seat.baseBet = 20
    seat.hands = [
      {
        id: 'surrender',
        cards: [
          { rank: '9', suit: '♠' },
          { rank: '7', suit: '♥' },
        ],
        bet: 20,
        isResolved: false,
        isBlackjack: false,
        outcome: 'pending',
        parentSeatIndex: 0,
      },
    ]
    game.phase = 'playerActions'
    game.activeSeatIndex = 0
    game.activeHandId = seat.hands[0].id
    game.bankroll = 100

    const after = playerSurrender(game)
    expect(after.bankroll).toBe(110)
    expect(after.seats[0].hands[0].outcome).toBe('surrender')
  })

  it('doubles the wager and draws exactly one card on double down', () => {
    const game = initGame()
    const seat = game.seats[0]
    seat.occupied = true
    seat.baseBet = 20
    seat.hands = [
      {
        id: 'double',
        cards: [
          { rank: '9', suit: '♠' },
          { rank: '2', suit: '♥' },
        ],
        bet: 20,
        isResolved: false,
        isBlackjack: false,
        outcome: 'pending',
        parentSeatIndex: 0,
      },
    ]
    game.phase = 'playerActions'
    game.activeSeatIndex = 0
    game.activeHandId = seat.hands[0].id
    game.bankroll = 100
    game.shoe.cards = [{ rank: '5', suit: '♦' }]

    const after = playerDouble(game)
    const hand = after.seats[0].hands[0]
    expect(hand.cards).toHaveLength(3)
    expect(hand.bet).toBe(40)
    expect(after.bankroll).toBe(80)
    expect(hand.isResolved).toBe(true)
  })

  it('pays insurance at 2:1 when dealer has blackjack', () => {
    const game = initGame()
    const seat = game.seats[0]
    seat.occupied = true
    seat.baseBet = 20
    seat.hands = [createHand([
      { rank: '9', suit: '♠' },
      { rank: '8', suit: '♥' },
    ])]
    game.phase = 'insurance'
    game.dealer.upcard = { rank: 'A', suit: '♦' }
    game.bankroll = 100

    const afterInsurance = takeInsurance(game, 0, seat.hands[0].id, 10)
    expect(afterInsurance.bankroll).toBe(90)

    const readyForSettlement: GameState = structuredClone(afterInsurance)
    readyForSettlement.dealer.hand.cards = [
      { rank: 'A', suit: '♦' },
      { rank: 'K', suit: '♣' },
    ]
    readyForSettlement.dealer.hand.isBlackjack = true
    readyForSettlement.dealer.upcard = readyForSettlement.dealer.hand.cards[0]
    readyForSettlement.dealer.holeCard = readyForSettlement.dealer.hand.cards[1]
    readyForSettlement.phase = 'settlement'

    const settled = settleAllHands(readyForSettlement)
    expect(settled.bankroll).toBe(120)
  })

  it('pays even money on a standard win and returns stake on push', () => {
    const playerHand = createHand([
      { rank: '9', suit: '♠' },
      { rank: '7', suit: '♥' },
    ])
    const dealerHand = [
      { rank: '9', suit: '♦' },
      { rank: '6', suit: '♣' },
      { rank: '10', suit: '♠' },
    ]
    const game = prepareSettlementState(playerHand, dealerHand)
    const settled = settleAllHands(game)
    expect(settled.bankroll).toBe(40)
    expect(settled.seats[0].hands[0].outcome).toBe('win')

    const pushHand = createHand([
      { rank: '10', suit: '♠' },
      { rank: '8', suit: '♦' },
    ])
    const pushGame = prepareSettlementState(pushHand, [
      { rank: '10', suit: '♣' },
      { rank: '8', suit: '♥' },
    ])
    const pushSettled = settleAllHands(pushGame)
    expect(pushSettled.bankroll).toBe(20)
    expect(pushSettled.seats[0].hands[0].outcome).toBe('push')
  })
})
