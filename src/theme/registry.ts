import React from "react";
import type { GameState } from "../engine/types";

type ThemeActionMap = {
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
  nextRound: () => void;
};

export interface ThemeLayoutProps {
  game: GameState;
  actions: ThemeActionMap;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  Layout: React.ComponentType<ThemeLayoutProps>;
}

const registry = new Map<string, ThemeDefinition>();

const listeners = new Set<() => void>();

const notify = (): void => {
  listeners.forEach((listener) => listener());
};

export const themes = {
  register(definition: ThemeDefinition): void {
    registry.set(definition.id, definition);
    notify();
  },
  get(id: string): ThemeDefinition | undefined {
    return registry.get(id);
  },
  all(): ThemeDefinition[] {
    return Array.from(registry.values());
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};

export const DEFAULT_THEME_ID = "solo";
export const THEME_STORAGE_KEY = "ui.theme";
