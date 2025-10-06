import React from "react";
import type { Hand, Phase, RuleConfig } from "../../../engine/types";
import { getHandTotals } from "../../../engine/totals";
import { AnimatedCard } from "../../../components/animation/AnimatedCard";
import { FlipCard } from "../../../components/animation/FlipCard";
import { PlayingCard } from "../../../components/table/PlayingCard";
import { DEAL_STAGGER } from "../../../utils/animConstants";

interface DealerAreaProps {
  hand: Hand;
  revealHole: boolean;
  phase: Phase;
  rules: RuleConfig;
}

const CARD_WIDTH = 92;
const CARD_GAP = 18;

export const DealerArea: React.FC<DealerAreaProps> = ({ hand, revealHole, phase, rules }) => {
  const totals = getHandTotals(hand);
  const cards = hand.cards;

  return (
    <section className="flex w-full flex-col items-center gap-4 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[rgba(216,182,76,0.75)]">
        Blackjack pays {rules.blackjackPayout} · Insurance 2:1
      </div>
      <div className="solo-surface flex w-full max-w-3xl flex-col items-center gap-3 px-6 py-5">
        <span className="text-xs font-semibold uppercase tracking-[0.5em] text-[var(--text-lo)]">Dealer</span>
        <div className="relative flex h-[160px] w-full items-center justify-center">
          {cards.map((card, index) => {
            const offsetX = index * (CARD_WIDTH + CARD_GAP);
            const startX = -80 + index * 12;
            const content =
              index === 1 ? (
                <FlipCard
                  isRevealed={revealHole}
                  back={<PlayingCard rank={card.rank} suit={card.suit} faceDown />}
                  front={<PlayingCard rank={card.rank} suit={card.suit} />}
                />
              ) : (
                <PlayingCard rank={card.rank} suit={card.suit} />
              );
            return (
              <AnimatedCard
                key={`${hand.id}-${card.rank}${card.suit}-${index}`}
                id={`${hand.id}-${index}`}
                from={{ x: startX, y: -140 }}
                to={{ x: offsetX - ((cards.length - 1) * (CARD_WIDTH + CARD_GAP)) / 2, y: 0 }}
                rotation={index * 2 - 4}
                delay={index * DEAL_STAGGER}
                z={index}
              >
                {content}
              </AnimatedCard>
            );
          })}
        </div>
        <div className="rounded-full bg-[rgba(12,31,24,0.85)] px-4 py-1 text-xs uppercase tracking-[0.35em] text-[var(--text-hi)]">
          {revealHole
            ? totals.soft && totals.soft !== totals.hard
              ? `Total ${totals.hard} / ${totals.soft}`
              : `Total ${totals.hard}`
            : phase === "betting"
            ? "En attente"
            : "Carte visible"}
        </div>
      </div>
    </section>
  );
};
