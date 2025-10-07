import React from "react";
import type { DisplayMode } from "../ui/displayMode";
import { cn } from "../utils/cn";

interface UIModeToggleProps {
  mode: DisplayMode;
  onChange: (mode: DisplayMode) => void;
}

export const UIModeToggle: React.FC<UIModeToggleProps> = ({ mode, onChange }) => {
  const handleSelect = React.useCallback(
    (next: DisplayMode) => () => {
      onChange(next);
    },
    [onChange]
  );

  return (
    <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 p-1 text-[11px] uppercase tracking-[0.24em] text-white/80 shadow">
      <button
        type="button"
        onClick={handleSelect("classic")}
        className={cn(
          "rounded-full px-3 py-1 font-semibold transition",
          mode === "classic"
            ? "bg-white/20 text-white shadow-inner"
            : "text-white/70 hover:text-white"
        )}
        aria-pressed={mode === "classic"}
        aria-label="Switch to classic table UI"
      >
        Classic
      </button>
      <button
        type="button"
        onClick={handleSelect("noirjack")}
        className={cn(
          "rounded-full px-3 py-1 font-semibold transition",
          mode === "noirjack"
            ? "bg-white/20 text-white shadow-inner"
            : "text-white/70 hover:text-white"
        )}
        aria-pressed={mode === "noirjack"}
        aria-label="Switch to NoirJack UI"
      >
        NoirJack
      </button>
    </div>
  );
};
