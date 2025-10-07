import React from "react";
import { audioService } from "../services/AudioService";
import { formatCurrency } from "../utils/currency";
import { cn } from "../utils/cn";
import type { OutcomeKind } from "./outcome";

interface ResultBannerProps {
  kind: OutcomeKind;
  amount?: number;
  state: "enter" | "exit";
}

const labelForKind = (kind: OutcomeKind): string => {
  switch (kind) {
    case "blackjack":
      return "Blackjack";
    case "insurance":
      return "Insurance Win";
    case "push":
      return "Push";
    case "win":
      return "Win";
    case "lose":
    default:
      return "Lose";
  }
};

export const ResultBanner: React.FC<ResultBannerProps> = ({ kind, amount, state }) => {
  React.useEffect(() => {
    if (state === "enter") {
      audioService.playResult(kind === "lose" ? "lose" : kind);
    }
  }, [kind, state]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-20 z-30 flex justify-center px-4",
        state === "enter" && "opacity-100",
        state === "exit" && "opacity-0"
      )}
      aria-live="polite"
      role="status"
    >
      <div className="rounded-full border border-[#c8a24a]/60 bg-[#0f3226]/95 px-5 py-2 text-center text-sm font-semibold uppercase tracking-[0.32em] text-emerald-50 shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
        <span>{labelForKind(kind)}</span>
        {amount && amount > 0.004 ? <span className="ml-3 text-emerald-200">{formatCurrency(amount)}</span> : null}
      </div>
    </div>
  );
};
