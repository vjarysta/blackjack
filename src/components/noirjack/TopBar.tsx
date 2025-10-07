import React from "react";
import { Info, Settings } from "lucide-react";
import type { RuleConfig } from "../../engine/types";
import { formatCurrency } from "../../utils/currency";
import { RuleBadges } from "../RuleBadges";
import type { CoachMode } from "../../store/useGameStore";
import { cn } from "../../utils/cn";

const COACH_LABELS: Record<CoachMode, string> = {
  off: "Off",
  feedback: "Feedback",
  live: "Live"
};

const COACH_DESCRIPTIONS: Record<CoachMode, string> = {
  off: "Coach disabled",
  feedback: "Show verdicts after each move",
  live: "Highlight best move"
};

const CYCLE: CoachMode[] = ["off", "feedback", "live"];

interface TopBarProps {
  bankroll: number;
  pendingBet: number;
  round: number;
  phase: string;
  cardsRemaining: number;
  discardCount: number;
  penetration: string;
  rules: RuleConfig;
  coachMode: CoachMode;
  onCoachModeChange: (mode: CoachMode) => void;
  modeToggle: React.ReactNode;
  bankrollPulse?: "win" | "lose" | null;
}

export const TopBar: React.FC<TopBarProps> = ({
  bankroll,
  pendingBet,
  round,
  phase,
  cardsRemaining,
  discardCount,
  penetration,
  rules,
  coachMode,
  onCoachModeChange,
  modeToggle,
  bankrollPulse
}) => {
  const handleCoachToggle = () => {
    const currentIndex = CYCLE.indexOf(coachMode);
    const nextIndex = (currentIndex + 1) % CYCLE.length;
    onCoachModeChange(CYCLE[nextIndex]);
  };

  return (
    <header className="nj-glass sticky top-0 z-20 flex flex-col gap-4 rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(4,12,10,0.72)] px-5 py-5 backdrop-blur-lg">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-cinzel text-xl tracking-[0.6em] text-[var(--nj-text)]">NoirJack</span>
            <RuleBadges rules={rules} />
          </div>
          <div className="text-[0.7rem] uppercase tracking-[0.38em] text-[var(--nj-text-muted)]">
            Immersive single-seat blackjack — mint decisions, glass focus.
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-3 text-[var(--nj-text)] lg:items-end">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="nj-btn px-3 py-2 text-[0.62rem] uppercase tracking-[0.32em]"
              onClick={handleCoachToggle}
              aria-label={`Toggle coach mode (currently ${COACH_LABELS[coachMode]})`}
              title={COACH_DESCRIPTIONS[coachMode]}
            >
              Coach · {COACH_LABELS[coachMode]}
            </button>
            <button
              type="button"
              className="nj-btn h-10 w-10 p-0"
              aria-label="Table information"
            >
              <Info size={18} strokeWidth={1.5} />
            </button>
            <button type="button" className="nj-btn h-10 w-10 p-0" aria-label="Table settings">
              <Settings size={18} strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex items-center justify-end gap-2">{modeToggle}</div>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[0.68rem] uppercase tracking-[0.32em] text-[var(--nj-text-muted)] sm:grid-cols-3 lg:grid-cols-6">
        <div className="flex flex-col gap-1">
          <dt>Bankroll</dt>
          <dd className={cn("text-lg font-semibold text-[var(--nj-text)]", bankrollPulse === "win" ? "nj-bankroll-win" : undefined, bankrollPulse === "lose" ? "nj-bankroll-lose" : undefined)}>
            {formatCurrency(bankroll)}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt>Bet</dt>
          <dd className="text-lg font-semibold text-[var(--nj-text)]">{formatCurrency(pendingBet)}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt>Round</dt>
          <dd className="text-lg font-semibold text-[var(--nj-text)]">{round}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt>Phase</dt>
          <dd className="text-lg font-semibold text-[var(--nj-text)]">{phase}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt>Cards / Discard</dt>
          <dd className="text-lg font-semibold text-[var(--nj-text)]">{cardsRemaining} / {discardCount}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt>Penetration</dt>
          <dd className="text-lg font-semibold text-[var(--nj-text)]">{penetration}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt>Table</dt>
          <dd className="text-lg font-semibold text-[var(--nj-text)]">
            {formatCurrency(rules.minBet)} – {formatCurrency(rules.maxBet)}
          </dd>
        </div>
      </dl>
    </header>
  );
};
