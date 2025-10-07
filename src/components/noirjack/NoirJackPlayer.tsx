import React from "react";
import type { Seat } from "../../engine/types";
import { CardFan } from "./CardFan";
import { useResizeObserver } from "./hooks";
import { bestTotal, getHandTotals, isBust } from "../../engine/totals";
import { formatCurrency } from "../../utils/currency";
import { cn } from "../../utils/cn";

interface NoirJackPlayerProps {
  seat: Seat | null;
  activeHandId: string | null;
}

const statusLabel = (hand: Seat["hands"][number]): string => {
  if (hand.isSurrendered) {
    return "Surrender";
  }
  if (isBust(hand)) {
    return "Bust";
  }
  if (hand.isBlackjack) {
    return "Blackjack";
  }
  if (hand.isResolved) {
    return "Stand";
  }
  return "Playing";
};

const totalDisplay = (hand: Seat["hands"][number] | undefined): string => {
  if (!hand) {
    return "--";
  }
  if (isBust(hand)) {
    return "Bust";
  }
  const totals = getHandTotals(hand);
  if (totals.soft && totals.soft !== totals.hard) {
    return `${bestTotal(hand)} / ${totals.hard}`;
  }
  return `${bestTotal(hand)}`;
};

export const NoirJackPlayer: React.FC<NoirJackPlayerProps> = ({ seat, activeHandId }) => {
  const [ref, width] = useResizeObserver<HTMLDivElement>();
  const seatHands = seat?.hands;
  const hands = React.useMemo(() => seatHands ?? [], [seatHands]);
  const [focusedHandId, setFocusedHandId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!focusedHandId) {
      if (activeHandId) {
        setFocusedHandId(activeHandId);
        return;
      }
      if (hands.length > 0) {
        setFocusedHandId(hands[0].id);
      }
    }
  }, [activeHandId, hands, focusedHandId]);

  React.useEffect(() => {
    if (activeHandId && focusedHandId !== activeHandId) {
      setFocusedHandId(activeHandId);
    }
  }, [activeHandId, focusedHandId]);

  const focusedHand = hands.find((hand) => hand.id === focusedHandId) ?? hands[0];

  return (
    <div ref={ref} className="nj-glass flex flex-col gap-5 px-5 py-6">
      <div className="text-center text-xs uppercase tracking-[0.28em] text-[var(--nj-text-muted)]">Player</div>
      <div className="flex flex-col items-center gap-4">
        {focusedHand ? (
          <CardFan cards={focusedHand.cards} containerWidth={width} />
        ) : (
          <div className="flex h-36 w-full items-center justify-center rounded-3xl border border-[rgba(255,255,255,0.08)] text-sm text-[var(--nj-text-muted)]">
            Place a bet to start
          </div>
        )}
        <div className="nj-meta-bar">
          <div className="nj-meta-card">
            <span className="nj-meta-label">Total</span>
            <span className="nj-meta-value">{totalDisplay(focusedHand)}</span>
          </div>
          <div className="nj-meta-card">
            <span className="nj-meta-label">Bet</span>
            <span className="nj-meta-value">{formatCurrency(focusedHand?.bet ?? seat?.baseBet ?? 0)}</span>
          </div>
          {hands.length > 1 && focusedHand && (
            <div className="nj-meta-card">
              <span className="nj-meta-label">Hand</span>
              <span className="nj-meta-value">
                {hands.findIndex((hand) => hand.id === focusedHand.id) + 1}/{hands.length}
              </span>
            </div>
          )}
          {focusedHand && (
            <div className="nj-meta-card">
              <span className="nj-meta-label">Status</span>
              <span className="nj-meta-value text-base uppercase tracking-[0.18em]">{statusLabel(focusedHand)}</span>
            </div>
          )}
        </div>
      </div>
      {hands.length > 1 && (
        <div className="nj-carousel">
          {hands.map((hand, index) => {
            const isActive = hand.id === focusedHand?.id;
            const isEngineActive = hand.id === activeHandId;
            return (
              <button
                key={hand.id}
                type="button"
                onClick={() => setFocusedHandId(hand.id)}
                data-active={isActive}
                className={cn("relative", isEngineActive ? "after:absolute after:-left-2 after:top-1/2 after:h-1 after:w-1 after:-translate-y-1/2 after:rounded-full after:bg-[var(--nj-gold)]" : undefined)}
              >
                Hand {index + 1}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
