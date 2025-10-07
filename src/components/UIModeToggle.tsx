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
    <div className="inline-flex rounded-full border border-emerald-700 bg-emerald-900/60 p-1 text-xs text-emerald-200 shadow"> 
      <button
        type="button"
        onClick={handleSelect("classic")}
        className={cn(
          "rounded-full px-3 py-1 font-semibold uppercase tracking-[0.2em] transition",
          mode === "classic"
            ? "bg-emerald-600 text-emerald-50 shadow-inner"
            : "text-emerald-200 hover:text-emerald-50"
        )}
        aria-pressed={mode === "classic"}
        aria-label="Switch to classic table UI"
      >
        Classic
      </button>
      <button
        type="button"
        onClick={handleSelect("mobile")}
        className={cn(
          "rounded-full px-3 py-1 font-semibold uppercase tracking-[0.2em] transition",
          mode === "mobile"
            ? "bg-emerald-600 text-emerald-50 shadow-inner"
            : "text-emerald-200 hover:text-emerald-50"
        )}
        aria-pressed={mode === "mobile"}
        aria-label="Switch to mobile-first UI"
      >
        Mobile
      </button>
    </div>
  );
};
