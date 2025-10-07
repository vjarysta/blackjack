import React from "react";
import { Icon } from "@iconify/react";

interface NoirPlayingCardProps {
  rank: string;
  suit: string;
  faceDown?: boolean;
  motion?: "deal" | "flip";
}

const SUIT_META: Record<string, { icon: string; color: string; label: string }> = {
  "♠": { icon: "game-icons:spades", color: "#0f172a", label: "spades" },
  "♣": { icon: "game-icons:clubs", color: "#111827", label: "clubs" },
  "♥": { icon: "game-icons:hearts", color: "#b91c1c", label: "hearts" },
  "♦": { icon: "game-icons:diamonds", color: "#b91c1c", label: "diamonds" }
};

const rankDisplay = (rank: string): string => {
  if (rank === "10") {
    return "10";
  }
  return rank.toUpperCase();
};

export const NoirPlayingCard: React.FC<NoirPlayingCardProps> = ({ rank, suit, faceDown = false, motion }) => {
  if (faceDown) {
    return <div className="nj-card nj-card-face-down" data-motion={motion ?? undefined} aria-label="Face down card" />;
  }

  const suitMeta = SUIT_META[suit] ?? SUIT_META["♠"];
  const displayRank = rankDisplay(rank);

  return (
    <div className="nj-card" data-motion={motion ?? undefined} aria-label={`${displayRank} of ${suitMeta.label}`}>
      <div className="nj-card-rank" style={{ color: suitMeta.color }}>
        {displayRank}
      </div>
      <div className="nj-card-rank nj-card-rank--bottom" style={{ color: suitMeta.color }}>
        {displayRank}
      </div>
      <div className="nj-card-suit">
        <Icon icon={suitMeta.icon} width={36} height={36} color={suitMeta.color} />
      </div>
    </div>
  );
};
