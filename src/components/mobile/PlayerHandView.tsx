import React from "react";
import type { Seat } from "../../engine/types";
import { CardFan } from "./CardFan";
import { useResizeObserver } from "./hooks";
import { bestTotal, getHandTotals, isBust } from "../../engine/totals";
import { formatCurrency } from "../../utils/currency";
import { cn } from "../../utils/cn";

interface PlayerHandViewProps {
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

export const PlayerHandView: React.FC<PlayerHandViewProps> = ({ seat, activeHandId }) => {
  const hands = seat?.hands ?? [];
  const [ref, width] = useResizeObserver<HTMLDivElement>();
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

  const totals = focusedHand ? getHandTotals(focusedHand) : null;
  const totalDisplay = totals
    ? isBust(focusedHand)
      ? "Bust"
      : totals.soft && totals.soft !== totals.hard
        ? `${bestTotal(focusedHand)} / ${totals.hard}`
        : `${bestTotal(focusedHand)}`
    : "--";

  const handleFocus = (handId: string) => {
    setFocusedHandId(handId);
  };

  return (
    <div
      ref={ref}
      className="flex flex-col gap-4 rounded-3xl border border-emerald-700/60 bg-[#0c2f24]/75 p-4 shadow-[0_20px_45px_rgba(0,0,0,0.35)]"
    >
      <div className="flex flex-col items-center gap-3">
        {focusedHand ? (
          <CardFan cards={focusedHand.cards} containerWidth={width} />
        ) : (
          <div className="flex h-36 w-full items-center justify-center text-sm text-emerald-200/70">
            Place a bet to start
          </div>
        )}
        <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-700/40 bg-emerald-950/60 px-4 py-3 text-[11px] uppercase tracking-[0.32em] text-emerald-200">
          <div className="flex flex-col text-left">
            <span className="text-emerald-400/70">Total</span>
            <span className="text-lg font-semibold text-emerald-50">{totalDisplay}</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-emerald-400/70">Bet</span>
            <span className="text-lg font-semibold text-emerald-50">{formatCurrency(focusedHand?.bet ?? 0)}</span>
          </div>
          {hands.length > 1 && focusedHand && (
            <div className="flex flex-col text-left">
              <span className="text-emerald-400/70">Hand</span>
              <span className="text-lg font-semibold text-emerald-50">
                {hands.findIndex((hand) => hand.id === focusedHand.id) + 1}/{hands.length}
              </span>
            </div>
          )}
          {focusedHand && (
            <div className="flex flex-col text-left">
              <span className="text-emerald-400/70">Status</span>
              <span className="text-sm font-semibold text-emerald-200">{statusLabel(focusedHand)}</span>
            </div>
          )}
        </div>
      </div>
      {hands.length > 1 && (
        <div className="flex items-center justify-center gap-2">
          {hands.map((hand) => {
            const isActive = hand.id === focusedHand?.id;
            const isEngineActive = hand.id === activeHandId;
            return (
              <button
                key={hand.id}
                type="button"
                onClick={() => handleFocus(hand.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] transition",
                  isActive
                    ? "border-emerald-400 bg-emerald-600/30 text-emerald-50"
                    : "border-emerald-700/60 bg-emerald-950/40 text-emerald-200 hover:text-emerald-50"
                )}
                aria-pressed={isActive}
              >
                {isEngineActive ? "● " : ""}
                H{hands.findIndex((candidate) => candidate.id === hand.id) + 1}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
