import React from "react";
import { Button } from "../ui/button";
import { cn } from "../../utils/cn";
import type { CoachMode } from "../../store/useGameStore";
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

interface ActionBarProps {
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
  coachMode: CoachMode;
}

export const ActionBar: React.FC<ActionBarProps> = ({
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
  highlightedAction,
  coachMode
}) => {
  const actionHighlight = (action: Action): string | undefined => {
    if (!highlightedAction) {
      return undefined;
    }
    return highlightedAction === action ? "best" : undefined;
  };

  return (
    <div className="grid gap-3" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}>
      <div className="grid grid-cols-2 gap-3">
        <Button size="lg" onClick={onHit} disabled={!availability.hit} data-coach={actionHighlight("hit")}
          className={cn(
            "h-14 text-lg font-semibold uppercase tracking-[0.3em]",
            highlightedAction === "hit" && coachMode === "live" ? "shadow-[0_0_0_3px_rgba(200,162,74,0.7)]" : undefined
          )}
        >
          Hit
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={onStand}
          disabled={!availability.stand}
          data-coach={actionHighlight("stand")}
          className={cn(
            "h-14 text-lg font-semibold uppercase tracking-[0.3em]",
            highlightedAction === "stand" && coachMode === "live" ? "shadow-[0_0_0_3px_rgba(200,162,74,0.7)]" : undefined
          )}
        >
          Stand
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-3 text-[12px] uppercase tracking-[0.24em]">
        <Button
          size="sm"
          variant="outline"
          onClick={onDouble}
          disabled={!availability.double}
          data-coach={actionHighlight("double")}
        >
          Double
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onSplit}
          disabled={!availability.split}
          data-coach={actionHighlight("split")}
        >
          Split
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onSurrender}
          disabled={!availability.surrender}
          data-coach={actionHighlight("surrender")}
        >
          Surrender
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 text-[12px] uppercase tracking-[0.24em] md:grid-cols-4">
        <Button onClick={onDeal} disabled={!availability.deal}>
          Deal
        </Button>
        <Button variant="outline" onClick={onFinishInsurance} disabled={!availability.finishInsurance}>
          Finish Insurance
        </Button>
        <Button variant="outline" onClick={onPlayDealer} disabled={!availability.playDealer}>
          Play Dealer
        </Button>
        <Button variant="outline" onClick={onNextRound} disabled={!availability.nextRound}>
          Next Round
        </Button>
      </div>
    </div>
  );
};
