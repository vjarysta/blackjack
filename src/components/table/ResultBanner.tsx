import React from "react";
import { cn } from "../../utils/cn";

export type ResultKind = "win" | "lose" | "push" | "blackjack" | "insurance";

interface ResultBannerProps {
  kind: ResultKind;
  amount?: number;
  exiting?: boolean;
}

const formatLabel = (kind: ResultKind): string => {
  switch (kind) {
    case "blackjack":
      return "BLACKJACK!";
    case "insurance":
      return "INSURANCE WIN";
    case "push":
      return "PUSH";
    case "win":
      return "WIN";
    default:
      return "LOSE";
  }
};

export const ResultBanner: React.FC<ResultBannerProps> = ({ kind, amount, exiting = false }) => {
  const amountLabel = typeof amount === "number" && amount > 0 ? `€${amount.toFixed(2)}` : null;
  return (
    <div
      className={cn("result-banner", `is-${kind}`, exiting ? "result-exit" : "result-enter")}
      role="status"
      aria-live="polite"
    >
      <span className="result-label">{formatLabel(kind)}</span>
      {amountLabel ? <span className="result-amount">{amountLabel}</span> : null}
    </div>
  );
};
