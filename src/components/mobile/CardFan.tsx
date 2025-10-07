import React from "react";
import type { Card } from "../../engine/types";
import { PlayingCard } from "../table/PlayingCard";
import { useCardMetrics } from "./hooks";

const BASE_CARD_WIDTH = 92;
const BASE_CARD_HEIGHT = 132;

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

export const CardFan: React.FC<CardFanProps> = ({ cards, faceDownIndexes, containerWidth }) => {
  const metrics = useCardMetrics(containerWidth);
  const overlapBase = Math.max(12, Math.round(metrics.width * (cards.length > 5 ? 0.28 : 0.35)));
  const totalWidth = metrics.width + (cards.length - 1) * (metrics.width - overlapBase);
  const effectiveWidth = containerWidth > 0 ? Math.min(totalWidth, containerWidth) : totalWidth;
  const shrinkRatio = totalWidth > effectiveWidth ? effectiveWidth / totalWidth : 1;
  const width = Math.round(metrics.width * shrinkRatio);
  const scale = width / BASE_CARD_WIDTH;
  const height = Math.round(BASE_CARD_HEIGHT * scale);
  const overlap = Math.max(12, Math.round(overlapBase * shrinkRatio));
  const faceDown = React.useMemo(() => toSet(faceDownIndexes), [faceDownIndexes]);

  return (
    <div className="flex items-end justify-center" style={{ height }}>
      {cards.map((card, index) => {
        const isFirst = index === 0;
        return (
          <div
            key={`${card.rank}-${card.suit}-${index}`}
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
              style={{ transform: `scale(${width / BASE_CARD_WIDTH})`, transformOrigin: "top left" }}
            >
              <PlayingCard rank={card.rank} suit={card.suit} faceDown={faceDown.has(index)} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
