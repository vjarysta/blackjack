import React from "react";
import { ChipSVG } from "./ChipSVG";
import type { ChipDenomination } from "../../theme/palette";
import { palette } from "../../theme/palette";

const CHIP_VALUES: ChipDenomination[] = [1, 5, 25, 100, 500];

interface ChipTrayProps {
  activeChip: ChipDenomination;
  onSelect: (value: ChipDenomination) => void;
  disabled?: boolean;
}

export const ChipTray: React.FC<ChipTrayProps> = ({ activeChip, onSelect, disabled = false }) => {
  return (
    <div className="rounded-full border border-[#c8a24a]/50 bg-[#102e24]/90 px-6 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-6">
        <span
          className="text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: palette.subtleText }}
        >
          Chips
        </span>
        <div className="flex items-center gap-4">
          {CHIP_VALUES.map((value) => {
            const isActive = activeChip === value;
            const buttonClasses = [
              "relative rounded-full transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              disabled ? "pointer-events-none opacity-60" : "hover:-translate-y-1"
            ].join(" ");
            return (
              <button
                key={value}
                type="button"
                className={buttonClasses}
                onClick={() => onSelect(value)}
                aria-pressed={isActive}
              >
                <ChipSVG value={value} shadow={isActive} size={isActive ? 60 : 54} />
                {isActive && (
                  <span
                    className="absolute inset-x-0 -bottom-5 text-center text-[10px] font-semibold uppercase tracking-[0.3em]"
                    style={{ color: palette.gold }}
                  >
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
