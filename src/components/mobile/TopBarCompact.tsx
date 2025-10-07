import React from "react";
import type { RuleConfig } from "../../engine/types";
import { RuleBadges } from "../RuleBadges";
import { formatCurrency } from "../../utils/currency";
import type { CoachMode } from "../../store/useGameStore";
import { CoachToggle } from "../CoachToggle";

interface TopBarCompactProps {
  rules: RuleConfig;
  bankroll: number;
  round: number;
  phase: string;
  cardsRemaining: number;
  discardCount: number;
  coachMode: CoachMode;
  onCoachModeChange: (mode: CoachMode) => void;
  modeToggle: React.ReactNode;
}

export const TopBarCompact: React.FC<TopBarCompactProps> = ({
  rules,
  bankroll,
  round,
  phase,
  cardsRemaining,
  discardCount,
  coachMode,
  onCoachModeChange,
  modeToggle
}) => {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 text-emerald-100 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold uppercase tracking-[0.45em] text-emerald-50">Blackjack</h1>
          <RuleBadges rules={rules} />
        </div>
        <div>{modeToggle}</div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] uppercase tracking-[0.28em] text-emerald-200">
        <div className="flex flex-col">
          <span className="text-emerald-400/70">Bankroll</span>
          <span className="text-base font-semibold text-emerald-50">{formatCurrency(bankroll)}</span>
        </div>
        <div className="flex gap-4">
          <div>
            <span className="block text-emerald-400/70">Round</span>
            <span className="text-sm font-semibold text-emerald-50">{round}</span>
          </div>
          <div>
            <span className="block text-emerald-400/70">Phase</span>
            <span className="text-sm font-semibold text-emerald-50">{phase}</span>
          </div>
        </div>
        <div className="flex gap-4">
          <div>
            <span className="block text-emerald-400/70">Cards</span>
            <span className="text-sm font-semibold text-emerald-50">{cardsRemaining}</span>
          </div>
          <div>
            <span className="block text-emerald-400/70">Discard</span>
            <span className="text-sm font-semibold text-emerald-50">{discardCount}</span>
          </div>
        </div>
        <CoachToggle mode={coachMode} onChange={onCoachModeChange} />
      </div>
    </div>
  );
};
