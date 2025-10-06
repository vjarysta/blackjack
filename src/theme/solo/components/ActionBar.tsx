import React from "react";

type SoloAction =
  | "deal"
  | "clear"
  | "rebet"
  | "hit"
  | "stand"
  | "double"
  | "split"
  | "surrender"
  | "play-dealer"
  | "next-round";

const LABELS: Record<SoloAction, string> = {
  deal: "Deal",
  clear: "Clear",
  rebet: "Rebet",
  hit: "Hit",
  stand: "Stand",
  double: "Double",
  split: "Split",
  surrender: "Surrender",
  "play-dealer": "Play Dealer",
  "next-round": "Next Round"
};

const KEY_HINT: Partial<Record<SoloAction, string>> = {
  deal: "Space",
  hit: "H",
  stand: "S",
  double: "D",
  split: "P",
  surrender: "R",
  clear: "C"
};

interface ActionBarProps {
  available: Set<SoloAction>;
  primary: SoloAction | null;
  onInvoke: (action: SoloAction) => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({ available, primary, onInvoke }) => {
  const renderButton = (action: SoloAction) => {
    const isAvailable = available.has(action);
    const isPrimary = primary === action;
    const label = LABELS[action];
    const hint = KEY_HINT[action];
    const className = `solo-control ${isPrimary ? "solo-primary" : "solo-secondary"}`;
    return (
      <button
        key={action}
        type="button"
        className={`${className} flex min-w-[120px] flex-col items-center justify-center gap-0.5 text-[12px]`}
        onClick={() => onInvoke(action)}
        disabled={!isAvailable}
      >
        <span>{label}</span>
        {hint && <span className="text-[9px] uppercase tracking-[0.35em] text-[var(--text-lo)]">{hint}</span>}
      </button>
    );
  };

  const order: SoloAction[] = [
    "deal",
    "hit",
    "stand",
    "double",
    "split",
    "surrender",
    "play-dealer",
    "next-round",
    "clear",
    "rebet"
  ];

  const visible = order.filter((action) => available.has(action));

  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="solo-action-bar flex flex-wrap justify-end gap-2 px-4 py-3">
      {visible.map((action) => renderButton(action))}
    </div>
  );
};

export type { SoloAction };
