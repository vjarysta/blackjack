import React from "react";
import { ChipSVG } from "../table/ChipSVG";
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
    <div className="flex flex-wrap items-center gap-4">
      <span
        className="text-xs font-semibold uppercase tracking-[0.35em]"
        style={{ color: palette.subtleText }}
      >
        Chip Tray
      </span>
      <div className="flex items-center gap-3">
        {CHIP_VALUES.map((value) => {
          const isActive = activeChip === value;
          return (
            <button
              key={value}
              type="button"
              className={[
                "relative flex flex-col items-center transition-transform",
                disabled ? "cursor-not-allowed opacity-60" : "hover:-translate-y-1"
              ].join(" ")}
              onClick={() => onSelect(value)}
              aria-pressed={isActive}
              aria-label={`Select ${value} chip`}
              disabled={disabled}
            >
              <ChipSVG value={value} shadow={isActive} size={isActive ? 60 : 54} />
              {isActive && (
                <span
                  className="mt-1 text-[10px] font-semibold uppercase tracking-[0.35em]"
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
  );
};
