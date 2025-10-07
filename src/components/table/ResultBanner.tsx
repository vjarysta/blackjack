import React from "react";
import { audioService } from "../../services/AudioService";
import { cn } from "../../utils/cn";
import { formatCurrency } from "../../utils/currency";

export type ResultKind = "win" | "lose" | "push" | "blackjack" | "insurance";

type ResultBannerProps = {
  kind: ResultKind;
  amount?: number;
  phase?: "enter" | "exit";
};

const getLabel = (kind: ResultKind): string => {
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

export const ResultBanner: React.FC<ResultBannerProps> = ({ kind, amount, phase }) => {
  const label = getLabel(kind);
  const showAmount = typeof amount === "number" && Number.isFinite(amount) && amount > 0.004;
  React.useEffect(() => {
    if (phase === "exit") {
      return;
    }
    audioService.playResult(kind);
  }, [kind, phase]);
  return (
    <div
      className={cn("result-banner", `is-${kind}`, phase === "enter" && "result-enter", phase === "exit" && "result-exit")}
      role="status"
      aria-live="polite"
    >
      <span className="result-label">{label}</span>
      {showAmount ? <span className="result-amount">{formatCurrency(amount)}</span> : null}
    </div>
  );
};
