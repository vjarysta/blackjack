import React from "react";
import type { Action } from "../../utils/basicStrategy";

interface ActionAvailability {
  hit: boolean;
  stand: boolean;
  double: boolean;
  split: boolean;
  surrender: boolean;
  deal: boolean;
  finishInsurance: boolean;
  playDealer: boolean;
  nextRound: boolean;
}

interface NoirJackActionBarProps {
  availability: ActionAvailability;
  onDeal: () => void;
  onFinishInsurance: () => void;
  onPlayDealer: () => void;
  onNextRound: () => void;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
  onSurrender: () => void;
  highlightedAction?: Action | null;
}

export const NoirJackActionBar: React.FC<NoirJackActionBarProps> = ({
  availability,
  onDeal,
  onFinishInsurance,
  onPlayDealer,
  onNextRound,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onSurrender,
  highlightedAction
}) => {
  const highlightFor = (action: Action): string | undefined => {
    if (!highlightedAction) {
      return undefined;
    }
    return highlightedAction === action ? "best" : undefined;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="nj-action-grid-primary">
        <button
          type="button"
          className="nj-btn nj-btn-primary text-lg"
          onClick={onHit}
          disabled={!availability.hit}
          data-coach={highlightFor("hit")}
        >
          Hit
        </button>
        <button
          type="button"
          className="nj-btn nj-btn-secondary text-lg"
          onClick={onStand}
          disabled={!availability.stand}
          data-coach={highlightFor("stand")}
        >
          Stand
        </button>
      </div>
      <div className="nj-action-grid-secondary">
        <button
          type="button"
          className="nj-btn nj-btn-secondary text-sm"
          onClick={onDouble}
          disabled={!availability.double}
          data-coach={highlightFor("double")}
        >
          Double
        </button>
        <button
          type="button"
          className="nj-btn nj-btn-secondary text-sm"
          onClick={onSplit}
          disabled={!availability.split}
          data-coach={highlightFor("split")}
        >
          Split
        </button>
        <button
          type="button"
          className="nj-btn nj-btn-secondary text-sm"
          onClick={onSurrender}
          disabled={!availability.surrender}
          data-coach={highlightFor("surrender")}
        >
          Surrender
        </button>
      </div>
      <div className="nj-action-grid-utility">
        <button type="button" className="nj-btn nj-btn-secondary text-sm" onClick={onDeal} disabled={!availability.deal}>
          Deal
        </button>
        <button
          type="button"
          className="nj-btn nj-btn-secondary text-sm"
          onClick={onFinishInsurance}
          disabled={!availability.finishInsurance}
        >
          Finish Insurance
        </button>
        <button
          type="button"
          className="nj-btn nj-btn-secondary text-sm"
          onClick={onPlayDealer}
          disabled={!availability.playDealer}
        >
          Play Dealer
        </button>
        <button
          type="button"
          className="nj-btn nj-btn-secondary text-sm"
          onClick={onNextRound}
          disabled={!availability.nextRound}
        >
          Next Round
        </button>
      </div>
    </div>
  );
};
