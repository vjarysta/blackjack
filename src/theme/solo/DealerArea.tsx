import React from "react";
import type { Dealer, Phase, RuleConfig } from "../../engine/types";
import { getHandTotals, isBust } from "../../engine/totals";
import { cn } from "../../utils/cn";
import { PlayingCard } from "../../components/table/PlayingCard";

interface DealerAreaProps {
  dealer: Dealer;
  phase: Phase;
  rules: RuleConfig;
}

const shouldRevealHole = (phase: Phase, dealerHasBlackjack: boolean): boolean =>
  phase === "dealerPlay" || phase === "settlement" || dealerHasBlackjack;

export const DealerArea: React.FC<DealerAreaProps> = ({ dealer, phase, rules }) => {
  const revealHole = shouldRevealHole(phase, dealer.hand.isBlackjack);
  const cards = dealer.hand.cards;
  const totals = getHandTotals(dealer.hand);
  const status = React.useMemo(() => {
    if (!revealHole) {
      return "Dealer showing";
    }
    if (dealer.hand.isBlackjack) {
      return "Dealer blackjack";
    }
    if (isBust(dealer.hand)) {
      return "Dealer bust";
    }
    if (totals.soft && totals.soft !== totals.hard) {
      return `Dealer ${totals.hard} / ${totals.soft}`;
    }
    return `Dealer ${totals.hard}`;
  }, [dealer.hand, revealHole, totals]);

  return (
    <section className="flex flex-col items-center gap-3 text-center text-[var(--text-lo)]" aria-label="Dealer">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-lo)]">BLACKJACK PAYS {rules.blackjackPayout}</div>
      <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-lo)]">INSURANCE 2:1</div>

      <div className="relative flex min-h-[180px] w-full flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-[rgba(216,182,76,0.35)] bg-[rgba(10,27,21,0.6)] px-4 py-1 text-[11px] uppercase tracking-[0.28em] text-[var(--text-hi)]">
            Dealer
          </span>
        </div>
        <div className="flex items-center justify-center gap-3">
          {cards.length === 0 && (
            <div className="h-[132px] w-[92px] rounded-2xl border border-dashed border-[rgba(216,182,76,0.25)]" aria-hidden />
          )}
          {cards.map((card, index) => (
            <div
              key={`${card.rank}-${card.suit}-${index}`}
              className={cn(
                "transition-transform duration-200",
                index === 0 ? "translate-y-0" : "-translate-y-1",
                !revealHole && index === 1 && "shadow-[var(--shadow-1)]",
              )}
            >
              <PlayingCard rank={card.rank} suit={card.suit} faceDown={!revealHole && index === 1} />
            </div>
          ))}
        </div>
        <div className="rounded-full bg-[rgba(10,27,21,0.75)] px-4 py-1 text-[10px] uppercase tracking-[0.24em] text-[var(--text-hi)]">
          {status}
        </div>
      </div>
    </section>
  );
};
