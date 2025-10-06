import { create } from "zustand";
import {
  convertAmountToChips,
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
import type { GameState, Seat } from "../engine/types";

const BANKROLL_KEY = "blackjack_bankroll";
const SEATS_KEY = "blackjack_seats";

type SeatPersist = {
  occupied: boolean;
  baseBet: number;
  chips: number[];
};

const persistState = (state: GameState): void => {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(BANKROLL_KEY, state.bankroll.toString());
  const seats: SeatPersist[] = state.seats.map((seat) => ({
    occupied: seat.occupied,
    baseBet: seat.baseBet,
    chips: seat.chips ?? []
  }));
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
          baseBet: persisted.baseBet,
          chips:
            Array.isArray(persisted.chips) && persisted.chips.length > 0
              ? persisted.chips
              : convertAmountToChips(persisted.baseBet)
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
  addChip: (seatIndex: number, denom: number) => void;
  removeChipValue: (seatIndex: number, denom: number) => void;
  removeTopChip: (seatIndex: number) => void;
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

const sumChips = (chips: number[]): number => chips.reduce((total, value) => total + value, 0);

const ensureChipArray = (seat: Seat): number[] => {
  if (!Array.isArray(seat.chips)) {
    seat.chips = [];
  }
  return seat.chips;
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
  addChip: (seatIndex, denom) => {
    set((store) => {
      const nextGame = mutateGame(store.game, (draft) => {
        const seat = draft.seats[seatIndex];
        const chips = ensureChipArray(seat);
        chips.push(Math.floor(denom));
        seat.baseBet = sumChips(chips);
      });
      persistState(nextGame);
      return { game: nextGame, error: null };
    });
  },
  removeChipValue: (seatIndex, denom) => {
    set((store) => {
      const nextGame = mutateGame(store.game, (draft) => {
        const seat = draft.seats[seatIndex];
        const chips = ensureChipArray(seat);
        const targetIndex = chips.lastIndexOf(Math.floor(denom));
        if (targetIndex >= 0) {
          chips.splice(targetIndex, 1);
          seat.baseBet = sumChips(chips);
        }
      });
      persistState(nextGame);
      return { game: nextGame, error: null };
    });
  },
  removeTopChip: (seatIndex) => {
    set((store) => {
      const nextGame = mutateGame(store.game, (draft) => {
        const seat = draft.seats[seatIndex];
        const chips = ensureChipArray(seat);
        if (chips.length > 0) {
          chips.pop();
          seat.baseBet = sumChips(chips);
        }
      });
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
