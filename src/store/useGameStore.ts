import { create } from "zustand";
import {
  convertAmountToChips,
  deal,
  declineInsurance,
  finishInsurance,
  initGame,
  playDealerStep,
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
import { isSingleSeatMode, PRIMARY_SEAT_INDEX } from "../ui/config";
import { ANIM, DEAL_STAGGER, REDUCED } from "../utils/animConstants";

const BANKROLL_KEY = "blackjack_bankroll";
const SEATS_KEY = "blackjack_seats";
const COACH_MODE_KEY = "blackjack_coach_mode";

export type CoachMode = "off" | "feedback" | "live";

type SeatPersist = {
  occupied: boolean;
  baseBet: number;
  chips: number[];
};

const DEALER_BUFFER_MS = 120;
const DEALER_STEP_DELAY_MS = (ANIM.deal.duration + DEAL_STAGGER) * 1000 + DEALER_BUFFER_MS;
const DEALER_FLIP_DELAY_MS = ANIM.flip.duration * 1000 + DEALER_BUFFER_MS;

const animationDelay = (ms: number): number => (REDUCED ? 0 : ms);

let dealerStepTimer: ReturnType<typeof setTimeout> | null = null;
let dealerSettleTimer: ReturnType<typeof setTimeout> | null = null;
let dealerSequenceActive = false;

const stopDealerTimers = (): void => {
  if (dealerStepTimer !== null) {
    clearTimeout(dealerStepTimer);
    dealerStepTimer = null;
  }
  if (dealerSettleTimer !== null) {
    clearTimeout(dealerSettleTimer);
    dealerSettleTimer = null;
  }
  dealerSequenceActive = false;
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
  if (isSingleSeatMode) {
    base.seats = base.seats.map((seat) => {
      if (seat.index === PRIMARY_SEAT_INDEX) {
        return seat;
      }
      return { ...seat, occupied: false, baseBet: 0, chips: [], hands: [] };
    });
  }
  return base;
};

const hydrateCoachMode = (): CoachMode => {
  if (typeof localStorage === "undefined") {
    return "off";
  }
  const stored = localStorage.getItem(COACH_MODE_KEY);
  if (stored === "feedback" || stored === "live" || stored === "off") {
    return stored;
  }
  return "off";
};

type GameStore = {
  game: GameState;
  error: string | null;
  coachMode: CoachMode;
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
  setCoachMode: (mode: CoachMode) => void;
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

export const useGameStore = create<GameStore>((set, get) => {
  const stepDelay = animationDelay(DEALER_STEP_DELAY_MS);

  const runDealerSequence = (initialDelay = animationDelay(DEALER_FLIP_DELAY_MS)): void => {
    if (dealerSequenceActive) {
      return;
    }
    const current = get().game;
    if (current.phase !== "dealerPlay") {
      return;
    }
    dealerSequenceActive = true;

    const scheduleNextStep = (delay: number): void => {
      if (dealerStepTimer !== null) {
        clearTimeout(dealerStepTimer);
      }
      dealerStepTimer = setTimeout(() => {
        dealerStepTimer = null;
        let stepResult: ReturnType<typeof playDealerStep> = "idle";
        set((store) => {
          const nextGame = mutateGame(store.game, (draft) => {
            stepResult = playDealerStep(draft);
          });
          persistState(nextGame);
          return { game: nextGame, error: null };
        });
        if (stepResult === "hit") {
          scheduleNextStep(stepDelay);
          return;
        }
        if (stepResult === "stand") {
          if (dealerSettleTimer !== null) {
            clearTimeout(dealerSettleTimer);
          }
          dealerSettleTimer = setTimeout(() => {
            dealerSettleTimer = null;
            set((store) => {
              const nextGame = mutateGame(store.game, (draft) => {
                settleAllHands(draft);
              });
              persistState(nextGame);
              return { game: nextGame, error: null };
            });
            dealerSequenceActive = false;
          }, stepDelay);
          return;
        }
        dealerSequenceActive = false;
      }, delay);
    };

    scheduleNextStep(initialDelay);
  };

  return {
    game: hydrateGame(),
    error: null,
    coachMode: hydrateCoachMode(),
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
      stopDealerTimers();
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
        let shouldStartDealer = false;
        set((store) => {
          const nextGame = mutateGame(store.game, (draft) => {
            playerHit(draft);
            shouldStartDealer = draft.phase === "dealerPlay";
          });
          persistState(nextGame);
          return { game: nextGame, error: null };
        });
        if (shouldStartDealer) {
          runDealerSequence();
        }
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    playerStand: () => {
      try {
        let shouldStartDealer = false;
        set((store) => {
          const nextGame = mutateGame(store.game, (draft) => {
            playerStand(draft);
            shouldStartDealer = draft.phase === "dealerPlay";
          });
          persistState(nextGame);
          return { game: nextGame, error: null };
        });
        if (shouldStartDealer) {
          runDealerSequence();
        }
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    playerDouble: () => {
      try {
        let shouldStartDealer = false;
        set((store) => {
          const nextGame = mutateGame(store.game, (draft) => {
            playerDouble(draft);
            shouldStartDealer = draft.phase === "dealerPlay";
          });
          persistState(nextGame);
          return { game: nextGame, error: null };
        });
        if (shouldStartDealer) {
          runDealerSequence();
        }
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
        let shouldStartDealer = false;
        set((store) => {
          const nextGame = mutateGame(store.game, (draft) => {
            playerSurrender(draft);
            shouldStartDealer = draft.phase === "dealerPlay";
          });
          persistState(nextGame);
          return { game: nextGame, error: null };
        });
        if (shouldStartDealer) {
          runDealerSequence();
        }
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
      let shouldStartDealer = false;
      set((store) => {
        const nextGame = mutateGame(store.game, (draft) => {
          finishInsurance(draft);
          if (draft.phase === "dealerPlay") {
            shouldStartDealer = true;
          } else if (draft.phase === "settlement") {
            settleAllHands(draft);
          }
        });
        persistState(nextGame);
        return { game: nextGame, error: null };
      });
      if (shouldStartDealer) {
        runDealerSequence();
      }
    },
    playDealer: () => {
      runDealerSequence();
    },
    settle: () => {
      stopDealerTimers();
      set((store) => {
        const nextGame = mutateGame(store.game, (draft) => settleAllHands(draft));
        persistState(nextGame);
        return { game: nextGame, error: null };
      });
    },
    nextRound: () => {
      stopDealerTimers();
      set((store) => {
        const nextGame = mutateGame(store.game, (draft) => prepareNextRound(draft));
        persistState(nextGame);
        return { game: nextGame, error: null };
      });
    },
    setCoachMode: (mode) => {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(COACH_MODE_KEY, mode);
      }
      set({ coachMode: mode });
    }
  };
});
