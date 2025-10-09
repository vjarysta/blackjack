import * as React from "react";
import { bestTotal } from "../../../engine/totals";
import type { Hand } from "../../../engine/types";
import { formatCurrency } from "../../../utils/currency";
import { cn } from "../../../utils/cn";
import { NoirCardFan } from "../NoirCardFan";

export interface CoachMessage {
  tone: "correct" | "better";
  text: string;
}

interface PlayerPanelProps {
  hands: Hand[];
  activeIndex: number;
  focusedHand: Hand | null;
  playerTotal: number | null;
  playerBet: number;
  coachMessage: CoachMessage | null;
}

export const PlayerPanel: React.FC<PlayerPanelProps> = ({
  hands,
  activeIndex,
  focusedHand,
  playerTotal,
  playerBet,
  coachMessage,
}) => (
  <section className="nj-section nj-section--player">
    <div className="nj-glass nj-panel">
      <div className="nj-panel__header">
        <span className="nj-panel__title">Player</span>
        <div className="nj-panel__meta">
          <div>
            <span className="nj-stat__label">Total</span>
            <span className="nj-panel__value">{playerTotal ?? "--"}</span>
          </div>
          <div>
            <span className="nj-stat__label">Bet</span>
            <span className="nj-panel__value">{formatCurrency(playerBet)}</span>
          </div>
        </div>
      </div>
      <div className="nj-hand-carousel">
        <div className="nj-panel__cards">
          <NoirCardFan cards={focusedHand?.cards ?? []} />
        </div>
        {hands.length > 1 ? (
          <div className="nj-hand-tabs" role="tablist" aria-label="Split hands">
            {hands.map((hand, index) => (
              <div
                key={hand.id}
                className={cn(
                  "nj-hand-tab",
                  index === activeIndex && "nj-hand-tab--active"
                )}
                role="tab"
                aria-selected={index === activeIndex}
              >
                <span>Hand {index + 1}</span>
                <span>{bestTotal(hand)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {coachMessage ? (
        <div
          className={cn(
            "nj-coach-banner",
            coachMessage.tone === "correct"
              ? "nj-coach-banner--good"
              : "nj-coach-banner--warn"
          )}
        >
          {coachMessage.text}
        </div>
      ) : null}
    </div>
  </section>
);
