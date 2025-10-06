import type React from "react";
import type { GameState } from "../engine/types";

export interface TableActionHandlers {
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
}

export interface ThemeIdentity {
  id: string;
  label: string;
}

export interface ThemeLayoutProps {
  game: GameState;
  actions: TableActionHandlers;
  themeId: string;
  availableThemes: ThemeIdentity[];
  onThemeChange: (themeId: string) => void;
}

export interface ThemeDefinition extends ThemeIdentity {
  Layout: React.ComponentType<ThemeLayoutProps>;
}
