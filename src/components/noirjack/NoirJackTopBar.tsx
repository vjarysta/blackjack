import React from "react";
import { Info, Settings, Sparkles } from "lucide-react";
import type { RuleConfig } from "../../engine/types";
import { RuleBadges } from "../RuleBadges";
import { formatCurrency } from "../../utils/currency";
import type { CoachMode } from "../../store/useGameStore";

interface NoirJackTopBarProps {
  rules: RuleConfig;
  bankroll: number;
  round: number;
  phase: string;
  cardsRemaining: number;
  discardCount: number;
  minBet: number;
  maxBet: number;
  coachMode: CoachMode;
  onCoachModeChange: (mode: CoachMode) => void;
  modeToggle: React.ReactNode;
  bankrollTone?: "win" | "lose" | null;
}

const COACH_LABELS: Record<CoachMode, string> = {
  off: "Off",
  feedback: "Feedback",
  live: "Live"
};

export const NoirJackTopBar: React.FC<NoirJackTopBarProps> = ({
  rules,
  bankroll,
  round,
  phase,
  cardsRemaining,
  discardCount,
  minBet,
  maxBet,
  coachMode,
  onCoachModeChange,
  modeToggle,
  bankrollTone = null
}) => {
  const cycleCoach = React.useCallback(() => {
    const states: CoachMode[] = ["off", "feedback", "live"];
    const next = states[(states.indexOf(coachMode) + 1) % states.length];
    onCoachModeChange(next);
  }, [coachMode, onCoachModeChange]);

  return (
    <div className="flex flex-col gap-5 px-5 py-5 text-[0.95rem]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <span className="nj-heading text-2xl tracking-[0.28em]">NOIRJACK</span>
            <RuleBadges rules={rules} />
          </div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--nj-text-muted)]">A house edge you can read.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Table information"
            className="nj-btn nj-btn-tertiary"
            title="Table information"
          >
            <Info size={18} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Table settings"
            className="nj-btn nj-btn-tertiary"
            title="Table settings"
          >
            <Settings size={18} strokeWidth={1.5} />
          </button>
          <div className="hidden sm:block">{modeToggle}</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={cycleCoach}
          className="nj-btn nj-btn-secondary text-sm"
          aria-label={`Toggle coach mode (currently ${COACH_LABELS[coachMode]})`}
        >
          <Sparkles size={18} strokeWidth={1.5} />
          <span className="tracking-[0.28em]">Coach</span>
          <span className="rounded-full border border-[rgba(233,196,106,0.35)] bg-[rgba(233,196,106,0.15)] px-3 py-1 text-xs">
            {COACH_LABELS[coachMode]}
          </span>
        </button>
        <div className="sm:hidden">{modeToggle}</div>
      </div>
      <div className="nj-stat-grid">
        <div className="nj-stat-card nj-total-halo" data-tone={bankrollTone ?? undefined}>
          <span className="nj-stat-label">Bankroll</span>
          <span className="nj-stat-value">{formatCurrency(bankroll)}</span>
        </div>
        <div className="nj-stat-card">
          <span className="nj-stat-label">Round</span>
          <span className="nj-stat-value">{round}</span>
        </div>
        <div className="nj-stat-card">
          <span className="nj-stat-label">Phase</span>
          <span className="nj-stat-value uppercase tracking-[0.18em]">{phase}</span>
        </div>
        <div className="nj-stat-card">
          <span className="nj-stat-label">Cards / Discard</span>
          <span className="nj-stat-value">
            {cardsRemaining} / {discardCount}
          </span>
        </div>
        <div className="nj-stat-card">
          <span className="nj-stat-label">Table Min</span>
          <span className="nj-stat-value">{formatCurrency(minBet)}</span>
        </div>
        <div className="nj-stat-card">
          <span className="nj-stat-label">Table Max</span>
          <span className="nj-stat-value">{formatCurrency(maxBet)}</span>
        </div>
      </div>
    </div>
  );
};
