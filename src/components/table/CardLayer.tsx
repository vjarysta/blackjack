import React from "react";
import { palette } from "../../theme/palette";
import { toPixels, defaultTableAnchors } from "./coords";
import type { GameState, Hand, Seat } from "../../engine/types";
import { getHandTotals, isBust } from "../../engine/totals";
import { formatCurrency } from "../../utils/currency";
import { PlayingCard } from "./PlayingCard";

interface CardLayerProps {
  game: GameState;
  dimensions: { width: number; height: number };
}

const renderCard = (
  card: { rank: string; suit: string },
  key: string,
  faceDown = false
): React.ReactNode => <PlayingCard key={key} rank={card.rank} suit={card.suit} faceDown={faceDown} />;

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
    <div className="flex flex-wrap gap-2 text-[12px] uppercase tracking-[0.25em]" style={{ color: palette.subtleText }}>
      {badges.map((badge) => (
        <span key={badge} className="rounded-full bg-[#123428]/75 px-2 py-1 font-semibold">
          {badge}
        </span>
      ))}
    </div>
  );
};

const SeatHandCluster = (
  seat: Seat,
  seatIndex: number,
  dimensions: { width: number; height: number },
  children: React.ReactNode,
  isActive: boolean
): React.ReactNode => {
  const anchor = defaultTableAnchors.seats[seatIndex];
  const { x, y } = toPixels(anchor.x, anchor.y - defaultTableAnchors.seatRadius - 96, dimensions);
  return (
    <div
      key={`${seat.index}-cluster`}
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4"
      style={{
        left: x,
        top: y,
        boxShadow: isActive
          ? "0 0 0 2px rgba(200, 162, 74, 0.65), 0 18px 45px rgba(0,0,0,0.45)"
          : "0 12px 35px rgba(0,0,0,0.35)"
      }}
    >
      {children}
    </div>
  );
};

export const CardLayer: React.FC<CardLayerProps> = ({ game, dimensions }) => {
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

  return (
    <div className="pointer-events-none absolute inset-0 z-30 text-[13px]" style={{ color: palette.text }}>
      <div
        className="flex flex-col items-center gap-3"
        style={{
          position: "absolute",
          left: dealerPosition.x,
          top: dealerPosition.y,
          width: dealerBoxSize.width,
          transform: "translate(-50%, -50%)"
        }}
      >
        <div className="flex gap-4">
          {dealerCards.map((card, index) => {
            if (index === 1 && !revealHole) {
              return renderCard(card, `dealer-${index}`, true);
            }
            return renderCard(card, `dealer-${index}`);
          })}
        </div>
        <div className="rounded-full bg-[#0d3124]/80 px-4 py-1 text-xs uppercase tracking-[0.25em]">
          {revealHole
            ? dealerTotals.soft && dealerTotals.soft !== dealerTotals.hard
              ? `Dealer ${dealerTotals.hard} / ${dealerTotals.soft}`
              : `Dealer ${dealerTotals.hard}`
            : "Dealer showing"}
        </div>
      </div>

      {game.seats.map((seat) => {
        const isActiveSeat = game.activeSeatIndex === seat.index;
        if (!seat.occupied && seat.baseBet === 0) {
          return null;
        }
        const hands = seat.hands.length > 0 ? seat.hands : [];
        const clusterChildren: React.ReactNode[] = [];

        if (hands.length === 0 && seat.baseBet > 0) {
          clusterChildren.push(
            <span
              key="pending"
              className="rounded-full bg-[#0d3124]/75 px-4 py-1 text-sm uppercase tracking-[0.25em]"
            >
              Ready with {formatCurrency(seat.baseBet)}
            </span>
          );
        }

        hands.forEach((hand, handIndex) => {
          const cards = hand.cards.map((card, index) => {
            return renderCard(card, `${hand.id}-${index}`);
          });
          const handTotals = getHandTotals(hand);
          clusterChildren.push(
            <div key={hand.id} className="flex flex-col items-center gap-2">
              <div className="flex gap-3" style={{ transform: `translateX(${handIndex * 18}px)` }}>
                {cards}
              </div>
              <div
                className="rounded-full bg-[#0c2e23]/85 px-3 py-1 text-[13px] uppercase tracking-[0.25em]"
                style={{ color: palette.text }}
              >
                {handTotals.soft && handTotals.soft !== handTotals.hard
                  ? `Total ${handTotals.hard} / ${handTotals.soft}`
                  : `Total ${handTotals.hard}`}
              </div>
              <div className="text-[13px] uppercase tracking-[0.25em]" style={{ color: palette.subtleText }}>
                Bet {formatCurrency(hand.bet)}
              </div>
              {hand.insuranceBet !== undefined && (
                <div className="text-[12px] uppercase tracking-[0.25em]" style={{ color: palette.subtleText }}>
                  {hand.insuranceBet > 0
                    ? `Insurance ${formatCurrency(hand.insuranceBet)}`
                    : "Insurance declined"}
                </div>
              )}
              {renderHandBadges(hand)}
            </div>
          );
        });

        if (clusterChildren.length === 0) {
          return null;
        }

        return SeatHandCluster(seat, seat.index, dimensions, clusterChildren, isActiveSeat);
      })}
    </div>
  );
};
