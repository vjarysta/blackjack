import React from "react";
import type { CoachMode } from "../store/useGameStore";
import { Button } from "./ui/button";

const COACH_LABELS: Record<CoachMode, string> = {
  off: "Off",
  feedback: "Feedback",
  live: "Live"
};

const COACH_DESCRIPTIONS: Record<CoachMode, string> = {
  off: "Coach disabled",
  feedback: "Show verdicts after each move",
  live: "Highlight best move before acting"
};

const CYCLE: CoachMode[] = ["off", "feedback", "live"];

interface CoachToggleProps {
  mode: CoachMode;
  onChange: (mode: CoachMode) => void;
}

export const CoachToggle: React.FC<CoachToggleProps> = ({ mode, onChange }) => {
  const handleClick = () => {
    const currentIndex = CYCLE.indexOf(mode);
    const nextIndex = (currentIndex + 1) % CYCLE.length;
    onChange(CYCLE[nextIndex]);
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleClick}
      aria-label={`Toggle coach mode (currently ${COACH_LABELS[mode]})`}
      title={`${COACH_DESCRIPTIONS[mode]} — click to switch`}
      className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-emerald-100"
    >
      <span className="opacity-80">Coach</span>
      <span className="rounded-full bg-[#123428]/80 px-2 py-0.5 text-[10px] font-semibold tracking-[0.2em] text-emerald-50">
        {COACH_LABELS[mode]}
      </span>
    </Button>
  );
};
