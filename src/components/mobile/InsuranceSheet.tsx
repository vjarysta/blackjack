import React from "react";
import { Button } from "../ui/button";
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
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
      <div
        className="w-full max-w-md rounded-t-3xl border border-emerald-700/60 bg-[#0d2d22]/95 p-5 text-emerald-100 shadow-[0_-12px_36px_rgba(0,0,0,0.45)] backdrop-blur"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-300">Insurance Offer</p>
        <h2 className="mt-3 text-lg font-semibold text-emerald-50">
          Dealer shows Ace — insurance for {formatCurrency(amount)}?
        </h2>
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
