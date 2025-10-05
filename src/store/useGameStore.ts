import { create } from "zustand";
import {
  deal,
  initGame,
  playDealer,
  playerDouble,
  playerHit,
  playerSplit,
  playerStand,
  playerSurrender,
  prepareNextRound,
  setBet as engineSetBet,
  sit as engineSit,
  leave as engineLeave,
  skipInsurance as engineSkipInsurance,
  takeInsurance as engineTakeInsurance,
} from "../engine/engine";
import { type GameState } from "../engine/types";

const STORAGE_KEY = "blackjack-state-v1";

interface PersistedData {
  bankroll: number;
  seats: Array<{ occupied: boolean; baseBet: number }>;
}

function loadPersistedState(): PersistedData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedData;
  } catch (error) {
    console.error("Failed to load persisted state", error);
    return null;
  }
}

function persistState(game: GameState): void {
  if (typeof window === "undefined") return;
  const data: PersistedData = {
    bankroll: game.bankroll,
    seats: game.seats.map((seat) => ({
      occupied: seat.occupied,
      baseBet: seat.baseBet,
    })),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function applyPersistence(game: GameState, persisted: PersistedData | null): void {
  if (!persisted) return;
  game.bankroll = persisted.bankroll ?? game.bankroll;
  game.seats.forEach((seat, index) => {
    const persistedSeat = persisted.seats[index];
    if (!persistedSeat) return;
    seat.occupied = persistedSeat.occupied;
    const clamped = Math.min(game.rules.maxBet, Math.max(game.rules.minBet, persistedSeat.baseBet ?? game.rules.minBet));
    seat.baseBet = clamped;
  });
}

function finalize(game: GameState): void {
  if (game.phase === "dealerPlay") {
    playDealer(game);
  }
  persistState(game);
}

interface GameStore {
  game: GameState;
  sit: (index: number) => void;
  leave: (index: number) => void;
  setBet: (index: number, amount: number) => void;
  deal: () => void;
  takeInsurance: (seatIndex: number, handId: string, amount: number) => void;
  skipInsurance: () => void;
  hit: () => void;
  stand: () => void;
  double: () => void;
  split: () => void;
  surrender: () => void;
  nextRound: () => void;
}

const initialGame = initGame();
applyPersistence(initialGame, typeof window !== "undefined" ? loadPersistedState() : null);

export const useGameStore = create<GameStore>((set) => ({
  game: initialGame,
  sit: (index) => {
    set((state) => {
      engineSit(state.game, index);
      persistState(state.game);
      return { game: { ...state.game } };
    });
  },
  leave: (index) => {
    set((state) => {
      engineLeave(state.game, index);
      persistState(state.game);
      return { game: { ...state.game } };
    });
  },
  setBet: (index, amount) => {
    set((state) => {
      engineSetBet(state.game, index, amount);
      persistState(state.game);
      return { game: { ...state.game } };
    });
  },
  deal: () => {
    set((state) => {
      deal(state.game);
      finalize(state.game);
      return { game: { ...state.game } };
    });
  },
  takeInsurance: (seatIndex, handId, amount) => {
    set((state) => {
      engineTakeInsurance(state.game, seatIndex, handId, amount);
      persistState(state.game);
      return { game: { ...state.game } };
    });
  },
  skipInsurance: () => {
    set((state) => {
      engineSkipInsurance(state.game);
      finalize(state.game);
      return { game: { ...state.game } };
    });
  },
  hit: () => {
    set((state) => {
      playerHit(state.game);
      finalize(state.game);
      return { game: { ...state.game } };
    });
  },
  stand: () => {
    set((state) => {
      playerStand(state.game);
      finalize(state.game);
      return { game: { ...state.game } };
    });
  },
  double: () => {
    set((state) => {
      playerDouble(state.game);
      finalize(state.game);
      return { game: { ...state.game } };
    });
  },
  split: () => {
    set((state) => {
      playerSplit(state.game);
      finalize(state.game);
      return { game: { ...state.game } };
    });
  },
  surrender: () => {
    set((state) => {
      playerSurrender(state.game);
      finalize(state.game);
      return { game: { ...state.game } };
    });
  },
  nextRound: () => {
    set((state) => {
      prepareNextRound(state.game);
      persistState(state.game);
      return { game: { ...state.game } };
    });
  },
}));
