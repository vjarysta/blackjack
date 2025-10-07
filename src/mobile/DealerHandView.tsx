import React from "react";
import type { GameState } from "../engine/types";
import { getHandTotals, isBust } from "../engine/totals";
import { ScaledCard } from "./ScaledCard";
import type { CardMetrics } from "./useCardMetrics";
import { formatHandTotals } from "./formatters";

interface DealerHandViewProps {
  game: GameState;
  metrics: CardMetrics;
}

const dealerLabel = (game: GameState, revealHole: boolean): string => {
  const { dealer } = game;
  if (!dealer.hand.cards.length) {
    return "Waiting";
  }
  if (!revealHole) {
    const up = dealer.upcard;
    if (up) {
      return `Showing ${up.rank}${up.suit}`;
    }
    return "Showing";
  }
  if (dealer.hand.isBlackjack) {
    return "Blackjack";
  }
  if (isBust(dealer.hand)) {
    return "Bust";
  }
  const totals = getHandTotals(dealer.hand);
  return formatHandTotals(totals);
};

export const DealerHandView: React.FC<DealerHandViewProps> = ({ game, metrics }) => {
  const revealHole =
    game.phase === "dealerPlay" || game.phase === "settlement" || game.dealer.hand.isBlackjack;

  const cards = game.dealer.hand.cards;
  const cardCount = cards.length || (game.dealer.upcard ? 1 : 0);
  const fanWidth = metrics.fanWidth(cardCount);
  const positions = metrics.positions(cardCount);

  return (
    <section aria-label="Dealer" className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: fanWidth, minHeight: metrics.cardHeight }}>
        {cards.map((card, index) => {
          const faceDown = index === 1 && !revealHole;
          const position = positions[index] ?? { left: 0 };
          return (
            <div
              key={`${card.rank}${card.suit}${index}`}
              className="absolute top-0"
              style={{ left: position.left, transition: "left 120ms ease-out" }}
            >
              <ScaledCard card={card} faceDown={faceDown} width={metrics.cardWidth} height={metrics.cardHeight} />
            </div>
          );
        })}
        {cards.length === 0 && game.dealer.upcard && (
          <ScaledCard card={game.dealer.upcard} width={metrics.cardWidth} height={metrics.cardHeight} />
        )}
      </div>
      <div className="flex flex-col items-center text-xs uppercase tracking-[0.35em] text-emerald-200">
        <span className="text-sm font-semibold text-emerald-100">Dealer</span>
        <span className="text-[11px] text-emerald-300">{dealerLabel(game, revealHole)}</span>
      </div>
    </section>
  );
};
