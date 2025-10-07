import React from "react";
import type { Dealer, Phase } from "../../engine/types";
import { bestTotal, getHandTotals, isBust } from "../../engine/totals";
import { CardFan } from "./CardFan";
import { useResizeObserver } from "./hooks";

interface DealerHandViewProps {
  dealer: Dealer;
  phase: Phase;
}

const formatDealerLabel = (dealer: Dealer, phase: Phase): string => {
  const totals = getHandTotals(dealer.hand);
  if (phase === "playerActions" || phase === "dealerPlay" || phase === "settlement") {
    if (isBust(dealer.hand)) {
      return "BUST";
    }
    if (totals.soft && totals.soft !== totals.hard) {
      return `${bestTotal(dealer.hand)} / ${totals.hard}`;
    }
    return `${bestTotal(dealer.hand)}`;
  }
  if (dealer.upcard) {
    const value = dealer.upcard.rank === "A" ? "A" : dealer.upcard.rank;
    return `Showing ${value}`;
  }
  return "Waiting";
};

export const DealerHandView: React.FC<DealerHandViewProps> = ({ dealer, phase }) => {
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
    <div ref={ref} className="flex flex-col items-center gap-2 rounded-3xl border border-emerald-800/60 bg-emerald-950/50 p-4">
      <CardFan cards={cards} faceDownIndexes={faceDownIndexes} containerWidth={width} />
      <div className="text-center text-[11px] uppercase tracking-[0.4em] text-emerald-200">Dealer · {label}</div>
    </div>
  );
};
