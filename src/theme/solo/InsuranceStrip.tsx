import React from "react";
import type { Hand } from "../../engine/types";
import { formatCurrency } from "../../utils/currency";
import { cn } from "../../utils/cn";

interface InsuranceStripProps {
  hand: Hand;
  bankroll: number;
  onConfirm: (amount: number) => void;
  onSkip: () => void;
}

export const InsuranceStrip: React.FC<InsuranceStripProps> = ({ hand, bankroll, onConfirm, onSkip }) => {
  const maxInsurance = Math.min(hand.bet / 2, bankroll);
  const [value, setValue] = React.useState(maxInsurance);

  React.useEffect(() => {
    setValue(maxInsurance);
  }, [maxInsurance]);

  const handleSubmit = () => {
    onConfirm(Number.parseFloat(value.toFixed(2)));
  };

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-[rgba(216,182,76,0.2)] bg-[rgba(14,33,25,0.75)] px-4 py-3 text-[10px] uppercase tracking-[0.24em] text-[var(--text-lo)]">
      <div className="flex flex-col gap-2 text-[var(--text-hi)] sm:flex-row sm:items-center sm:justify-between">
        <span>Dealer shows Ace — Insurance?</span>
        <div className="flex items-center gap-2 text-[11px]">
          <span>{formatCurrency(0)}</span>
          <input
            type="range"
            min={0}
            max={maxInsurance}
            step={0.5}
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
            className="h-1 w-48 cursor-pointer appearance-none rounded-full bg-[rgba(216,182,76,0.25)]"
          />
          <span>{formatCurrency(maxInsurance)}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[var(--text-hi)]">
        <button
          type="button"
          onClick={handleSubmit}
          className="solo-action-primary rounded-full px-5 py-2 text-[11px] uppercase tracking-[0.24em]"
        >
          Take {formatCurrency(value)}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className={cn(
            "rounded-full border border-[rgba(216,182,76,0.3)] px-5 py-2 text-[11px] uppercase tracking-[0.24em] text-[var(--text-hi)] transition",
            "hover:bg-[rgba(216,182,76,0.08)]",
          )}
        >
          Skip
        </button>
      </div>
    </div>
  );
};
