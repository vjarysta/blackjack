import React from "react";
import { getHandTotals, isBust } from "../../engine/totals";
import type { Hand, Phase, Seat } from "../../engine/types";
import { formatCurrency } from "../../utils/currency";
import { cn } from "../../utils/cn";
import { PlayingCard } from "../../components/table/PlayingCard";
import type { SoloAction, SoloActionAvailability } from "./ActionBar";

interface PlayerAreaProps {
  seat: Seat | undefined;
  activeHandId: string | null;
  phase: Phase;
  activeChip: number;
  onPlaceBet: (value: number) => void;
  onRemoveChip: () => void;
  chipStack: number[];
  availability: SoloActionAvailability;
  onGesture: (gesture: Extract<SoloAction, "hit" | "stand" | "double">) => void;
}

const HAND_GAP = "gap-6 md:gap-8";

const handStatus = (hand: Hand): string | null => {
  if (hand.isBlackjack) {
    return "Blackjack";
  }
  if (hand.isSurrendered) {
    return "Surrendered";
  }
  if (isBust(hand)) {
    return "Bust";
  }
  if (hand.isResolved) {
    return "Stand";
  }
  return null;
};

const renderTotals = (hand: Hand): string => {
  const totals = getHandTotals(hand);
  if (isBust(hand)) {
    return `${totals.hard}`;
  }
  if (totals.soft && totals.soft !== totals.hard) {
    return `${totals.hard} / ${totals.soft}`;
  }
  return `${totals.hard}`;
};

const useTouchGestures = (
  onGesture: PlayerAreaProps["onGesture"],
  availability: SoloActionAvailability,
): {
  onTouchStart: React.TouchEventHandler<HTMLDivElement>;
  onTouchEnd: React.TouchEventHandler<HTMLDivElement>;
} => {
  const startRef = React.useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = React.useCallback<React.TouchEventHandler<HTMLDivElement>>((event) => {
    const touch = event.touches[0];
    startRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = React.useCallback<React.TouchEventHandler<HTMLDivElement>>(
    (event) => {
      if (!startRef.current) {
        return;
      }
      const touch = event.changedTouches[0];
      const dx = touch.clientX - startRef.current.x;
      const dy = touch.clientY - startRef.current.y;
      const duration = Date.now() - startRef.current.time;
      startRef.current = null;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (duration > 450 && absX < 16 && absY < 16 && availability.double) {
        onGesture("double");
        navigator?.vibrate?.(20);
        return;
      }

      if (absY > absX && dy < -48 && availability.hit) {
        onGesture("hit");
        navigator?.vibrate?.(12);
        return;
      }

      if (absX > absY && dx > 48 && availability.stand) {
        onGesture("stand");
        navigator?.vibrate?.(12);
      }
    },
    [availability.double, availability.hit, availability.stand, onGesture],
  );

  return { onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd };
};

export const PlayerArea: React.FC<PlayerAreaProps> = ({
  seat,
  activeHandId,
  phase,
  activeChip,
  onPlaceBet,
  onRemoveChip,
  chipStack,
  availability,
  onGesture,
}) => {
  const hands = seat?.hands ?? [];
  const hasHands = hands.length > 0;
  const gestureHandlers = useTouchGestures(onGesture, availability);
  const betAmount = seat?.baseBet ?? 0;

  return (
    <section
      className="relative flex flex-col items-center gap-6 text-center"
      aria-label="Player area"
      {...gestureHandlers}
    >
      <div className="flex items-center gap-3 text-[var(--text-lo)]">
        <span className="rounded-full border border-[rgba(216,182,76,0.35)] bg-[rgba(12,33,25,0.6)] px-4 py-1 text-[11px] uppercase tracking-[0.28em] text-[var(--text-hi)]">
          Player
        </span>
        <span className="rounded-full bg-[rgba(216,182,76,0.1)] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[var(--text-lo)]">
          Chip {activeChip}
        </span>
      </div>

      <div className={cn("flex w-full flex-wrap justify-center", HAND_GAP)}>
        {hasHands ? (
          hands.map((hand, index) => {
            const isActive = hand.id === activeHandId;
            const status = handStatus(hand);
            return (
              <div
                key={hand.id}
                className={cn(
                  "relative flex min-w-[180px] flex-col items-center gap-3 rounded-3xl border border-transparent px-3 py-4 transition",
                  isActive && "-translate-y-1 shadow-[var(--glow)]",
                )}
              >
                <div className={cn("flex items-end justify-center gap-3", hand.cards.length > 4 && "flex-wrap")}
                     aria-label={`Hand ${index + 1}`}>
                  {hand.cards.map((card, cardIndex) => (
                    <PlayingCard key={`${hand.id}-${cardIndex}`} rank={card.rank} suit={card.suit} />
                  ))}
                </div>
                <div className="flex flex-col items-center gap-1 text-[var(--text-hi)]">
                  <span className="text-sm font-semibold tracking-[0.2em]">{renderTotals(hand)}</span>
                  {status && (
                    <span className="rounded-full bg-[rgba(216,182,76,0.12)] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-[var(--text-hi)]">
                      {status}
                    </span>
                  )}
                  <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-lo)]">
                    Bet {formatCurrency(hand.bet)}
                  </span>
                  {hand.insuranceBet !== undefined && hand.insuranceBet > 0 && (
                    <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
                      Insurance {formatCurrency(hand.insuranceBet)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex h-[160px] w-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[rgba(216,182,76,0.25)] bg-[rgba(12,33,25,0.35)] text-[var(--text-lo)]">
            <span className="text-[12px] uppercase tracking-[0.3em]">Place your bet to start</span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => onPlaceBet(activeChip)}
          onContextMenu={(event) => {
            event.preventDefault();
            onRemoveChip();
          }}
          className={cn(
            "relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-[rgba(216,182,76,0.4)] bg-[rgba(12,31,24,0.75)] text-center text-[12px] uppercase tracking-[0.3em] text-[var(--text-hi)] transition",
            phase !== "betting" && "opacity-50",
          )}
          disabled={phase !== "betting"}
        >
          <div className="flex flex-col items-center gap-1">
            <span>Bet</span>
            <span className="text-base font-semibold tracking-[0.18em]">{formatCurrency(betAmount)}</span>
          </div>
        </button>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-[var(--text-lo)]">
          <span>Chips</span>
          <div className="flex gap-1">
            {chipStack.slice(-5).map((value, index) => (
              <div
                key={`${value}-${index}`}
                className="h-5 w-5 rounded-full border border-[rgba(216,182,76,0.3)] bg-[rgba(30,58,47,0.85)] text-[10px] text-[var(--text-hi)]"
              >
                {value}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
