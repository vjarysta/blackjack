import * as React from "react";
import type { GameState } from "../../../engine/types";
import type { Action } from "../../../utils/basicStrategy";
import { cn } from "../../../utils/cn";
import type { ActionAvailability } from "../selectors";

interface RoundControl {
  label: string;
  onClick(): void;
  disabled: boolean;
  variant?: "primary" | "ghost";
}

interface ActionsDockProps {
  phase: GameState["phase"];
  availability: ActionAvailability;
  highlightedAction: Action | null;
  onHit(): void;
  onStand(): void;
  onDouble(): void;
  onSplit(): void;
  onSurrender(): void;
  roundControls: RoundControl[];
}

const highlightAttr = (
  phase: GameState["phase"],
  highlighted: Action | null,
  action: Action
): "best" | undefined =>
  phase === "playerActions" && highlighted === action ? "best" : undefined;

export const ActionsDock: React.FC<ActionsDockProps> = ({
  phase,
  availability,
  highlightedAction,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onSurrender,
  roundControls,
}) => (
  <div className="nj-controls__actions nj-glass">
    <div className="nj-actions-primary">
      <button
        type="button"
        className="nj-btn nj-btn-primary"
        onClick={onHit}
        disabled={phase !== "playerActions" || !availability.hit}
        data-coach={highlightAttr(phase, highlightedAction, "hit")}
      >
        Hit
      </button>
      <button
        type="button"
        className="nj-btn nj-btn-primary"
        onClick={onStand}
        disabled={phase !== "playerActions" || !availability.stand}
        data-coach={highlightAttr(phase, highlightedAction, "stand")}
      >
        Stand
      </button>
    </div>
    <div className="nj-actions-secondary">
      <button
        type="button"
        className="nj-btn"
        onClick={onDouble}
        disabled={phase !== "playerActions" || !availability.double}
        data-coach={highlightAttr(phase, highlightedAction, "double")}
      >
        Double
      </button>
      <button
        type="button"
        className="nj-btn"
        onClick={onSplit}
        disabled={phase !== "playerActions" || !availability.split}
        data-coach={highlightAttr(phase, highlightedAction, "split")}
      >
        Split
      </button>
      <button
        type="button"
        className="nj-btn"
        onClick={onSurrender}
        disabled={phase !== "playerActions" || !availability.surrender}
        data-coach={highlightAttr(phase, highlightedAction, "surrender")}
      >
        Surrender
      </button>
    </div>
    {roundControls.length > 0 ? (
      <div className="nj-actions-round">
        {roundControls.map((control) => (
          <button
            key={control.label}
            type="button"
            className={cn(
              "nj-btn",
              control.variant === "primary" ? "nj-btn-primary" : "nj-btn--ghost"
            )}
            onClick={control.onClick}
            disabled={control.disabled}
          >
            {control.label}
          </button>
        ))}
      </div>
    ) : null}
  </div>
);
