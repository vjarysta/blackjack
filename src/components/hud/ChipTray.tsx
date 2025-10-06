import React from "react";
import type { ChipDenomination } from "../../theme/palette";
import { palette } from "../../theme/palette";
import { Chip } from "./Chip";

const CHIP_VALUES: ChipDenomination[] = [1, 5, 25, 100, 500];

interface ChipTrayProps {
  activeChip: ChipDenomination;
  onSelect: (value: ChipDenomination) => void;
  disabled?: boolean;
}

export const ChipTray: React.FC<ChipTrayProps> = ({ activeChip, onSelect, disabled = false }) => {
  return (
    <div
      data-testid="chip-tray"
      className="flex items-center gap-4 rounded-2xl border border-[#c8a24a]/40 bg-[#0e2f25]/90 px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.5em] text-emerald-200">Chips</span>
      <div className="flex items-center gap-3">
        {CHIP_VALUES.map((value) => {
          const isActive = activeChip === value;
          return (
            <div key={value} className="relative flex flex-col items-center">
              <Chip
                value={value}
                size={isActive ? 58 : 54}
                selected={isActive}
                disabled={disabled}
                data-testid={`chip-${value}`}
                aria-label={`${value} chip`}
                onClick={() => onSelect(value)}
              />
              {isActive && (
                <span
                  className="mt-1 text-center text-[9px] font-semibold uppercase tracking-[0.4em]"
                  style={{ color: palette.gold }}
                >
                  Active
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
