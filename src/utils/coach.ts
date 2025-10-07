import type { Action } from "./basicStrategy";

export type CoachFeedback = {
  severity: "correct" | "better";
  message: string;
  action?: Action;
};

export const formatActionLabel = (action: Action): string => {
  switch (action) {
    case "hit":
      return "Hit";
    case "stand":
      return "Stand";
    case "double":
      return "Double";
    case "split":
      return "Split";
    case "surrender":
      return "Surrender";
    case "insurance-skip":
      return "Skip Insurance";
    default:
      return action;
  }
};
