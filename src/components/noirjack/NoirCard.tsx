import React from "react";
import { Icon } from "@iconify/react";
import type { Card } from "../../engine/types";
import { cn } from "../../utils/cn";

interface NoirCardProps {
  card: Card;
  faceDown?: boolean;
  animateKey?: string;
}

const SUIT_META: Record<Card["suit"], { icon: string; tone: "red" | "black" }> = {
  "♠": { icon: "game-icons:spades", tone: "black" },
  "♣": { icon: "game-icons:clubs", tone: "black" },
  "♥": { icon: "game-icons:hearts", tone: "red" },
  "♦": { icon: "game-icons:diamonds", tone: "red" }
};

const rankDisplay = (rank: Card["rank"]): string => {
  if (rank === "10") {
    return "10";
  }
  return rank.toUpperCase();
};

export const NoirCard: React.FC<NoirCardProps> = ({ card, faceDown = false, animateKey }) => {
  const [shouldAnimate, setShouldAnimate] = React.useState(false);
  React.useEffect(() => {
    if (!animateKey || typeof window === "undefined") {
      return;
    }
    setShouldAnimate(true);
    const timer = window.setTimeout(() => setShouldAnimate(false), 400);
    return () => window.clearTimeout(timer);
  }, [animateKey]);

  const suitMeta = SUIT_META[card.suit];
  const displayRank = rankDisplay(card.rank);

  return (
    <div className={cn("nj-card-wrapper", shouldAnimate && "nj-card-wrapper--deal")}
      data-facedown={faceDown ? "true" : undefined}
    >
      <div className={cn("nj-card", faceDown && "nj-card--down")}
        role="img"
        aria-label={faceDown ? "Face down card" : `${displayRank} of ${card.suit}`}
      >
        <div className="nj-card__face" data-tone={suitMeta.tone}>
          <div className="nj-card__corner nj-card__corner--top">
            <span>{displayRank}</span>
            <Icon icon={suitMeta.icon} width={18} height={18} />
          </div>
          <div className="nj-card__corner nj-card__corner--bottom">
            <span>{displayRank}</span>
            <Icon icon={suitMeta.icon} width={18} height={18} />
          </div>
          <div className="nj-card__pip">
            <Icon icon={suitMeta.icon} width={38} height={38} />
          </div>
        </div>
        <div className="nj-card__back">
          <div className="nj-card__back-border" />
          <div className="nj-card__back-pattern" />
        </div>
      </div>
    </div>
  );
};
