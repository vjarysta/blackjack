import React from "react";
import type { Card } from "../engine/types";
import { PlayingCard } from "../components/table/PlayingCard";
import { scaleForCardWidth } from "./useCardMetrics";

interface ScaledCardProps {
  card: Card;
  faceDown?: boolean;
  width: number;
  height: number;
}

export const ScaledCard: React.FC<ScaledCardProps> = ({ card, faceDown = false, width, height }) => {
  const scale = scaleForCardWidth(width);
  return (
    <div style={{ width, height }} className="pointer-events-none">
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <PlayingCard rank={card.rank} suit={card.suit} faceDown={faceDown} />
      </div>
    </div>
  );
};
