import React from "react";
import type { Hand, Phase, Seat } from "../../../engine/types";
import { getHandTotals, isBust } from "../../../engine/totals";
import { AnimatedCard } from "../../../components/animation/AnimatedCard";
import { PlayingCard } from "../../../components/table/PlayingCard";
import { DEAL_STAGGER } from "../../../utils/animConstants";
import { formatCurrency } from "../../../utils/currency";

interface GestureHandlers {
  onHit?: () => void;
  onStand?: () => void;
  onDouble?: () => void;
}

interface PlayerAreaProps {
  seat: Seat;
  activeHandId: string | null;
  phase: Phase;
  minBet: number;
  bankroll: number;
  availableActions: Set<string>;
  onSit: () => void;
  onLeave: () => void;
  gestureHandlers: GestureHandlers;
}

const CARD_WIDTH = 92;
const CARD_GAP = 18;

const PlayerHand: React.FC<{ hand: Hand; active: boolean; index: number }> = ({ hand, active, index }) => {
  const totals = getHandTotals(hand);
  const labels: string[] = [];
  if (hand.isBlackjack) labels.push("Blackjack");
  if (hand.isDoubled) labels.push("Doubled");
  if (hand.isSurrendered) labels.push("Surrendered");
  if (hand.isSplitHand) labels.push("Split");
  if (isBust(hand)) labels.push("Bust");

  return (
    <div
      key={hand.id}
      className="solo-player-hand relative flex min-w-[220px] flex-col items-center gap-3 rounded-2xl border border-[rgba(216,182,76,0.18)] bg-[rgba(15,38,30,0.85)] px-4 py-4 transition-transform"
      data-active={active}
      style={{ borderColor: active ? "rgba(216,182,76,0.45)" : "rgba(216,182,76,0.18)" }}
    >
      <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.35em] text-[var(--text-lo)]">
        <span>Main {index + 1}</span>
        <span className="rounded-full bg-[rgba(216,182,76,0.12)] px-3 py-1 text-[var(--text-hi)]">
          {formatCurrency(hand.bet)}
        </span>
      </div>
      <div className="relative flex h-[150px] w-full items-center justify-center">
        {hand.cards.map((card, cardIndex) => (
          <AnimatedCard
            key={`${hand.id}-${cardIndex}`}
            id={`${hand.id}-${cardIndex}`}
            from={{ x: -60 + cardIndex * 8, y: 140 }}
            to={{ x: cardIndex * (CARD_WIDTH + CARD_GAP) - ((hand.cards.length - 1) * (CARD_WIDTH + CARD_GAP)) / 2, y: 0 }}
            rotation={cardIndex * 4 - 6}
            delay={cardIndex * DEAL_STAGGER}
            z={cardIndex}
          >
            <PlayingCard rank={card.rank} suit={card.suit} />
          </AnimatedCard>
        ))}
      </div>
      <div className="flex flex-col items-center gap-1 text-xs uppercase tracking-[0.4em] text-[var(--text-hi)]">
        {totals.soft && totals.soft !== totals.hard ? (
          <span>
            Total {totals.hard} / {totals.soft}
          </span>
        ) : (
          <span>Total {totals.hard}</span>
        )}
        <div className="flex flex-wrap justify-center gap-2 text-[10px] font-semibold">
          {labels.map((label) => (
            <span key={label} className="rounded-full bg-[rgba(216,182,76,0.14)] px-2 py-1">
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export const PlayerArea: React.FC<PlayerAreaProps> = ({
  seat,
  activeHandId,
  phase,
  minBet,
  bankroll,
  availableActions,
  onSit,
  onLeave,
  gestureHandlers
}) => {
  const hands = seat.hands;
  const isBetting = phase === "betting";
  const isActionPhase = phase === "playerActions";
  const showHands = hands.length > 0;

  const gestureAllowed = isActionPhase && availableActions.has("hit");
  const touchRef = React.useRef<{ x: number; y: number; time: number; timeout?: number | null; longPress?: boolean } | null>(null);

  React.useEffect(() => () => {
    if (touchRef.current?.timeout) {
      window.clearTimeout(touchRef.current.timeout);
    }
  }, []);

  const trigger = (callback?: () => void) => {
    if (!callback) return;
    callback();
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate?.(20);
      } catch {
        // ignore
      }
    }
  };

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (event) => {
    if (!gestureAllowed) return;
    const touch = event.touches[0];
    const data = { x: touch.clientX, y: touch.clientY, time: Date.now(), timeout: null as number | null, longPress: false };
    if (gestureHandlers.onDouble) {
      data.timeout = window.setTimeout(() => {
        data.longPress = true;
        trigger(gestureHandlers.onDouble);
      }, 650);
    }
    touchRef.current = data;
  };

  const handleTouchMove: React.TouchEventHandler<HTMLDivElement> = (event) => {
    if (!gestureAllowed) return;
    const ref = touchRef.current;
    if (!ref) return;
    const touch = event.touches[0];
    const dx = Math.abs(touch.clientX - ref.x);
    const dy = Math.abs(touch.clientY - ref.y);
    if (dx > 30 || dy > 30) {
      if (ref.timeout) {
        window.clearTimeout(ref.timeout);
        ref.timeout = null;
      }
    }
  };

  const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = (event) => {
    if (!gestureAllowed) return;
    const ref = touchRef.current;
    if (!ref) return;
    if (ref.timeout) {
      window.clearTimeout(ref.timeout);
    }
    const touch = event.changedTouches[0];
    const dx = touch.clientX - ref.x;
    const dy = touch.clientY - ref.y;
    const duration = Date.now() - ref.time;
    if (ref.longPress) {
      touchRef.current = null;
      return;
    }
    if (Math.abs(dy) > Math.abs(dx) && dy < -50) {
      trigger(gestureHandlers.onHit);
    } else if (dx > 60) {
      trigger(gestureHandlers.onStand);
    } else if (duration < 300 && Math.abs(dx) < 30 && Math.abs(dy) < 30) {
      trigger(gestureHandlers.onHit);
    }
    touchRef.current = null;
  };

  return (
    <section
      className="flex w-full flex-col items-center gap-4"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex w-full max-w-3xl items-center justify-between px-2">
        <div>
          <span className="text-xs uppercase tracking-[0.4em] text-[var(--text-lo)]">Vous</span>
          <h2 className="text-2xl font-semibold text-[var(--text-hi)]">Main du joueur</h2>
        </div>
        {seat.occupied ? (
          <button type="button" className="solo-control solo-secondary h-10 px-4 text-[11px]" onClick={onLeave}>
            Quitter
          </button>
        ) : null}
      </div>
      <div className="solo-surface flex w-full max-w-3xl flex-col items-center gap-5 px-6 py-6">
        {!seat.occupied && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-[var(--text-lo)]">Une seule place disponible</p>
            <button type="button" className="solo-control solo-primary" onClick={onSit}>
              Prendre le siège
            </button>
          </div>
        )}
        {seat.occupied && !showHands && (
          <div className="flex flex-col items-center gap-2 text-center text-sm text-[var(--text-lo)]">
            <p className="uppercase tracking-[0.35em]">Placez votre mise</p>
            <p className="text-xs text-[rgba(168,179,167,0.75)]">Minimum {formatCurrency(minBet)} · Bankroll {formatCurrency(bankroll)}</p>
          </div>
        )}
        {seat.occupied && showHands && (
          <div
            className="flex w-full flex-wrap items-start justify-center gap-4 md:flex-nowrap"
            style={{ gap: "20px" }}
          >
            {hands.map((hand, index) => (
              <PlayerHand key={hand.id} hand={hand} index={index} active={hand.id === activeHandId} />
            ))}
          </div>
        )}
      </div>
      {isBetting && seat.baseBet > 0 && (
        <div className="rounded-full bg-[rgba(12,31,24,0.9)] px-4 py-1 text-xs uppercase tracking-[0.4em] text-[var(--text-hi)]">
          Mise actuelle {formatCurrency(seat.baseBet)}
        </div>
      )}
    </section>
  );
};
