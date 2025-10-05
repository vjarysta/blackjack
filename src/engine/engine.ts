import { produce } from 'immer'

import { canDouble, canHit, canSplit, canStand, canSurrender } from './rules'
import { createShoe, currentPenetration, discardCards, drawCard, reshuffleShoe } from './shoe'
import { bestTotal, getHandTotals, isBust } from './totals'
import { GameState, Hand, RuleConfig } from './types'
import { SEAT_COUNT, STARTING_BANKROLL, defaultRules } from './rules.config'

const HAND_LOG_LIMIT = 50
let handSequence = 0

const nextHandId = (): string => {
  handSequence += 1
  return `hand-${handSequence}`
}

const createEmptyHand = (parentSeatIndex: number, bet = 0): Hand => ({
  id: nextHandId(),
  cards: [],
  bet,
  isResolved: false,
  isBlackjack: false,
  outcome: 'pending',
  parentSeatIndex,
})

const logMessage = (state: GameState, message: string): void => {
  state.messageLog = [message, ...state.messageLog].slice(0, HAND_LOG_LIMIT)
}

const mergeRules = (rules?: Partial<RuleConfig>): RuleConfig => ({
  ...defaultRules,
  ...rules,
})

const findSeat = (state: GameState, seatIndex: number) =>
  state.seats.find((seat) => seat.index === seatIndex)

const getActiveSeat = (state: GameState) =>
  state.activeSeatIndex !== null ? findSeat(state, state.activeSeatIndex) ?? null : null

const getActiveHand = (state: GameState): Hand | null => {
  if (state.activeHandId === null) {
    return null
  }
  const seat = getActiveSeat(state)
  return seat?.hands.find((hand) => hand.id === state.activeHandId) ?? null
}

const isNaturalBlackjack = (hand: Hand): boolean => {
  if (hand.cards.length !== 2) {
    return false
  }
  const totals = getHandTotals(hand)
  return totals.soft === 21 || totals.hard === 21
}

const resetDealer = (state: GameState): void => {
  state.dealer.hand = createEmptyHand(-1)
  state.dealer.upcard = undefined
  state.dealer.holeCard = undefined
  state.dealer.hasPeeked = false
}

const setActiveToNextHand = (state: GameState): void => {
  for (const seat of state.seats) {
    for (const hand of seat.hands) {
      if (!hand.isResolved && !hand.isSurrendered) {
        state.activeSeatIndex = seat.index
        state.activeHandId = hand.id
        return
      }
    }
  }
  state.activeSeatIndex = null
  state.activeHandId = null
}

const ensureShoeReady = (state: GameState): void => {
  if (state.shoe.needsShuffle && state.phase === 'betting') {
    reshuffleShoe(state.shoe)
    logMessage(state, 'Shoe reshuffled before dealing.')
  }
}

const payoutBlackjackMultiplier = (payout: RuleConfig['blackjackPayout']): number =>
  payout === '3:2' ? 1.5 : 1.2

const shouldDealerPeek = (state: GameState): boolean => {
  if (!state.rules.dealerPeekOnTenOrAce) {
    return false
  }
  const upcard = state.dealer.upcard
  if (!upcard) {
    return false
  }
  if (upcard.rank === 'A') {
    return true
  }
  return ['10', 'J', 'Q', 'K'].includes(upcard.rank)
}

const handleDealerPeek = (state: GameState): void => {
  if (state.dealer.hasPeeked) {
    return
  }
  if (!shouldDealerPeek(state)) {
    return
  }
  state.dealer.hasPeeked = true
  state.dealer.hand.isBlackjack = isNaturalBlackjack(state.dealer.hand)
  if (state.dealer.hand.isBlackjack) {
    state.dealer.hand.isResolved = true
  }
}

const settleInsurance = (state: GameState, dealerHasBlackjack: boolean): void => {
  state.seats.forEach((seat) => {
    seat.hands.forEach((hand) => {
      if (hand.insuranceBet && hand.insuranceBet > 0) {
        if (dealerHasBlackjack) {
          const payout = hand.insuranceBet * 3
          state.bankroll += payout
          logMessage(
            state,
            `Seat ${seat.index + 1}: insurance paid €${(payout - hand.insuranceBet).toFixed(2)}`,
          )
        } else {
          logMessage(
            state,
            `Seat ${seat.index + 1}: insurance lost €${hand.insuranceBet.toFixed(2)}`,
          )
        }
        hand.insuranceBet = 0
      }
    })
  })
}

const markRoundCompleteForDealerBlackjack = (state: GameState): void => {
  if (!state.dealer.hand.isBlackjack) {
    return
  }
  state.seats.forEach((seat) => {
    seat.hands.forEach((hand) => {
      hand.isResolved = true
    })
  })
  state.phase = 'settlement'
  state.activeSeatIndex = null
  state.activeHandId = null
}

const dealCardToHand = (state: GameState, hand: Hand): void => {
  const card = drawCard(state.shoe)
  hand.cards.push(card)
}

const concludeHandIfBust = (hand: Hand): void => {
  if (isBust(hand)) {
    hand.isResolved = true
    hand.outcome = 'bust'
  }
}

const autoAdvanceIfNeeded = (state: GameState): void => {
  setActiveToNextHand(state)
  if (state.activeHandId === null) {
    state.phase = 'dealerPlay'
  }
}

const clearHands = (state: GameState): void => {
  state.seats.forEach((seat) => {
    seat.hands = []
  })
  resetDealer(state)
}

export const initGame = (rules?: Partial<RuleConfig>): GameState => {
  const merged = mergeRules(rules)
  return {
    phase: 'betting',
    seats: Array.from({ length: SEAT_COUNT }, (_, index) => ({
      index,
      occupied: false,
      hands: [],
      baseBet: 0,
    })),
    dealer: {
      hand: createEmptyHand(-1),
      upcard: undefined,
      holeCard: undefined,
      hasPeeked: false,
    },
    shoe: createShoe(merged.numberOfDecks, merged.penetration),
    activeSeatIndex: null,
    activeHandId: null,
    bankroll: STARTING_BANKROLL,
    messageLog: [],
    roundCount: 0,
    rules: merged,
  }
}

export const sit = (state: GameState, seatIndex: number): GameState =>
  produce(state, (draft) => {
    if (draft.phase !== 'betting') {
      return
    }
    const seat = findSeat(draft, seatIndex)
    if (!seat) {
      return
    }
    seat.occupied = true
  })

export const leave = (state: GameState, seatIndex: number): GameState =>
  produce(state, (draft) => {
    if (draft.phase !== 'betting') {
      return
    }
    const seat = findSeat(draft, seatIndex)
    if (!seat) {
      return
    }
    seat.occupied = false
    seat.hands = []
    seat.baseBet = 0
  })

export const setBet = (state: GameState, seatIndex: number, amount: number): GameState =>
  produce(state, (draft) => {
    if (draft.phase !== 'betting') {
      return
    }
    const seat = findSeat(draft, seatIndex)
    if (!seat || !seat.occupied) {
      return
    }
    const clamped = Math.min(Math.max(amount, draft.rules.minBet), draft.rules.maxBet)
    seat.baseBet = Math.floor(clamped)
  })

const collectTotalBet = (draft: GameState): number => {
  let total = 0
  draft.seats.forEach((seat) => {
    if (seat.occupied && seat.baseBet >= draft.rules.minBet) {
      total += seat.baseBet
    }
  })
  return total
}

const seedHandsForRound = (draft: GameState): void => {
  draft.seats.forEach((seat) => {
    if (seat.occupied && seat.baseBet >= draft.rules.minBet) {
      seat.hands = [createEmptyHand(seat.index, seat.baseBet)]
    } else {
      seat.hands = []
    }
  })
}

const dealInitialCards = (draft: GameState): void => {
  // First card to each seat
  draft.seats.forEach((seat) => {
    if (seat.hands.length > 0) {
      dealCardToHand(draft, seat.hands[0])
    }
  })
  // Dealer upcard
  dealCardToHand(draft, draft.dealer.hand)
  draft.dealer.upcard = draft.dealer.hand.cards[0]

  // Second card to players
  draft.seats.forEach((seat) => {
    if (seat.hands.length > 0) {
      const hand = seat.hands[0]
      dealCardToHand(draft, hand)
      hand.isBlackjack = isNaturalBlackjack(hand)
      if (hand.isBlackjack) {
        hand.isResolved = true
      }
    }
  })

  // Dealer hole card
  dealCardToHand(draft, draft.dealer.hand)
  draft.dealer.holeCard = draft.dealer.hand.cards[1]
  draft.dealer.hand.isBlackjack = isNaturalBlackjack(draft.dealer.hand)
  if (draft.dealer.hand.isBlackjack) {
    draft.dealer.hand.isResolved = true
  }
}

const handlePostDealPhase = (draft: GameState): void => {
  if (draft.dealer.upcard?.rank === 'A' && draft.rules.allowInsurance) {
    draft.phase = 'insurance'
    return
  }
  handleDealerPeek(draft)
  if (draft.dealer.hand.isBlackjack) {
    markRoundCompleteForDealerBlackjack(draft)
    return
  }
  draft.phase = 'playerActions'
  autoAdvanceIfNeeded(draft)
}

export const deal = (state: GameState): GameState =>
  produce(state, (draft) => {
    if (draft.phase !== 'betting') {
      return
    }
    ensureShoeReady(draft)
    const totalBet = collectTotalBet(draft)
    if (totalBet <= 0) {
      return
    }
    if (totalBet > draft.bankroll) {
      return
    }
    draft.bankroll -= totalBet
    draft.roundCount += 1
    clearHands(draft)
    seedHandsForRound(draft)
    dealInitialCards(draft)
    logMessage(
      draft,
      `Round ${draft.roundCount} dealt. Penetration ${(currentPenetration(draft.shoe) * 100).toFixed(1)}%.`,
    )
    handlePostDealPhase(draft)
  })

export const offerInsurance = (state: GameState): GameState =>
  produce(state, (draft) => {
    if (draft.phase === 'playerActions' && draft.dealer.upcard?.rank === 'A' && draft.rules.allowInsurance) {
      draft.phase = 'insurance'
    }
  })

export const takeInsurance = (
  state: GameState,
  seatIndex: number,
  handId: string,
  amount: number,
): GameState =>
  produce(state, (draft) => {
    if (draft.phase !== 'insurance') {
      return
    }
    const seat = findSeat(draft, seatIndex)
    const hand = seat?.hands.find((h) => h.id === handId)
    if (!seat || !hand) {
      return
    }
    const maxInsurance = hand.bet / 2
    if (amount <= 0 || amount > maxInsurance) {
      return
    }
    if (amount > draft.bankroll) {
      return
    }
    hand.insuranceBet = amount
    draft.bankroll -= amount
    logMessage(draft, `Seat ${seat.index + 1}: insurance bet €${amount.toFixed(2)}`)
  })

export const skipInsurance = (state: GameState): GameState =>
  produce(state, (draft) => {
    if (draft.phase !== 'insurance') {
      return
    }
    handleDealerPeek(draft)
    if (draft.dealer.hand.isBlackjack) {
      markRoundCompleteForDealerBlackjack(draft)
      return
    }
    draft.phase = 'playerActions'
    autoAdvanceIfNeeded(draft)
  })

const requireActiveHand = (draft: GameState): Hand | null => {
  const hand = getActiveHand(draft)
  if (!hand) {
    return null
  }
  return hand
}

export const playerHit = (state: GameState): GameState =>
  produce(state, (draft) => {
    const hand = requireActiveHand(draft)
    if (!hand || !canHit(hand, draft)) {
      return
    }
    dealCardToHand(draft, hand)
    concludeHandIfBust(hand)
    if (hand.isResolved) {
      autoAdvanceIfNeeded(draft)
    }
  })

export const playerStand = (state: GameState): GameState =>
  produce(state, (draft) => {
    const hand = requireActiveHand(draft)
    if (!hand || !canStand(hand, draft)) {
      return
    }
    hand.isResolved = true
    autoAdvanceIfNeeded(draft)
  })

export const playerDouble = (state: GameState): GameState =>
  produce(state, (draft) => {
    const hand = requireActiveHand(draft)
    if (!hand || !canDouble(hand, draft)) {
      return
    }
    if (hand.bet > draft.bankroll) {
      return
    }
    draft.bankroll -= hand.bet
    hand.bet *= 2
    hand.isDoubled = true
    dealCardToHand(draft, hand)
    concludeHandIfBust(hand)
    hand.isResolved = true
    autoAdvanceIfNeeded(draft)
  })

export const playerSplit = (state: GameState): GameState =>
  produce(state, (draft) => {
    const hand = requireActiveHand(draft)
    if (!hand || !canSplit(hand, draft)) {
      return
    }
    const seat = getActiveSeat(draft)
    if (!seat) {
      return
    }
    if (hand.bet > draft.bankroll) {
      return
    }
    const [firstCard, secondCard] = hand.cards
    if (!firstCard || !secondCard) {
      return
    }
    draft.bankroll -= hand.bet
    const newHandA = createEmptyHand(seat.index, hand.bet)
    const newHandB = createEmptyHand(seat.index, hand.bet)
    newHandA.cards.push(firstCard)
    newHandB.cards.push(secondCard)
    newHandA.isFromSplit = true
    newHandB.isFromSplit = true
    if (firstCard.rank === 'A') {
      newHandA.isSplitAce = true
      newHandB.isSplitAce = true
    }
    seat.hands = seat.hands.flatMap((existing) => (existing.id === hand.id ? [newHandA, newHandB] : [existing]))
    draft.activeHandId = newHandA.id
    dealCardToHand(draft, newHandA)
    newHandA.isBlackjack = false
    if (newHandA.isSplitAce && !draft.rules.hitOnSplitAces) {
      newHandA.isResolved = true
    }
    dealCardToHand(draft, newHandB)
    newHandB.isBlackjack = false
    if (newHandB.isSplitAce && !draft.rules.hitOnSplitAces) {
      newHandB.isResolved = true
    }
    concludeHandIfBust(newHandA)
    concludeHandIfBust(newHandB)
    autoAdvanceIfNeeded(draft)
  })

export const playerSurrender = (state: GameState): GameState =>
  produce(state, (draft) => {
    const hand = requireActiveHand(draft)
    if (!hand || !canSurrender(hand, draft)) {
      return
    }
    hand.isSurrendered = true
    hand.isResolved = true
    hand.outcome = 'surrender'
    draft.bankroll += hand.bet / 2
    logMessage(draft, `Seat ${hand.parentSeatIndex + 1}: surrendered for €${(hand.bet / 2).toFixed(2)}.`)
    autoAdvanceIfNeeded(draft)
  })

export const advanceToNextHandOrSeat = (state: GameState): GameState =>
  produce(state, (draft) => {
    autoAdvanceIfNeeded(draft)
  })

export const playDealer = (state: GameState): GameState =>
  produce(state, (draft) => {
    if (draft.phase !== 'dealerPlay') {
      return
    }
    const dealerHand = draft.dealer.hand
    dealerHand.isResolved = true
    while (true) {
      const totals = getHandTotals(dealerHand)
      const best = totals.soft && totals.soft <= 21 ? totals.soft : totals.hard
      const hasSoftTotal = totals.soft !== undefined && totals.soft <= 21
      const shouldHit = hasSoftTotal
        ? !draft.rules.dealerStandsOnSoft17 || best < 17
        : best < 17
      if (!shouldHit) {
        break
      }
      dealCardToHand(draft, dealerHand)
    }
    draft.phase = 'settlement'
  })

const settleHand = (draft: GameState, hand: Hand, dealerHand: Hand): void => {
  if (hand.outcome === 'surrender') {
    return
  }
  if (hand.isBlackjack && !dealerHand.isBlackjack) {
    const payout = hand.bet * (1 + payoutBlackjackMultiplier(draft.rules.blackjackPayout))
    draft.bankroll += payout
    hand.outcome = 'blackjack'
    return
  }
  if (hand.outcome === 'bust') {
    return
  }
  const playerBust = isBust(hand)
  if (playerBust) {
    hand.outcome = 'bust'
    return
  }
  if (dealerHand.isBlackjack && !hand.isBlackjack) {
    hand.outcome = 'lose'
    return
  }
  const dealerBust = isBust(dealerHand)
  if (dealerBust) {
    draft.bankroll += hand.bet * 2
    hand.outcome = 'win'
    return
  }
  const playerTotal = bestTotal(hand)
  const dealerTotal = bestTotal(dealerHand)
  if (hand.isBlackjack && dealerHand.isBlackjack) {
    draft.bankroll += hand.bet
    hand.outcome = 'push'
    return
  }
  if (playerTotal > dealerTotal) {
    draft.bankroll += hand.bet * 2
    hand.outcome = 'win'
  } else if (playerTotal === dealerTotal) {
    draft.bankroll += hand.bet
    hand.outcome = 'push'
  } else {
    hand.outcome = 'lose'
  }
}

export const settleAllHands = (state: GameState): GameState =>
  produce(state, (draft) => {
    if (draft.phase !== 'settlement') {
      return
    }
    const dealerHand = draft.dealer.hand
    settleInsurance(draft, dealerHand.isBlackjack)
    draft.seats.forEach((seat) => {
      seat.hands.forEach((hand) => {
        settleHand(draft, hand, dealerHand)
        hand.isResolved = true
      })
    })
    draft.phase = 'settlement'
  })

export const prepareNextRound = (state: GameState): GameState =>
  produce(state, (draft) => {
    if (draft.phase !== 'settlement') {
      return
    }
    draft.seats.forEach((seat) => {
      seat.hands.forEach((hand) => {
        discardCards(draft.shoe, hand.cards)
      })
      seat.hands = []
    })
    discardCards(draft.shoe, draft.dealer.hand.cards)
    resetDealer(draft)
    draft.phase = 'betting'
    draft.activeSeatIndex = null
    draft.activeHandId = null
    if (draft.shoe.needsShuffle) {
      logMessage(draft, 'Cut card reached. Shoe will be shuffled on next deal.')
    }
  })
