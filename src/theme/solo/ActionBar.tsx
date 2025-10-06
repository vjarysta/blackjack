import React from "react";
import type { Phase } from "../../engine/types";
import { cn } from "../../utils/cn";

export type SoloAction =
  | "deal"
  | "clear"
  | "rebet"
  | "hit"
  | "stand"
  | "double"
  | "split"
  | "surrender"
  | "playDealer"
  | "nextRound";

export type SoloActionAvailability = Record<SoloAction, boolean>;

interface ActionDescriptor {
  action: SoloAction;
  label: string;
  hotkey?: string;
  variant: "primary" | "secondary";
}

const ACTION_DESCRIPTORS: ActionDescriptor[] = [
  { action: "deal", label: "Deal", hotkey: "Space", variant: "primary" },
  { action: "hit", label: "Hit", hotkey: "H", variant: "primary" },
  { action: "stand", label: "Stand", hotkey: "S", variant: "primary" },
  { action: "double", label: "Double", hotkey: "D", variant: "secondary" },
  { action: "split", label: "Split", hotkey: "P", variant: "secondary" },
  { action: "surrender", label: "Surrender", hotkey: "R", variant: "secondary" },
  { action: "playDealer", label: "Play Dealer", hotkey: "Enter", variant: "primary" },
  { action: "nextRound", label: "Next Round", hotkey: "Enter", variant: "primary" },
  { action: "clear", label: "Clear", hotkey: "C", variant: "secondary" },
  { action: "rebet", label: "Rebet", hotkey: "B", variant: "secondary" },
];

const ORDER: SoloAction[] = [
  "deal",
  "hit",
  "stand",
  "double",
  "split",
  "surrender",
  "playDealer",
  "nextRound",
  "clear",
  "rebet",
];

interface ActionBarProps {
  availability: SoloActionAvailability;
  primary: SoloAction | null;
  onAction: (action: SoloAction) => void;
  phase: Phase;
}

const visibleActions = (
  availability: SoloActionAvailability,
  phase: Phase,
): ActionDescriptor[] => {
  const isBetting = phase === "betting";
  return ORDER
    .map((action) => ACTION_DESCRIPTORS.find((descriptor) => descriptor.action === action)!)
    .filter((descriptor) => {
      if (descriptor.action === "clear") {
        return availability.clear;
      }
      if (descriptor.action === "rebet") {
        return availability.rebet;
      }
      if (descriptor.action === "deal") {
        return isBetting;
      }
      return availability[descriptor.action];
    });
};

export const ActionBar: React.FC<ActionBarProps> = ({ availability, primary, onAction, phase }) => {
  const actions = visibleActions(availability, phase);

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap justify-end gap-2 text-[10px] uppercase tracking-[0.24em]">
      {actions.map((descriptor) => {
        const isPrimary = descriptor.variant === "primary" || descriptor.action === primary;
        const isDisabled = !availability[descriptor.action];
        return (
          <button
            key={descriptor.action}
            type="button"
            onClick={() => onAction(descriptor.action)}
            disabled={isDisabled}
            className={cn(
              "flex min-w-[110px] items-center justify-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold transition",
              isPrimary
                ? "solo-action-primary border-transparent"
                : "border-[rgba(216,182,76,0.25)] bg-[rgba(12,31,24,0.65)] text-[var(--text-hi)]",
              isDisabled && "opacity-40",
            )}
          >
            <span>{descriptor.label}</span>
            {descriptor.hotkey && (
              <span className="text-[9px] uppercase tracking-[0.3em] text-[var(--text-lo)]">{descriptor.hotkey}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
