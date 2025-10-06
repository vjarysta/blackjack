import React from "react";
import { Icon } from "@iconify/react";
import { palette } from "../../theme/palette";

interface PlayingCardProps {
  rank: string;
  suit: string;
  faceDown?: boolean;
}

const SUIT_META: Record<string, { icon: string; color: string }> = {
  "♠": { icon: "game-icons:spades", color: palette.cardIndexBlack },
  "♣": { icon: "game-icons:clubs", color: palette.cardIndexBlack },
  "♥": { icon: "game-icons:hearts", color: palette.cardIndexRed },
  "♦": { icon: "game-icons:diamonds", color: palette.cardIndexRed }
};

const rankDisplay = (rank: string): string => {
  if (rank === "10") {
    return "10";
  }
  return rank.toUpperCase();
};

export const PlayingCard: React.FC<PlayingCardProps> = ({ rank, suit, faceDown = false }) => {
  if (faceDown) {
    return (
      <div
        className="relative h-[132px] w-[92px] rounded-2xl border text-xl font-semibold shadow-[0_10px_22px_rgba(0,0,0,0.35)]"
        style={{
          background: `linear-gradient(135deg, ${palette.cardBack} 0%, #0a2827 100%)`,
          borderColor: palette.cardBackBorder,
          color: palette.gold
        }}
      >
        <div className="absolute inset-2 rounded-xl border border-[rgba(200,162,74,0.35)] bg-[#0f2f30]/60" />
        <div className="relative flex h-full w-full items-center justify-center">
          <Icon icon="game-icons:card-random" width={36} height={36} />
        </div>
      </div>
    );
  }

  const suitMeta = SUIT_META[suit] ?? SUIT_META["♠"];
  const displayRank = rankDisplay(rank);

  return (
    <div
      className="relative h-[132px] w-[92px] rounded-2xl border text-emerald-950 shadow-[0_12px_30px_rgba(9,18,14,0.28)]"
      style={{
        backgroundColor: palette.cardFace,
        borderColor: palette.cardBorder
      }}
    >
      <div className="absolute inset-[6px] rounded-xl border border-[rgba(25,45,36,0.05)] bg-white/5" />
      <div className="relative flex h-full w-full items-center justify-center">
        <Icon icon={suitMeta.icon} width={34} height={34} color={suitMeta.color} />
      </div>
      <div className="absolute left-2 top-2 flex flex-col items-center gap-1 text-2xl font-semibold" style={{ color: suitMeta.color }}>
        <span>{displayRank}</span>
        <Icon icon={suitMeta.icon} width={18} height={18} />
      </div>
      <div className="absolute bottom-2 right-2 flex flex-col items-center gap-1 text-2xl font-semibold rotate-180" style={{ color: suitMeta.color }}>
        <span>{displayRank}</span>
        <Icon icon={suitMeta.icon} width={18} height={18} />
      </div>
    </div>
  );
};
