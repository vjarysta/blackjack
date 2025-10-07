import React from "react";
import type { Card } from "../../engine/types";
import { Club, Diamond, Heart, Spade } from "lucide-react";

interface NoirJackCardProps {
  card: Card;
  faceDown?: boolean;
  width: number;
  height: number;
  index?: number;
}

const SUIT_META: Record<string, { Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; color: string }> = {
  "♠": { Icon: Spade, color: "#111827" },
  "♣": { Icon: Club, color: "#111827" },
  "♥": { Icon: Heart, color: "#b91c1c" },
  "♦": { Icon: Diamond, color: "#b91c1c" }
};

const rankDisplay = (rank: string): string => {
  if (rank === "10") {
    return rank;
  }
  return rank.toUpperCase();
};

export const NoirJackCard: React.FC<NoirJackCardProps> = ({ card, faceDown = false, width, height, index = 0 }) => {
  const meta = SUIT_META[card.suit] ?? SUIT_META["♠"];
  const displayRank = rankDisplay(card.rank);
  const shellStyle = React.useMemo(
    () => ({ width, height, "--deal-index": index } as React.CSSProperties),
    [width, height, index]
  );

  return (
    <div className="nj-card-shell" style={shellStyle} aria-hidden={false}>
      <div className={`nj-card ${faceDown ? "is-face-down" : "is-face-up"}`}>
        <div className="nj-card-side nj-card-face" aria-hidden={faceDown}>
          <div className="nj-card-rank" style={{ color: meta.color }}>
            <span>{displayRank}</span>
            <meta.Icon size={18} strokeWidth={1.6} />
          </div>
          <div className="nj-card-rank-bottom" style={{ color: meta.color }}>
            <span>{displayRank}</span>
            <meta.Icon size={18} strokeWidth={1.6} />
          </div>
          <div className="nj-card-suit" aria-hidden>
            <meta.Icon size={44} strokeWidth={1.3} color={meta.color} />
          </div>
        </div>
        <div className="nj-card-side nj-card-back" aria-hidden={!faceDown} />
      </div>
    </div>
  );
};
