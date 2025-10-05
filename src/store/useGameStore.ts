import { create } from 'zustand'

import {
  deal as engineDeal,
  initGame,
  offerInsurance as engineOfferInsurance,
  playerDouble,
  playerHit,
  playerSplit,
  playerStand,
  playerSurrender,
  playDealer,
  prepareNextRound,
  settleAllHands,
  setBet as engineSetBet,
  sit as engineSit,
  skipInsurance as engineSkipInsurance,
  leave as engineLeave,
  takeInsurance as engineTakeInsurance,
} from '../engine/engine'
import { GameState } from '../engine/types'

const STORAGE_KEY = 'blackjack:state'

interface PersistedState {
  bankroll: number
  seats: { index: number; occupied: boolean; baseBet: number }[]
}

const loadPersistedState = (): PersistedState | null => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    return JSON.parse(raw) as PersistedState
  } catch (error) {
    console.warn('Failed to load persisted state', error)
    return null
  }
}

const persistState = (state: GameState): void => {
  if (typeof window === 'undefined') {
    return
  }
  const payload: PersistedState = {
    bankroll: state.bankroll,
    seats: state.seats.map((seat) => ({
      index: seat.index,
      occupied: seat.occupied,
      baseBet: seat.baseBet,
    })),
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

const mergePersisted = (game: GameState): GameState => {
  const persisted = loadPersistedState()
  if (!persisted) {
    return game
  }
  const next = { ...game }
  if (persisted.bankroll > 0) {
    next.bankroll = persisted.bankroll
  }
  persisted.seats.forEach((seatInfo) => {
    const seat = next.seats.find((s) => s.index === seatInfo.index)
    if (seat) {
      seat.occupied = seatInfo.occupied
      seat.baseBet = seatInfo.baseBet
    }
  })
  return next
}

const hasPendingSettlement = (game: GameState): boolean =>
  game.seats.some((seat) => seat.hands.some((hand) => hand.outcome === 'pending'))

const resolveDealerIfNeeded = (game: GameState): GameState => {
  let current = game
  if (current.phase === 'dealerPlay') {
    current = playDealer(current)
  }
  if (current.phase === 'settlement' && hasPendingSettlement(current)) {
    current = settleAllHands(current)
  }
  return current
}

type GameStore = {
  game: GameState
  sit: (seatIndex: number) => void
  leave: (seatIndex: number) => void
  setBet: (seatIndex: number, amount: number) => void
  deal: () => void
  offerInsurance: () => void
  takeInsurance: (seatIndex: number, handId: string, amount: number) => void
  skipInsurance: () => void
  hit: () => void
  stand: () => void
  double: () => void
  split: () => void
  surrender: () => void
  nextRound: () => void
  reset: () => void
}

const applyUpdate = (
  set: (updater: (store: GameStore) => GameStore) => void,
  updater: (game: GameState) => GameState,
) => {
  set((store) => {
    const updated = resolveDealerIfNeeded(updater(store.game))
    persistState(updated)
    return { ...store, game: updated }
  })
}

const initialGame = mergePersisted(initGame())

export const useGameStore = create<GameStore>((set) => ({
  game: initialGame,
  sit: (seatIndex) => applyUpdate(set, (game) => engineSit(game, seatIndex)),
  leave: (seatIndex) => applyUpdate(set, (game) => engineLeave(game, seatIndex)),
  setBet: (seatIndex, amount) => applyUpdate(set, (game) => engineSetBet(game, seatIndex, amount)),
  deal: () => applyUpdate(set, (game) => engineDeal(game)),
  offerInsurance: () => applyUpdate(set, (game) => engineOfferInsurance(game)),
  takeInsurance: (seatIndex, handId, amount) =>
    applyUpdate(set, (game) => engineTakeInsurance(game, seatIndex, handId, amount)),
  skipInsurance: () => applyUpdate(set, (game) => engineSkipInsurance(game)),
  hit: () => applyUpdate(set, (game) => playerHit(game)),
  stand: () => applyUpdate(set, (game) => playerStand(game)),
  double: () => applyUpdate(set, (game) => playerDouble(game)),
  split: () => applyUpdate(set, (game) => playerSplit(game)),
  surrender: () => applyUpdate(set, (game) => playerSurrender(game)),
  nextRound: () => applyUpdate(set, (game) => prepareNextRound(game)),
  reset: () =>
    set(() => {
      const resetGame = initGame()
      persistState(resetGame)
      return { game: resetGame }
    }),
}))
