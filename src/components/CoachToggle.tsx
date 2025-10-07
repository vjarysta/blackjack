import React from "react";
import { Button } from "./ui/button";
import { useCoachStore, type CoachMode } from "../store/useCoachStore";

const MODE_LABEL: Record<CoachMode, string> = {
  off: "Off",
  feedback: "Feedback",
  live: "Live"
};

export const CoachToggle: React.FC = () => {
  const coachMode = useCoachStore((state) => state.coachMode);
  const cycleMode = useCoachStore((state) => state.cycleMode);

  const label = MODE_LABEL[coachMode];
  const title =
    coachMode === "off"
      ? "Coach is off. Click to enable feedback or live guidance."
      : coachMode === "feedback"
        ? "Coach feedback mode. Click to switch to live advice."
        : "Coach live advice mode. Click to turn off.";

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={cycleMode}
      className="h-8 px-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-emerald-100"
      title={title}
    >
      Coach: <span className="ml-1 text-emerald-200">{label}</span>
    </Button>
  );
};
