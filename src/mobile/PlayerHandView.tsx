import React from "react";
import type { GameState, Hand, Seat } from "../engine/types";
import { getHandTotals, isBust } from "../engine/totals";
import { ScaledCard } from "./ScaledCard";
import type { CardMetrics } from "./useCardMetrics";
import { formatBet, formatHandTotals } from "./formatters";
import { cn } from "../utils/cn";

interface PlayerHandViewProps {
  game: GameState;
  seat: Seat | null;
  focusedHandId: string | null;
  activeHandId: string | null;
  metrics: CardMetrics;
  onFocusHand: (handId: string) => void;
}

const buildStatusBadges = (hand: Hand): string[] => {
  const badges: string[] = [];
  if (hand.isBlackjack) {
    badges.push("Blackjack");
  }
  if (hand.isDoubled) {
    badges.push("Doubled");
  }
  if (hand.isSurrendered) {
    badges.push("Surrendered");
  }
  if (isBust(hand)) {
    badges.push("Bust");
  }
  return badges;
};

const handLabel = (index: number, total: number): string => {
  if (total <= 1) {
    return "";
  }
  return `Hand ${index + 1}/${total}`;
};

export const PlayerHandView: React.FC<PlayerHandViewProps> = ({
  game,
  seat,
  focusedHandId,
  activeHandId,
  metrics,
  onFocusHand
}) => {
  const hands = seat?.hands ?? [];
  const focusedHand = hands.find((hand) => hand.id === focusedHandId) ?? hands[0] ?? null;
  const activeHand = hands.find((hand) => hand.id === activeHandId) ?? null;
  const fanWidth = metrics.fanWidth(focusedHand?.cards.length ?? 0);
  const positions = metrics.positions(focusedHand?.cards.length ?? 0);

  const infoLabel = focusedHand
    ? formatHandTotals(getHandTotals(focusedHand))
    : formatBet(seat?.baseBet ?? 0);

  const badgeItems = focusedHand ? buildStatusBadges(focusedHand) : [];

  return (
    <section aria-label="Player" className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: fanWidth, minHeight: metrics.cardHeight }}>
        {focusedHand?.cards.map((card, index) => {
          const position = positions[index] ?? { left: 0 };
          return (
            <div
              key={`${card.rank}${card.suit}${index}`}
              className="absolute top-0"
              style={{ left: position.left, transition: "left 120ms ease-out" }}
            >
              <ScaledCard card={card} width={metrics.cardWidth} height={metrics.cardHeight} />
            </div>
          );
        })}
        {!focusedHand && (
          <div className="flex h-full w-full items-center justify-center text-sm text-emerald-200">
            {game.phase === "betting" ? "Place your bet" : "Waiting for deal"}
          </div>
        )}
      </div>
      <div className="flex w-full max-w-sm flex-col items-center gap-2">
        <div className="grid w-full grid-cols-3 items-center gap-2 rounded-2xl border border-[#c8a24a]/50 bg-[#0e3226]/80 px-4 py-3 text-center text-[11px] uppercase tracking-[0.32em] text-emerald-200 shadow-[0_16px_34px_rgba(0,0,0,0.45)]">
          <div className="flex flex-col gap-1">
            <span className="text-emerald-300">Total</span>
            <span className="text-base font-semibold tracking-[0.12em] text-emerald-50">{infoLabel}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-emerald-300">Bet</span>
            <span className="text-base font-semibold tracking-[0.12em] text-emerald-50">
              {formatBet(focusedHand?.bet ?? seat?.baseBet ?? 0)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-emerald-300">Hands</span>
            <span className="text-base font-semibold tracking-[0.12em] text-emerald-50">
              {handLabel(focusedHand ? hands.indexOf(focusedHand) : 0, hands.length) ||
                (hands.length > 0 ? `${hands.length}` : "0")}
            </span>
          </div>
        </div>
        {badgeItems.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {badgeItems.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-emerald-400/50 bg-emerald-900/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-emerald-200"
              >
                {badge}
              </span>
            ))}
          </div>
        )}
        {hands.length > 1 && (
          <div className="flex items-center gap-2">
            {hands.map((hand) => {
              const index = hands.indexOf(hand);
              const isFocused = hand.id === (focusedHand?.id ?? focusedHandId);
              const isActive = hand.id === activeHand?.id;
              return (
                <button
                  key={hand.id}
                  type="button"
                  onClick={() => onFocusHand(hand.id)}
                  className={cn(
                    "min-w-[56px] rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] transition",
                    isFocused
                      ? "border-[#c8a24a] bg-[#1a4a36] text-emerald-50"
                      : "border-[#c8a24a]/30 bg-[#0c2e23] text-emerald-200 hover:bg-[#144432]",
                    isActive && "shadow-[0_0_0_1px_rgba(200,162,74,0.6)]"
                  )}
                  aria-pressed={isFocused}
                >
                  H{index + 1}
                </button>
              );
            })}
          </div>
        )}
        {focusedHand && activeHand && focusedHand.id !== activeHand.id && (
          <p className="text-center text-[11px] uppercase tracking-[0.32em] text-emerald-300">
            Viewing different hand — actions apply to active hand H
            {hands.indexOf(activeHand) + 1}
          </p>
        )}
      </div>
    </section>
  );
};
