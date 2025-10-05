import { create } from "zustand";
import {
  advanceToNextHandOrSeat as engineAdvance,
  deal as engineDeal,
  initGame,
  leave as engineLeave,
  offerInsurance as engineOfferInsurance,
  playDealer as enginePlayDealer,
  playerDouble as enginePlayerDouble,
  playerHit as enginePlayerHit,
  playerSplit as enginePlayerSplit,
  playerStand as enginePlayerStand,
  playerSurrender as enginePlayerSurrender,
  settleAllHands as engineSettle,
  setBet as engineSetBet,
  sit as engineSit,
  skipInsurance as engineSkipInsurance,
  takeInsurance as engineTakeInsurance,
  type GameState
} from "../engine/engine";

interface PersistedState {
  bankroll: number;
  seats: { index: number; occupied: boolean; baseBet: number }[];
}

interface GameStore {
  game: GameState;
  hydrate: () => void;
  sit: (seatIndex: number) => void;
  leave: (seatIndex: number) => void;
  setBet: (seatIndex: number, amount: number) => void;
  deal: () => void;
  takeInsurance: (seatIndex: number, handId: string, amount: number) => void;
  skipInsurance: () => void;
  continueAfterInsurance: () => void;
  hit: () => void;
  stand: () => void;
  double: () => void;
  split: () => void;
  surrender: () => void;
  advance: () => void;
  playDealer: () => void;
  settle: () => void;
}

const STORAGE_KEY = "blackjack-state";

function persistState(state: GameState): void {
  if (typeof window === "undefined") return;
  const data: PersistedState = {
    bankroll: state.bankroll,
    seats: state.seats.map((seat) => ({
      index: seat.index,
      occupied: seat.occupied,
      baseBet: seat.baseBet
    }))
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function readPersistedState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedState;
  } catch (error) {
    console.error("Failed to parse persisted state", error);
    return null;
  }
}

export const useGameStore = create<GameStore>((set) => {
  const initialGame = initGame();

  const mutate = (action: (draft: GameState) => void, label: string) => {
    set((store) => {
      const draft: GameState = structuredClone(store.game);
      action(draft);
      persistState(draft);
      return { game: draft };
    }, false, label);
  };

  return {
    game: initialGame,
    hydrate: () => {
      const persisted = readPersistedState();
      set((store) => {
        const draft: GameState = structuredClone(store.game);
        if (persisted) {
          draft.bankroll = persisted.bankroll ?? draft.bankroll;
          draft.seats.forEach((seat) => {
            const saved = persisted.seats.find((item) => item.index === seat.index);
            if (saved) {
              seat.occupied = saved.occupied;
              seat.baseBet = saved.baseBet;
            }
          });
        }
        persistState(draft);
        return { game: draft };
      }, false, "hydrate");
    },
    sit: (seatIndex) => mutate((draft) => engineSit(draft, seatIndex), "sit"),
    leave: (seatIndex) => mutate((draft) => engineLeave(draft, seatIndex), "leave"),
    setBet: (seatIndex, amount) => mutate((draft) => engineSetBet(draft, seatIndex, amount), "setBet"),
    deal: () => mutate((draft) => engineDeal(draft), "deal"),
    takeInsurance: (seatIndex, handId, amount) =>
      mutate((draft) => engineTakeInsurance(draft, seatIndex, handId, amount), "takeInsurance"),
    skipInsurance: () => mutate((draft) => engineSkipInsurance(draft), "skipInsurance"),
    continueAfterInsurance: () => mutate((draft) => engineOfferInsurance(draft), "offerInsurance"),
    hit: () => mutate((draft) => enginePlayerHit(draft), "hit"),
    stand: () => mutate((draft) => enginePlayerStand(draft), "stand"),
    double: () => mutate((draft) => enginePlayerDouble(draft), "double"),
    split: () => mutate((draft) => enginePlayerSplit(draft), "split"),
    surrender: () => mutate((draft) => enginePlayerSurrender(draft), "surrender"),
    advance: () => mutate((draft) => engineAdvance(draft), "advance"),
    playDealer: () => mutate((draft) => enginePlayDealer(draft), "dealer"),
    settle: () => mutate((draft) => engineSettle(draft), "settle")
  };
});
