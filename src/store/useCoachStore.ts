import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CoachMode = "off" | "feedback" | "live";

interface CoachStore {
  coachMode: CoachMode;
  setCoachMode: (mode: CoachMode) => void;
  cycleMode: () => void;
}

const MODES: CoachMode[] = ["off", "feedback", "live"];

const storage = createJSONStorage(() => {
  if (typeof window === "undefined" || !window.localStorage) {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined
    };
  }
  return window.localStorage;
});

export const useCoachStore = create<CoachStore>()(
  persist(
    (set, get) => ({
      coachMode: "off",
      setCoachMode: (mode) => set({ coachMode: mode }),
      cycleMode: () => {
        const current = get().coachMode;
        const index = MODES.indexOf(current);
        const next = MODES[(index + 1) % MODES.length];
        set({ coachMode: next });
      }
    }),
    {
      name: "blackjack_coach_mode",
      storage
    }
  )
);
