import React from "react";
import type { Dealer, Phase } from "../../engine/types";
import { bestTotal, getHandTotals, isBust } from "../../engine/totals";
import { CardFan } from "./CardFan";
import { useResizeObserver } from "./hooks";

interface NoirJackDealerProps {
  dealer: Dealer;
  phase: Phase;
  insuranceMessage?: string | null;
}

const formatDealerLabel = (dealer: Dealer, phase: Phase): string => {
  const totals = getHandTotals(dealer.hand);
  if (phase === "playerActions" || phase === "dealerPlay" || phase === "settlement") {
    if (isBust(dealer.hand)) {
      return "Bust";
    }
    if (totals.soft && totals.soft !== totals.hard) {
      return `${bestTotal(dealer.hand)} / ${totals.hard}`;
    }
    return `${bestTotal(dealer.hand)}`;
  }
  if (dealer.upcard) {
    const value = dealer.upcard.rank === "A" ? "Ace" : dealer.upcard.rank;
    return `Showing ${value}`;
  }
  return "Waiting";
};

export const NoirJackDealer: React.FC<NoirJackDealerProps> = ({ dealer, phase, insuranceMessage }) => {
  const [ref, width] = useResizeObserver<HTMLDivElement>();
  const label = formatDealerLabel(dealer, phase);
  const cards = React.useMemo(() => dealer.hand.cards ?? [], [dealer.hand.cards]);
  const faceDownIndexes = React.useMemo(() => {
    if (phase === "playerActions" || phase === "dealerPlay" || phase === "settlement") {
      return [];
    }
    if (dealer.hand.cards.length > 1) {
      return [dealer.hand.cards.length - 1];
    }
    return [];
  }, [dealer.hand.cards, phase]);

  return (
    <div ref={ref} className="nj-glass flex flex-col items-center gap-4 px-5 py-6 text-center">
      <div className="uppercase tracking-[0.28em] text-[var(--nj-text-muted)]">Dealer</div>
      <CardFan cards={cards} faceDownIndexes={faceDownIndexes} containerWidth={width} />
      <div className="rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(15,23,30,0.55)] px-4 py-1 text-sm tracking-[0.24em] uppercase">
        {label}
      </div>
      {insuranceMessage && (
        <div className="text-xs uppercase tracking-[0.22em] text-[var(--nj-text-muted)]">{insuranceMessage}</div>
      )}
    </div>
  );
};
