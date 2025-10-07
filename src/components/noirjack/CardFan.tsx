import React from "react";
import type { Card } from "../../engine/types";
import { NoirPlayingCard } from "./NoirPlayingCard";
import { useCardMetrics } from "./hooks";

interface CardFanProps {
  cards: Card[];
  faceDownIndexes?: number[];
  containerWidth: number;
}

const toSet = (indexes?: number[]): Set<number> => {
  if (!indexes || indexes.length === 0) {
    return new Set();
  }
  return new Set(indexes);
};

const usePrevious = <T,>(value: T): T | undefined => {
  const ref = React.useRef<T>();
  React.useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

export const CardFan: React.FC<CardFanProps> = ({ cards, faceDownIndexes, containerWidth }) => {
  const metrics = useCardMetrics(containerWidth);
  const overlapBase = Math.max(12, Math.round(metrics.width * (cards.length > 5 ? 0.26 : 0.34)));
  const totalWidth = metrics.width + (cards.length - 1) * (metrics.width - overlapBase);
  const effectiveWidth = containerWidth > 0 ? Math.min(totalWidth, containerWidth) : totalWidth;
  const shrinkRatio = totalWidth > effectiveWidth ? effectiveWidth / totalWidth : 1;
  const width = Math.round(metrics.width * shrinkRatio);
  const height = Math.round(metrics.height * shrinkRatio);
  const overlap = Math.max(12, Math.round(overlapBase * shrinkRatio));
  const faceDown = React.useMemo(() => toSet(faceDownIndexes), [faceDownIndexes]);
  const previousCount = usePrevious(cards.length);
  const previousFaceDown = usePrevious(faceDown);

  return (
    <div className="flex items-end justify-center" style={{ height }}>
      {cards.map((card, index) => {
        const isFirst = index === 0;
        const key = `${card.rank}-${card.suit}-${index}`;
        const wasFaceDown = previousFaceDown ? previousFaceDown.has(index) : false;
        const isFaceDown = faceDown.has(index);
        let motion: "deal" | "flip" | undefined;
        if (previousCount !== undefined && cards.length > previousCount && index >= previousCount) {
          motion = "deal";
        } else if (wasFaceDown && !isFaceDown) {
          motion = "flip";
        }
        return (
          <div
            key={key}
            className="relative"
            style={{
              width,
              height,
              marginLeft: isFirst ? 0 : -overlap,
              zIndex: index + 1
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                transform: `scale(${width / metrics.width})`,
                transformOrigin: "top left"
              }}
            >
              <NoirPlayingCard rank={card.rank} suit={card.suit} faceDown={isFaceDown} motion={motion} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
