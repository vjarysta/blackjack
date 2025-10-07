import React from "react";
import type { Card } from "../../engine/types";
import { NoirJackCard } from "./Card";
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

export const NoirJackCardFan: React.FC<CardFanProps> = ({ cards, faceDownIndexes, containerWidth }) => {
  const metrics = useCardMetrics(containerWidth);
  const overlapBase = Math.max(12, Math.round(metrics.width * (cards.length > 5 ? 0.28 : 0.35)));
  const totalWidth = metrics.width + (cards.length - 1) * (metrics.width - overlapBase);
  const effectiveWidth = containerWidth > 0 ? Math.min(totalWidth, containerWidth) : totalWidth;
  const shrinkRatio = totalWidth > effectiveWidth ? effectiveWidth / totalWidth : 1;
  const width = Math.round(metrics.width * shrinkRatio);
  const height = Math.round(metrics.height * shrinkRatio);
  const overlap = Math.max(12, Math.round(overlapBase * shrinkRatio));
  const stackWidth = width + (cards.length - 1) * (width - overlap);
  const baseContainer = containerWidth > 0 ? containerWidth : stackWidth;
  const startX = (baseContainer - stackWidth) / 2;
  const faceDown = React.useMemo(() => toSet(faceDownIndexes), [faceDownIndexes]);

  return (
    <div className="relative" style={{ height, width: containerWidth || stackWidth }}>
      {cards.map((card, index) => {
        const left = startX + index * (width - overlap);
        const rotation = (index - (cards.length - 1) / 2) * 2.4;
        return (
          <div
            key={`${card.rank}-${card.suit}-${index}`}
            className="absolute top-0"
            style={{
              width,
              height,
              left,
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "center bottom",
              zIndex: index + 1
            }}
          >
            <NoirJackCard card={card} faceDown={faceDown.has(index)} width={width} height={height} index={index} />
          </div>
        );
      })}
    </div>
  );
};
