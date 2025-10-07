import React from "react";
import type { Dealer, Phase } from "../../engine/types";
import { bestTotal, getHandTotals, isBust } from "../../engine/totals";
import { NoirJackCardFan } from "./CardFan";
import { useResizeObserver } from "./hooks";

interface DealerZoneProps {
  dealer: Dealer;
  phase: Phase;
  insuranceMessage?: string | null;
}

const dealerLabel = (dealer: Dealer, phase: Phase): string => {
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
    const value = dealer.upcard.rank === "10" ? "10" : dealer.upcard.rank;
    return `Showing ${value}`;
  }
  return "Waiting";
};

const faceDownCards = (dealer: Dealer, phase: Phase): number[] => {
  if (phase === "playerActions" || phase === "dealerPlay" || phase === "settlement") {
    return [];
  }
  if (dealer.hand.cards.length > 1) {
    return [dealer.hand.cards.length - 1];
  }
  return [];
};

export const DealerZone: React.FC<DealerZoneProps> = ({ dealer, phase, insuranceMessage }) => {
  const [ref, width] = useResizeObserver<HTMLDivElement>();
  const label = dealerLabel(dealer, phase);
  const faceDown = React.useMemo(() => faceDownCards(dealer, phase), [dealer, phase]);

  return (
    <section ref={ref} className="nj-glass flex flex-col items-center gap-3 px-4 py-5 text-center">
      <NoirJackCardFan cards={dealer.hand.cards} faceDownIndexes={faceDown} containerWidth={width} />
      <div className="text-[0.68rem] uppercase tracking-[0.38em] text-[var(--nj-text-muted)]">
        <span className="font-cinzel text-sm text-[var(--nj-text)]">Dealer</span>
        <span className="ml-2 text-[var(--nj-text-muted)]">· {label}</span>
      </div>
      {insuranceMessage ? (
        <div className="rounded-full border border-[rgba(233,196,106,0.25)] bg-[rgba(233,196,106,0.08)] px-3 py-1 text-[0.65rem] uppercase tracking-[0.32em] text-[var(--nj-gold)]">
          {insuranceMessage}
        </div>
      ) : null}
    </section>
  );
};
