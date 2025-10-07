import React from "react";
import { palette } from "../../theme/palette";
import { defaultTableAnchors, getTableAnchorPoints, toPixels } from "./coords";
import type { GameState, Hand, Seat } from "../../engine/types";
import { getHandTotals, isBust } from "../../engine/totals";
import { formatCurrency } from "../../utils/currency";
import { PlayingCard } from "./PlayingCard";
import { Button } from "../ui/button";
import { AnimatedCard } from "../animation/AnimatedCard";
import { FlipCard } from "../animation/FlipCard";
import { DEAL_STAGGER } from "../../utils/animConstants";
import { filterSeatsForMode } from "../../ui/config";
import type { CoachMode } from "../../store/useGameStore";
import type { CoachFeedback } from "../hud/RoundActionBar";

interface CardLayerProps {
  game: GameState;
  dimensions: { width: number; height: number };
  onInsurance: (seatIndex: number, handId: string, amount: number) => void;
  onDeclineInsurance: (seatIndex: number, handId: string) => void;
  coachMode: CoachMode;
  onCoachFeedback: (feedback: CoachFeedback) => void;
}

interface SeatClusterSize {
  width: number;
  height: number;
}

interface SeatClusterLayout {
  seat: Seat;
  orientation: "up" | "down";
  direction: { x: number; y: number };
  position: { x: number; y: number };
  size: SeatClusterSize;
}

const MIN_CLUSTER_GAP = 24;
const SHIFT_LIMIT_BASE = 140;
const CARD_WIDTH = 92;
const CARD_HEIGHT = 132;
const CARD_GAP = 12;
const DEALER_GAP = 16;
const CARD_STEP = CARD_WIDTH + CARD_GAP;
const HAND_VERTICAL_FALLBACK_STEP = CARD_HEIGHT + 60;

const normalizeVector = (vector: { x: number; y: number }): { x: number; y: number } => {
  const magnitude = Math.hypot(vector.x, vector.y);
  if (!Number.isFinite(magnitude) || magnitude === 0) {
    return { x: 0, y: -1 };
  }
  return { x: vector.x / magnitude, y: vector.y / magnitude };
};

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const rotationForIndex = (index: number): number => {
  const pattern = [-6, -3, 0, 3, 6];
  if (index < pattern.length) {
    return pattern[index];
  }
  return index % 2 === 0 ? 4 : -4;
};

const renderHandBadges = (hand: Hand): React.ReactNode => {
  const badges: string[] = [];
  if (hand.isBlackjack) badges.push("Blackjack");
  if (hand.isDoubled) badges.push("Doubled");
  if (hand.isSurrendered) badges.push("Surrendered");
  if (hand.isSplitHand) badges.push("Split");
  if (hand.hasActed) badges.push("Acted");
  if (isBust(hand)) badges.push("Bust");
  if (badges.length === 0) {
    return null;
  }
  return (
    <div
      className="player-hand__badges flex flex-wrap justify-center gap-2 text-[12px] uppercase tracking-[0.25em]"
      style={{ color: palette.subtleText }}
    >
      {badges.map((badge) => (
        <span key={badge} className="rounded-full bg-[#123428]/75 px-2 py-1 font-semibold">
          {badge}
        </span>
      ))}
    </div>
  );
};

const renderInsurancePrompt = (
  seat: Seat,
  hand: Hand,
  game: GameState,
  onInsurance: CardLayerProps["onInsurance"],
  onDeclineInsurance: CardLayerProps["onDeclineInsurance"],
  coachMode: CoachMode,
  onCoachFeedback: CardLayerProps["onCoachFeedback"]
): React.ReactNode => {
  const alreadyResolved = hand.insuranceBet !== undefined;
  if (!seat.occupied || game.phase !== "insurance" || alreadyResolved || hand.isResolved) {
    return null;
  }
  const maxInsurance = Math.floor(hand.bet / 2);
  const cappedAmount = Math.min(maxInsurance, Math.floor(game.bankroll));
  const disabled = cappedAmount <= 0;
  const liveHighlight = coachMode === "live";

  const pushInsuranceFeedback = (tone: CoachFeedback["tone"]) => {
    if (coachMode !== "feedback") {
      return;
    }
    const text =
      tone === "correct"
        ? "Nice! Skipping insurance was the right call."
        : "Mistake: should have skipped insurance.";
    onCoachFeedback({ tone, message: text, highlightAction: "insurance-skip" });
  };

  const handleTakeInsurance = () => {
    onInsurance(seat.index, hand.id, cappedAmount);
    pushInsuranceFeedback("better");
  };

  const handleSkipInsurance = () => {
    onDeclineInsurance(seat.index, hand.id);
    pushInsuranceFeedback("correct");
  };

  return (
    <div
      key={hand.id}
      className="pointer-events-auto flex w-max min-w-[180px] flex-col items-center gap-2 rounded-lg border border-[#c8a24a]/60 bg-[#0d3024]/95 px-3 py-2 text-xs shadow-lg"
    >
      <p className="font-semibold tracking-wide" style={{ color: palette.gold }}>
        Insurance?
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 px-3 text-[11px] font-semibold uppercase tracking-[0.3em]"
          onClick={handleTakeInsurance}
          disabled={disabled}
        >
          Take {formatCurrency(cappedAmount)}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-3 text-[11px] font-semibold uppercase tracking-[0.3em]"
          data-coach={liveHighlight ? "best" : undefined}
          onClick={handleSkipInsurance}
          title="Coach hint: Skip insurance"
        >
          Skip
        </Button>
      </div>
    </div>
  );
};

interface MutableCluster extends SeatClusterLayout {
  basePosition: { x: number; y: number };
  minX: number;
  maxX: number;
}

const resolveSeatLayouts = (
  seats: Seat[],
  dimensions: { width: number; height: number },
  clusterSizes: Record<number, SeatClusterSize>
): SeatClusterLayout[] => {
  const scaleX = dimensions.width / defaultTableAnchors.viewBox.width;
  const scaleY = dimensions.height / defaultTableAnchors.viewBox.height;
  const averageScale = (scaleX + scaleY) / 2;
  const seatRadiusPx = defaultTableAnchors.seatRadius * scaleX;
  const center = toPixels(defaultTableAnchors.seatArc.cx, defaultTableAnchors.seatArc.cy, dimensions);
  const fallbackSize: SeatClusterSize = {
    width: 220 * scaleX,
    height: 220 * scaleY
  };
  const shiftLimit = SHIFT_LIMIT_BASE * averageScale;
  const boundaryPadding = 40 * averageScale;
  const clusters: MutableCluster[] = seats
    .filter((seat) => seat.occupied || seat.baseBet > 0 || seat.hands.length > 0)
    .map((seat) => {
      const anchor = defaultTableAnchors.seats[seat.index];
      const seatPosition = toPixels(anchor.x, anchor.y, dimensions);
      const direction = normalizeVector({
        x: center.x - seatPosition.x,
        y: center.y - seatPosition.y
      });
      const orientation: "up" | "down" = direction.y < 0 ? "up" : "down";
      const offset = seatRadiusPx + (orientation === "up" ? 120 * averageScale : 96 * averageScale);
      const basePosition = {
        x: seatPosition.x + direction.x * offset,
        y: seatPosition.y + direction.y * offset
      };
      const size = clusterSizes[seat.index] ?? fallbackSize;
      const minBoundary = size.width / 2 + boundaryPadding;
      const maxBoundary = dimensions.width - size.width / 2 - boundaryPadding;
      return {
        seat,
        orientation,
        direction,
        position: { ...basePosition },
        size,
        basePosition,
        minX: Math.max(basePosition.x - shiftLimit, minBoundary),
        maxX: Math.min(basePosition.x + shiftLimit, maxBoundary)
      };
    });

  const grouped = new Map<"up" | "down", MutableCluster[]>();
  clusters.forEach((cluster) => {
    const key = cluster.orientation;
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(cluster);
    } else {
      grouped.set(key, [cluster]);
    }
  });

  const gap = MIN_CLUSTER_GAP * averageScale;
  grouped.forEach((group) => {
    group.sort((a, b) => a.basePosition.x - b.basePosition.x);
    for (let index = 1; index < group.length; index += 1) {
      const previous = group[index - 1];
      const current = group[index];
      const minX = previous.position.x + previous.size.width / 2 + current.size.width / 2 + gap;
      if (current.position.x < minX) {
        current.position.x = Math.max(minX, current.minX);
      }
    }
    for (let index = group.length - 2; index >= 0; index -= 1) {
      const next = group[index + 1];
      const current = group[index];
      const maxX = next.position.x - next.size.width / 2 - current.size.width / 2 - gap;
      if (current.position.x > maxX) {
        current.position.x = Math.min(maxX, current.maxX);
      }
    }
    for (let index = 1; index < group.length; index += 1) {
      const previous = group[index - 1];
      const current = group[index];
      const minX = previous.position.x + previous.size.width / 2 + current.size.width / 2 + gap;
      if (current.position.x < minX) {
        current.position.x = minX;
      }
    }
    group.forEach((cluster) => {
      cluster.position.x = clamp(cluster.position.x, cluster.minX, cluster.maxX);
    });
  });

  return clusters.map(({ seat, orientation, direction, position, size }) => ({
    seat,
    orientation,
    direction,
    position,
    size
  }));
};

export const CardLayer: React.FC<CardLayerProps> = ({
  game,
  dimensions,
  onInsurance,
  onDeclineInsurance,
  coachMode,
  onCoachFeedback
}) => {
  const clusterRefs = React.useRef(new Map<number, HTMLDivElement | null>());
  const clusterRefCallbacks = React.useRef(new Map<number, (node: HTMLDivElement | null) => void>());
  const [clusterSizes, setClusterSizes] = React.useState<Record<number, SeatClusterSize>>({});
  const handRefs = React.useRef(new Map<string, HTMLDivElement | null>());
  const handRefCallbacks = React.useRef(new Map<string, (node: HTMLDivElement | null) => void>());
  const handSeatLookup = React.useRef(new Map<string, number>());
  const [handOffsets, setHandOffsets] = React.useState<Record<string, number>>({});
  const handMeasureFrame = React.useRef<number | null>(null);

  const queueHandMeasurement = React.useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (handMeasureFrame.current !== null) {
      window.cancelAnimationFrame(handMeasureFrame.current);
    }
    handMeasureFrame.current = window.requestAnimationFrame(() => {
      handMeasureFrame.current = null;
      const updates = new Map<string, number>();
      handRefs.current.forEach((node, handId) => {
        if (!node) {
          return;
        }
        const seatIndex = handSeatLookup.current.get(handId);
        if (seatIndex === undefined) {
          return;
        }
        const clusterNode = clusterRefs.current.get(seatIndex);
        if (!clusterNode) {
          return;
        }
        const clusterRect = clusterNode.getBoundingClientRect();
        const handRect = node.getBoundingClientRect();
        updates.set(handId, handRect.top - clusterRect.top);
      });
      if (updates.size === 0) {
        return;
      }
      setHandOffsets((previous) => {
        let changed = false;
        const next = { ...previous };
        updates.forEach((offset, handId) => {
          if (!(handId in previous) || Math.abs(previous[handId] - offset) > 0.5) {
            next[handId] = offset;
            changed = true;
          }
        });
        return changed ? next : previous;
      });
    });
  }, []);

  React.useEffect(() => {
    return () => {
      if (handMeasureFrame.current !== null && typeof window !== "undefined") {
        window.cancelAnimationFrame(handMeasureFrame.current);
      }
    };
  }, []);

  const getClusterRef = React.useCallback(
    (seatIndex: number) => {
      if (!clusterRefCallbacks.current.has(seatIndex)) {
        clusterRefCallbacks.current.set(seatIndex, (node: HTMLDivElement | null) => {
          if (node) {
            clusterRefs.current.set(seatIndex, node);
            const rect = node.getBoundingClientRect();
            setClusterSizes((previous) => {
              const nextSize = { width: rect.width, height: rect.height };
              const existing = previous[seatIndex];
              if (
                existing &&
                Math.abs(existing.width - nextSize.width) < 0.5 &&
                Math.abs(existing.height - nextSize.height) < 0.5
              ) {
                return previous;
              }
              return { ...previous, [seatIndex]: nextSize };
            });
            queueHandMeasurement();
          } else {
            clusterRefs.current.delete(seatIndex);
            setClusterSizes((previous) => {
              if (!(seatIndex in previous)) {
                return previous;
              }
              const next = { ...previous };
              delete next[seatIndex];
              return next;
            });
            queueHandMeasurement();
          }
        });
      }
      return clusterRefCallbacks.current.get(seatIndex)!;
    },
    [queueHandMeasurement]
  );

  const seatsForMode = React.useMemo(() => filterSeatsForMode(game.seats), [game.seats]);

  const seatLayouts = React.useMemo(
    () => resolveSeatLayouts(seatsForMode, dimensions, clusterSizes),
    [seatsForMode, dimensions, clusterSizes]
  );

  const anchorPoints = React.useMemo(() => getTableAnchorPoints(dimensions), [dimensions]);
  const shoeOrigin = React.useMemo(
    () => ({ x: anchorPoints.shoe.x - CARD_WIDTH / 2, y: anchorPoints.shoe.y - CARD_HEIGHT / 2 }),
    [anchorPoints]
  );

  const layoutSignature = React.useMemo(
    () => seatLayouts.map((layout) => layout.seat.index).join("-"),
    [seatLayouts]
  );

  React.useLayoutEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const observers: ResizeObserver[] = [];
    clusterRefs.current.forEach((node, seatIndex) => {
      if (!node) {
        return;
      }
      const observer = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        setClusterSizes((previous) => {
          const existing = previous[seatIndex];
          if (existing && Math.abs(existing.width - width) < 0.5 && Math.abs(existing.height - height) < 0.5) {
            return previous;
          }
          return { ...previous, [seatIndex]: { width, height } };
        });
        queueHandMeasurement();
      });
      observer.observe(node);
      observers.push(observer);
    });
    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [layoutSignature, queueHandMeasurement]);

  const getHandRef = React.useCallback(
    (handId: string, seatIndex: number) => {
      if (!handRefCallbacks.current.has(handId)) {
        handRefCallbacks.current.set(handId, (node: HTMLDivElement | null) => {
          if (node) {
            handRefs.current.set(handId, node);
          } else {
            handRefs.current.delete(handId);
            handSeatLookup.current.delete(handId);
            setHandOffsets((previous) => {
              if (!(handId in previous)) {
                return previous;
              }
              const next = { ...previous };
              delete next[handId];
              return next;
            });
            handRefCallbacks.current.delete(handId);
          }
          queueHandMeasurement();
        });
      }
      const previousSeat = handSeatLookup.current.get(handId);
      handSeatLookup.current.set(handId, seatIndex);
      if (previousSeat !== seatIndex) {
        queueHandMeasurement();
      }
      return handRefCallbacks.current.get(handId)!;
    },
    [queueHandMeasurement]
  );

  const handsSignature = React.useMemo(
    () =>
      seatsForMode
        .map((seat) =>
          seat.hands
            .map((hand) =>
              [
                hand.id,
                hand.cards.length,
                hand.bet,
                hand.insuranceBet ?? "none",
                hand.isSplitHand ? 1 : 0,
                hand.isDoubled ? 1 : 0,
                hand.isSurrendered ? 1 : 0,
                hand.isBlackjack ? 1 : 0,
                hand.hasActed ? 1 : 0
              ].join(":")
            )
            .join("|")
        )
        .join("||"),
    [seatsForMode]
  );

  React.useLayoutEffect(() => {
    queueHandMeasurement();
  }, [queueHandMeasurement, handsSignature, seatLayouts, dimensions.height, dimensions.width]);

  const revealHole =
    game.phase === "dealerPlay" || game.phase === "settlement" || game.dealer.hand.isBlackjack;
  const dealerCards = game.dealer.hand.cards;
  const dealerAnchor = defaultTableAnchors.dealerArea;
  const dealerPosition = toPixels(
    dealerAnchor.x + dealerAnchor.width / 2,
    dealerAnchor.y + dealerAnchor.height / 2,
    dimensions
  );
  const dealerBoxSize = {
    width: (dealerAnchor.width / defaultTableAnchors.viewBox.width) * dimensions.width,
    height: (dealerAnchor.height / defaultTableAnchors.viewBox.height) * dimensions.height
  };

  const dealerTotals = getHandTotals(game.dealer.hand);
  const cardElements: React.ReactNode[] = [];
  let dealerPlaceholderWidth = CARD_WIDTH;
  const dealerCardCount = dealerCards.length;
  if (dealerCardCount > 0) {
    const dealerWidth = CARD_WIDTH + (dealerCardCount - 1) * (CARD_WIDTH + DEALER_GAP);
    dealerPlaceholderWidth = dealerWidth;
    const dealerStartX = dealerPosition.x - dealerWidth / 2;
    const dealerTop = dealerPosition.y - dealerBoxSize.height / 2 + 8;
    dealerCards.forEach((card, index) => {
      const toX = dealerStartX + index * (CARD_WIDTH + DEALER_GAP);
      const toY = dealerTop;
      const rotation = rotationForIndex(index);
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
      cardElements.push(
        <AnimatedCard
          key={`dealer-${index}`}
          id={`dealer-${index}`}
          from={shoeOrigin}
          to={{ x: toX, y: toY }}
          rotation={rotation}
          delay={index * DEAL_STAGGER}
          z={index}
        >
          {content}
        </AnimatedCard>
      );
    });
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-30 text-[13px]" style={{ color: palette.text }}>
      <div className="pointer-events-none absolute inset-0">{cardElements}</div>
      <div
        className="dealer-area"
        style={{
          position: "absolute",
          left: dealerPosition.x,
          top: dealerPosition.y,
          width: dealerBoxSize.width,
          transform: "translate(-50%, -50%)"
        }}
      >
        <div aria-hidden className="dealer-area__cards" style={{ width: dealerPlaceholderWidth }}>
          <div className="dealer-area__placeholder" />
        </div>
        <div className="dealer-area__label rounded-full bg-[#0d3124]/80 px-4 py-1 text-xs uppercase tracking-[0.25em]">
          {revealHole
            ? dealerTotals.soft && dealerTotals.soft !== dealerTotals.hard
              ? `Dealer ${dealerTotals.hard} / ${dealerTotals.soft}`
              : `Dealer ${dealerTotals.hard}`
            : "Dealer showing"}
        </div>
      </div>

      {seatLayouts.map((layout) => {
        const { seat, orientation, position } = layout;
        const isActiveSeat = game.activeSeatIndex === seat.index;
        const hands = seat.hands.length > 0 ? seat.hands : [];
        const clusterTop = position.y - layout.size.height / 2;
        const readyBadge =
          hands.length === 0 && seat.baseBet > 0 ? (
            <span
              key="pending"
              className="rounded-full bg-[#0d3124]/75 px-4 py-1 text-sm uppercase tracking-[0.25em]"
            >
              Ready with {formatCurrency(seat.baseBet)}
            </span>
          ) : null;

        const handNodes = hands.map((hand, handIndex) => {
          const handTotals = getHandTotals(hand);
          const cardCount = hand.cards.length;
          const handOffsetX = handIndex * 18;
          const baseCenterX = position.x + handOffsetX;
          const totalStep = CARD_STEP;
          const startCenterX = baseCenterX - ((cardCount - 1) * totalStep) / 2;
          const cardRowWidth = CARD_WIDTH + (cardCount - 1) * totalStep;
          const measuredOffset = handOffsets[hand.id];
          const fallbackOffset = 12 + handIndex * HAND_VERTICAL_FALLBACK_STEP;
          const cardTop = clusterTop + (measuredOffset ?? fallbackOffset);

          hand.cards.forEach((card, cardIndex) => {
            const centerX = startCenterX + cardIndex * totalStep;
            const toX = centerX - CARD_WIDTH / 2;
            const toY = cardTop;
            const id = `${hand.id}-${cardIndex}`;
            cardElements.push(
              <AnimatedCard
                key={id}
                id={id}
                from={shoeOrigin}
                to={{ x: toX, y: toY }}
                rotation={rotationForIndex(cardIndex)}
                delay={cardIndex * DEAL_STAGGER}
                z={handIndex * 10 + cardIndex}
              >
                <PlayingCard rank={card.rank} suit={card.suit} />
              </AnimatedCard>
            );
          });

          return (
            <div
              key={hand.id}
              ref={getHandRef(hand.id, seat.index)}
              className="player-hand pointer-events-none"
            >
              <div
                aria-hidden
                className="player-hand__cards"
                style={{ transform: `translateX(${handOffsetX}px)` }}
              >
                <div className="player-hand__placeholder" style={{ width: cardRowWidth }} />
              </div>
              <div className="player-hand__meta">
                <div
                  className="rounded-full bg-[#0c2e23]/85 px-3 py-1 text-[13px] tracking-[0.25em]"
                  style={{ color: palette.text }}
                >
                  {handTotals.soft && handTotals.soft !== handTotals.hard
                    ? `Total ${handTotals.hard} / ${handTotals.soft}`
                    : `Total ${handTotals.hard}`}
                </div>
                <div className="text-[13px] tracking-[0.25em]" style={{ color: palette.subtleText }}>
                  Bet {formatCurrency(hand.bet)}
                </div>
                {hand.insuranceBet !== undefined && (
                  <div className="text-[12px] tracking-[0.25em]" style={{ color: palette.subtleText }}>
                    {hand.insuranceBet > 0
                      ? `Insurance ${formatCurrency(hand.insuranceBet)}`
                      : "Insurance declined"}
                  </div>
                )}
                {renderHandBadges(hand)}
              </div>
            </div>
          );
        });

        const promptElements = hands
          .map((hand) =>
            renderInsurancePrompt(seat, hand, game, onInsurance, onDeclineInsurance, coachMode, onCoachFeedback)
          )
          .filter(Boolean) as React.ReactNode[];

        const promptStack =
          promptElements.length > 0 ? (
            <div className="pointer-events-auto flex flex-col items-center gap-2">{promptElements}</div>
          ) : null;

        const clusterRef = getClusterRef(seat.index);
        const boxShadow = isActiveSeat
          ? "0 0 0 2px rgba(200, 162, 74, 0.65), 0 18px 45px rgba(0,0,0,0.45)"
          : "0 12px 35px rgba(0,0,0,0.35)";

        return (
          <div
            key={seat.index}
            className="absolute flex -translate-x-1/2 -translate-y-1/2"
            style={{ left: position.x, top: position.y }}
          >
            <div
              ref={clusterRef}
              className="pointer-events-none flex max-w-[280px] flex-col items-center gap-3 rounded-2xl px-4 py-3"
              style={{
                boxShadow,
                backgroundColor: "rgba(4, 24, 18, 0.65)",
                border: "1px solid rgba(21, 74, 58, 0.35)"
              }}
            >
              {orientation === "up" && promptStack}
              <div className="pointer-events-none flex flex-col items-center gap-3">
                {readyBadge}
                {handNodes}
              </div>
              {orientation === "down" && promptStack}
            </div>
          </div>
        );
      })}
    </div>
  );
};
