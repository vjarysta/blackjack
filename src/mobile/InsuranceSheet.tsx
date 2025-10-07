import React from "react";
import { Button } from "../components/ui/button";
import { formatCurrency } from "../utils/currency";
import { cn } from "../utils/cn";
import { REDUCED } from "../utils/animConstants";

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
    <div
      role="dialog"
      aria-label="Insurance offer"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex justify-center px-4",
        REDUCED ? "" : "animate-slide-up"
      )}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-[#c8a24a]/50 bg-[#08221a]/95 px-5 py-6 text-center shadow-[0_-18px_42px_rgba(0,0,0,0.6)]"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 24px)` }}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-emerald-200">
          Dealer shows Ace — Insurance?
        </p>
        <p className="mt-2 text-base text-emerald-100">Half bet: {formatCurrency(amount)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button size="lg" onClick={onTake}>
            Take Insurance
          </Button>
          <Button size="lg" variant="outline" onClick={onSkip}>
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
};
