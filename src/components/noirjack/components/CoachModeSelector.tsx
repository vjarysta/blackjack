import * as React from "react";
import { Sparkles } from "lucide-react";
import type { CoachMode } from "../../../store/useGameStore";

interface CoachModeSelectorProps {
  mode: CoachMode;
  onChange(mode: CoachMode): void;
}

const labels: Record<CoachMode, string> = {
  off: "Off",
  feedback: "Feedback",
  live: "Live",
};

export const CoachModeSelector: React.FC<CoachModeSelectorProps> = ({
  mode,
  onChange,
}) => {
  const next = React.useCallback(() => {
    const order: CoachMode[] = ["off", "feedback", "live"];
    const index = order.indexOf(mode);
    const nextMode = order[(index + 1) % order.length];
    onChange(nextMode);
  }, [mode, onChange]);

  return (
    <button
      type="button"
      className="nj-btn nj-btn--ghost nj-coach-toggle"
      onClick={next}
      aria-label={`Toggle coach mode (currently ${labels[mode]})`}
    >
      <Sparkles size={16} aria-hidden="true" />
      <span className="nj-coach-toggle__label">Coach</span>
      <span className="nj-coach-toggle__value">{labels[mode]}</span>
    </button>
  );
};
