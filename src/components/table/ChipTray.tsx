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
    <div className="rounded-full border border-[#c8a24a]/50 bg-[#102e24]/90 px-6 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-6">
        <span
          className="text-xs font-semibold uppercase tracking-[0.3em]"
          style={{ color: palette.subtleText }}
        >
          Chips
        </span>
        <div className="flex items-center gap-4">
          {CHIP_VALUES.map((value) => (
            <Chip
              key={value}
              value={value}
              selected={activeChip === value}
              disabled={disabled}
              onClick={() => onSelect(value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
