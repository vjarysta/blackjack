import { create } from "zustand";
import {
  deal,
  declineInsurance,
  finishInsurance,
  initGame,
  playDealer,
  playerDouble,
  playerHit,
  playerSplit,
  playerStand,
  playerSurrender,
  prepareNextRound,
  settleAllHands,
  sit,
  leave,
  setBet,
  takeInsurance
} from "../engine/engine";
import type { GameState } from "../engine/types";

const BANKROLL_KEY = "blackjack_bankroll";
const SEATS_KEY = "blackjack_seats";

type SeatPersist = {
  occupied: boolean;
  baseBet: number;
};

const persistState = (state: GameState): void => {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(BANKROLL_KEY, state.bankroll.toString());
  const seats: SeatPersist[] = state.seats.map((seat) => ({ occupied: seat.occupied, baseBet: seat.baseBet }));
  localStorage.setItem(SEATS_KEY, JSON.stringify(seats));
};

const hydrateGame = (): GameState => {
  const base = initGame();
  if (typeof localStorage === "undefined") {
    return base;
  }
  const storedBankroll = localStorage.getItem(BANKROLL_KEY);
  if (storedBankroll) {
    const parsed = Number.parseFloat(storedBankroll);
    if (!Number.isNaN(parsed)) {
      base.bankroll = parsed;
    }
  }
  const storedSeats = localStorage.getItem(SEATS_KEY);
  if (storedSeats) {
    try {
      const parsed = JSON.parse(storedSeats) as SeatPersist[];
      base.seats = base.seats.map((seat, index) => {
        const persisted = parsed[index];
        if (!persisted) {
          return seat;
        }
        return {
          ...seat,
          occupied: persisted.occupied,
          baseBet: persisted.baseBet
        };
      });
    } catch {
      // ignore hydration failures
    }
  }
  return base;
};

type GameStore = {
  game: GameState;
  error: string | null;
  clearError: () => void;
  sit: (seatIndex: number) => void;
  leave: (seatIndex: number) => void;
  setBet: (seatIndex: number, amount: number) => void;
  deal: () => void;
  playerHit: () => void;
  playerStand: () => void;
  playerDouble: () => void;
  playerSplit: () => void;
  playerSurrender: () => void;
  takeInsurance: (seatIndex: number, handId: string, amount: number) => void;
  declineInsurance: (seatIndex: number, handId: string) => void;
  finishInsurance: () => void;
  playDealer: () => void;
  settle: () => void;
  nextRound: () => void;
};

const mutateGame = (state: GameState, mutator: (draft: GameState) => void): GameState => {
  const next = structuredClone(state);
  mutator(next);
  return next;
};

export const useGameStore = create<GameStore>((set) => ({
  game: hydrateGame(),
  error: null,
  clearError: () => set({ error: null }),
  sit: (seatIndex) => {
    set((store) => {
      const nextGame = mutateGame(store.game, (draft) => sit(draft, seatIndex));
      persistState(nextGame);
      return { game: nextGame, error: null };
    });
  },
  leave: (seatIndex) => {
    set((store) => {
      const nextGame = mutateGame(store.game, (draft) => leave(draft, seatIndex));
      persistState(nextGame);
      return { game: nextGame, error: null };
    });
  },
  setBet: (seatIndex, amount) => {
    set((store) => {
      const nextGame = mutateGame(store.game, (draft) => setBet(draft, seatIndex, amount));
      persistState(nextGame);
      return { game: nextGame, error: null };
    });
  },
  deal: () => {
    try {
      set((store) => {
        const nextGame = mutateGame(store.game, (draft) => deal(draft));
        persistState(nextGame);
        return { game: nextGame, error: null };
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  playerHit: () => {
    try {
      set((store) => {
        const nextGame = mutateGame(store.game, (draft) => {
          playerHit(draft);
          if (draft.phase === "dealerPlay") {
            playDealer(draft);
            settleAllHands(draft);
          }
        });
        persistState(nextGame);
        return { game: nextGame, error: null };
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  playerStand: () => {
    try {
      set((store) => {
        const nextGame = mutateGame(store.game, (draft) => {
          playerStand(draft);
          if (draft.phase === "dealerPlay") {
            playDealer(draft);
            settleAllHands(draft);
          }
        });
        persistState(nextGame);
        return { game: nextGame, error: null };
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  playerDouble: () => {
    try {
      set((store) => {
        const nextGame = mutateGame(store.game, (draft) => {
          playerDouble(draft);
          if (draft.phase === "dealerPlay") {
            playDealer(draft);
            settleAllHands(draft);
          }
        });
        persistState(nextGame);
        return { game: nextGame, error: null };
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  playerSplit: () => {
    try {
      set((store) => {
        const nextGame = mutateGame(store.game, (draft) => playerSplit(draft));
        persistState(nextGame);
        return { game: nextGame, error: null };
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  playerSurrender: () => {
    try {
      set((store) => {
        const nextGame = mutateGame(store.game, (draft) => {
          playerSurrender(draft);
          if (draft.phase === "dealerPlay") {
            playDealer(draft);
            settleAllHands(draft);
          }
        });
        persistState(nextGame);
        return { game: nextGame, error: null };
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  takeInsurance: (seatIndex, handId, amount) => {
    try {
      set((store) => {
        const nextGame = mutateGame(store.game, (draft) => {
          takeInsurance(draft, seatIndex, handId, amount);
        });
        persistState(nextGame);
        return { game: nextGame, error: null };
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  declineInsurance: (seatIndex, handId) => {
    try {
      set((store) => {
        const nextGame = mutateGame(store.game, (draft) => {
          declineInsurance(draft, seatIndex, handId);
        });
        persistState(nextGame);
        return { game: nextGame, error: null };
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  finishInsurance: () => {
    set((store) => {
      const nextGame = mutateGame(store.game, (draft) => {
        finishInsurance(draft);
        if (draft.phase === "dealerPlay") {
          playDealer(draft);
          settleAllHands(draft);
        } else if (draft.phase === "settlement") {
          settleAllHands(draft);
        }
      });
      persistState(nextGame);
      return { game: nextGame, error: null };
    });
  },
  playDealer: () => {
    set((store) => {
      const nextGame = mutateGame(store.game, (draft) => {
        playDealer(draft);
        settleAllHands(draft);
      });
      persistState(nextGame);
      return { game: nextGame, error: null };
    });
  },
  settle: () => {
    set((store) => {
      const nextGame = mutateGame(store.game, (draft) => settleAllHands(draft));
      persistState(nextGame);
      return { game: nextGame, error: null };
    });
  },
  nextRound: () => {
    set((store) => {
      const nextGame = mutateGame(store.game, (draft) => prepareNextRound(draft));
      persistState(nextGame);
      return { game: nextGame, error: null };
    });
  }
}));
