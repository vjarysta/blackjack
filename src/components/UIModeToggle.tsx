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
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70 shadow-lg backdrop-blur">
      <button
        type="button"
        onClick={handleSelect("classic")}
        className={cn(
          "rounded-full px-3 py-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E9C46A]",
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
          "rounded-full px-3 py-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E9C46A]",
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
