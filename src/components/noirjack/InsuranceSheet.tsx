import React from "react";
import { formatCurrency } from "../../utils/currency";

interface InsuranceSheetProps {
  open: boolean;
  amount: number;
  onTake: () => void;
  onSkip: () => void;
}

export const InsuranceSheet: React.FC<InsuranceSheetProps> = ({ open, amount, onTake, onSkip }) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="nj-glass w-full max-w-lg rounded-t-[28px] border border-[rgba(233,196,106,0.25)] bg-[rgba(6,20,16,0.9)] px-5 pb-6 pt-6 text-[var(--nj-text)] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Insurance offer"
        style={{ paddingBottom: `max(env(safe-area-inset-bottom), 24px)` }}
      >
        <p className="text-[0.62rem] uppercase tracking-[0.32em] text-[var(--nj-text-muted)]">Insurance Offer</p>
        <h2 className="mt-3 text-lg font-semibold tracking-[0.06em]">Dealer shows Ace — take insurance for {formatCurrency(amount)}?</h2>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" className="nj-btn nj-btn-primary h-14 text-base uppercase tracking-[0.3em]" onClick={onTake}>
            Take Insurance
          </button>
          <button type="button" className="nj-btn h-14 text-base uppercase tracking-[0.3em]" onClick={onSkip}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};
