import React from "react";
import type { Phase, Shoe } from "../../../engine/types";
import { formatCurrency } from "../../../utils/currency";

interface SoloHUDProps {
  bankroll: number;
  bet: number;
  round: number;
  phase: Phase;
  shoe: Shoe;
  statsOpen: boolean;
  collapsed: boolean;
  onToggleStats: () => void;
}

const penetrationLabel = (shoe: Shoe): string => {
  const total = shoe.cards.length + shoe.discard.length;
  if (total === 0) {
    return "0%";
  }
  return `${Math.round((shoe.discard.length / total) * 100)}%`;
};

export const SoloHUD: React.FC<SoloHUDProps> = ({
  bankroll,
  bet,
  round,
  phase,
  shoe,
  statsOpen,
  collapsed,
  onToggleStats
}) => {
  const cardsRemaining = shoe.cards.length;
  const penetration = penetrationLabel(shoe);
  const hudStateClass = collapsed ? "solo-hud solo-hud-reduced" : "solo-hud solo-hud-expanded";

  return (
    <header className={`${hudStateClass} flex w-full items-center justify-between gap-4 px-4 py-3 transition-[opacity,filter]`}
      aria-live="polite"
    >
      <div className="flex min-w-0 flex-1 items-center gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-[var(--caps-track)] text-[var(--text-lo)]">Bankroll</span>
          <span className="text-lg font-semibold text-[var(--text-hi)]">{formatCurrency(bankroll)}</span>
        </div>
        <div className="hidden flex-col gap-1 sm:flex">
          <span className="text-[10px] font-semibold uppercase tracking-[var(--caps-track)] text-[var(--text-lo)]">
            Mise
          </span>
          <span className="text-lg font-semibold text-[var(--text-hi)]">{formatCurrency(bet)}</span>
        </div>
      </div>
      <div className="flex flex-1 justify-center gap-6 text-center text-xs uppercase tracking-[var(--caps-track)] text-[var(--text-lo)] sm:text-sm">
        <div className="flex flex-col gap-0.5">
          <span>Round</span>
          <span className="text-base font-semibold text-[var(--text-hi)]">{round}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span>Phase</span>
          <span className="text-base font-semibold text-[var(--text-hi)]">{phase}</span>
        </div>
        <div className="hidden flex-col gap-0.5 md:flex">
          <span>Cartes</span>
          <span className="text-base font-semibold text-[var(--text-hi)]">{cardsRemaining}</span>
        </div>
        <div className="hidden flex-col gap-0.5 md:flex">
          <span>Pénétration</span>
          <span className="text-base font-semibold text-[var(--text-hi)]">{penetration}</span>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="flex flex-col items-end gap-1 text-right text-[11px] uppercase tracking-[var(--caps-track)] text-[var(--text-lo)]">
          <span>Sabot</span>
          <span className="text-base font-semibold text-[var(--text-hi)]">{cardsRemaining} cartes</span>
        </div>
        <button
          type="button"
          className="solo-control solo-secondary h-10 px-3 text-[11px]"
          aria-pressed={statsOpen}
          onClick={onToggleStats}
        >
          Stats
        </button>
      </div>
    </header>
  );
};
