import React from "react";
import type { Card } from "../../engine/types";
import { NoirCard } from "./NoirCard";
import { useCardMetrics, useResizeObserver } from "../mobile/hooks";
import { cn } from "../../utils/cn";

interface NoirCardFanProps {
  cards: Card[];
  faceDownIndexes?: number[];
  className?: string;
}

const toSet = (indexes?: number[]): Set<number> => {
  if (!indexes || indexes.length === 0) {
    return new Set();
  }
  return new Set(indexes);
};

export const NoirCardFan: React.FC<NoirCardFanProps> = ({ cards, faceDownIndexes, className }) => {
  const [ref, width] = useResizeObserver<HTMLDivElement>();
  const metrics = useCardMetrics(width);
  const faceDown = React.useMemo(() => toSet(faceDownIndexes), [faceDownIndexes]);
  const seenRef = React.useRef<Set<string>>(new Set());

  const overlapBase = Math.max(16, Math.round(metrics.width * (cards.length > 5 ? 0.26 : 0.34)));
  const totalWidth = metrics.width + (cards.length - 1) * (metrics.width - overlapBase);
  const effectiveWidth = width > 0 ? Math.min(totalWidth, width) : totalWidth;
  const shrinkRatio = totalWidth > 0 ? Math.min(1, effectiveWidth / totalWidth) : 1;
  const cardWidth = Math.round(metrics.width * shrinkRatio);
  const cardHeight = Math.round(metrics.height * shrinkRatio);
  const overlap = Math.max(12, Math.round(overlapBase * shrinkRatio));

  const animationKeys = React.useMemo(() => {
    const map = new Map<number, string>();
    const nextSeen = new Set<string>();
    cards.forEach((card, index) => {
      const key = `${index}-${card.rank}-${card.suit}`;
      nextSeen.add(key);
      if (!seenRef.current.has(key)) {
        map.set(index, `${key}-${Date.now()}`);
      }
    });
    seenRef.current = nextSeen;
    return map;
  }, [cards]);

  return (
    <div ref={ref} className={cn("nj-card-fan", className)} style={{ height: cardHeight }}>
      {cards.map((card, index) => {
        const isFirst = index === 0;
        const animateKey = animationKeys.get(index);
        return (
          <div
            key={`${card.rank}-${card.suit}-${index}`}
            className="nj-card-fan__item"
            style={{
              width: cardWidth,
              height: cardHeight,
              marginLeft: isFirst ? 0 : -overlap,
              zIndex: index + 1
            }}
          >
            <NoirCard card={card} faceDown={faceDown.has(index)} animateKey={animateKey} />
          </div>
        );
      })}
    </div>
  );
};
