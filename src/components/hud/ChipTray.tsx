import React from "react";
import type { ChipDenomination } from "../../theme/palette";
import { Chip } from "../table/Chip";

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
        {CHIP_VALUES.map((value) => (
          <Chip
            key={value}
            value={value}
            selected={activeChip === value}
            disabled={disabled}
            onClick={() => onSelect(value)}
            testId={`chip-${value}`}
            size={56}
          />
        ))}
      </div>
    </div>
  );
};
