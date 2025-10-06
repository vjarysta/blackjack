import React from "react";
import { Icon } from "@iconify/react";
import type { Phase, RuleConfig, Shoe } from "../../engine/types";
import { formatCurrency } from "../../utils/currency";
import { cn } from "../../utils/cn";

interface SoloHUDProps {
  bankroll: number;
  currentBet: number;
  round: number;
  phase: Phase;
  shoe: Shoe;
  rules: RuleConfig;
  collapsed: boolean;
  onToggleStats: () => void;
}

const formatPhase = (phase: Phase): string => {
  switch (phase) {
    case "betting":
      return "Betting";
    case "insurance":
      return "Insurance";
    case "playerActions":
      return "Decision";
    case "dealerPlay":
      return "Dealer";
    case "settlement":
      return "Payout";
    default:
      return phase;
  }
};

const computePenetration = (shoe: Shoe): number => {
  const total = shoe.cards.length + shoe.discard.length;
  if (total === 0) {
    return 0;
  }
  return (shoe.discard.length / total) * 100;
};

export const SoloHUD: React.FC<SoloHUDProps> = ({
  bankroll,
  currentBet,
  round,
  phase,
  shoe,
  rules,
  collapsed,
  onToggleStats,
}) => {
  const penetration = computePenetration(shoe);

  return (
    <div
      className={cn(
        "grid grid-cols-1 items-center gap-4 text-[11px] font-semibold uppercase tracking-[var(--caps-track)] text-[var(--text-lo)] transition-all duration-300 sm:grid-cols-[1fr_auto_1fr]",
        collapsed && "opacity-90",
      )}
      role="banner"
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[var(--text-hi)]">
        <div className="flex flex-col">
          <span className="text-[10px] text-[var(--text-lo)]">Bankroll</span>
          <span className="text-sm text-[var(--text-hi)]">{formatCurrency(bankroll)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[var(--text-lo)]">Current Bet</span>
          <span className="text-sm text-[var(--text-hi)]">{formatCurrency(currentBet)}</span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-2 text-center text-[var(--text-hi)] sm:flex-row sm:gap-6">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[var(--text-lo)]">Round</span>
          <span className="text-base tracking-[0.2em]">{round}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[var(--text-lo)]">Phase</span>
          <span className="text-base tracking-[0.2em]">{formatPhase(phase)}</span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-black/20 px-3 py-1 text-[10px]">
          <Icon icon="mdi:information-outline" className="text-[var(--text-lo)]" width={14} height={14} />
          <span>
            Count {rules.enableHiLoCounter ? "Live" : "N/A"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-4 text-[var(--text-hi)]">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-[var(--text-lo)]">Cards Left</span>
          <span className="text-sm">{shoe.cards.length}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-[var(--text-lo)]">Penetration</span>
          <span className="text-sm">{penetration.toFixed(0)}%</span>
        </div>
        <button
          type="button"
          onClick={onToggleStats}
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(216,182,76,0.35)] bg-[rgba(14,33,25,0.6)] px-4 py-1 text-[10px] uppercase tracking-[0.25em] text-[var(--text-hi)] transition hover:border-[rgba(216,182,76,0.6)] hover:bg-[rgba(14,33,25,0.85)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        >
          <Icon icon="mdi:chart-areaspline" width={16} height={16} />
          Stats
        </button>
      </div>
    </div>
  );
};
