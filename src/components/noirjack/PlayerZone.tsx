import React from "react";
import type { Seat } from "../../engine/types";
import { bestTotal, getHandTotals, isBust } from "../../engine/totals";
import { formatCurrency } from "../../utils/currency";
import { NoirJackCardFan } from "./CardFan";
import { useResizeObserver } from "./hooks";
import { cn } from "../../utils/cn";

interface PlayerZoneProps {
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

export const PlayerZone: React.FC<PlayerZoneProps> = ({ seat, activeHandId }) => {
  const hands = seat?.hands ?? [];
  const [ref, width] = useResizeObserver<HTMLDivElement>();
  const [focusedHandId, setFocusedHandId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const seatHands = seat?.hands ?? [];
    if (!focusedHandId) {
      if (activeHandId) {
        setFocusedHandId(activeHandId);
        return;
      }
      if (seatHands.length > 0) {
        setFocusedHandId(seatHands[0].id);
      }
    }
  }, [activeHandId, focusedHandId, seat]);

  React.useEffect(() => {
    if (activeHandId && focusedHandId !== activeHandId) {
      setFocusedHandId(activeHandId);
    }
  }, [activeHandId, focusedHandId, seat]);

  const focusedHand = hands.find((hand) => hand.id === focusedHandId) ?? hands[0];
  const totals = focusedHand ? getHandTotals(focusedHand) : null;

  const totalDisplay = totals
    ? isBust(focusedHand)
      ? "Bust"
      : totals.soft && totals.soft !== totals.hard
        ? `${bestTotal(focusedHand)} / ${totals.hard}`
        : `${bestTotal(focusedHand)}`
    : "--";

  return (
    <section ref={ref} className="nj-glass flex flex-col gap-5 px-4 py-5">
      <div className="flex flex-col items-center gap-4">
        {focusedHand ? (
          <NoirJackCardFan cards={focusedHand.cards} containerWidth={width} />
        ) : (
          <div className="flex h-36 w-full items-center justify-center text-sm text-[var(--nj-text-muted)]">
            Place a bet to start
          </div>
        )}
        <div className="w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(10,15,20,0.35)] px-4 py-3">
          <dl className="grid grid-cols-2 gap-3 text-[0.68rem] uppercase tracking-[0.32em] text-[var(--nj-text-muted)] sm:grid-cols-4">
            <div className="flex flex-col gap-1">
              <dt>Total</dt>
              <dd className="text-lg font-semibold text-[var(--nj-text)]">{totalDisplay}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt>Bet</dt>
              <dd className="text-lg font-semibold text-[var(--nj-text)]">{formatCurrency(focusedHand?.bet ?? 0)}</dd>
            </div>
            {hands.length > 1 && focusedHand ? (
              <div className="flex flex-col gap-1">
                <dt>Hand</dt>
                <dd className="text-lg font-semibold text-[var(--nj-text)]">
                  {hands.findIndex((hand) => hand.id === focusedHand.id) + 1}/{hands.length}
                </dd>
              </div>
            ) : null}
            {focusedHand ? (
              <div className="flex flex-col gap-1">
                <dt>Status</dt>
                <dd className="text-sm font-semibold text-[var(--nj-text-muted)]">{statusLabel(focusedHand)}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
      {hands.length > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {hands.map((hand, index) => {
            const isActive = hand.id === focusedHand?.id;
            const isEngineActive = hand.id === activeHandId;
            return (
              <button
                key={hand.id}
                type="button"
                onClick={() => setFocusedHandId(hand.id)}
                className={cn(
                  "nj-btn px-4 py-2 text-[0.62rem] uppercase tracking-[0.32em]",
                  isActive
                    ? "bg-[rgba(233,196,106,0.12)] text-[var(--nj-text)] border-[rgba(233,196,106,0.35)]"
                    : "text-[var(--nj-text-muted)]"
                )}
                aria-pressed={isActive}
              >
                {isEngineActive ? "● " : ""}H{index + 1}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};
