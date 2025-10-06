import React from "react";
import type { ChipDenomination } from "../../../theme/palette";
import { formatCurrency } from "../../../utils/currency";

const CHIP_VALUES: ChipDenomination[] = [1, 5, 25, 100, 500];

interface BetChipsBarProps {
  activeChip: ChipDenomination;
  currentBet: number;
  disabled: boolean;
  canClear: boolean;
  canRebet: boolean;
  onSelectChip: (value: ChipDenomination) => void;
  onAddChip: (value: ChipDenomination) => void;
  onClear: () => void;
  onRebet: () => void;
}

export const BetChipsBar: React.FC<BetChipsBarProps> = ({
  activeChip,
  currentBet,
  disabled,
  canClear,
  canRebet,
  onSelectChip,
  onAddChip,
  onClear,
  onRebet
}) => {
  return (
    <div className="flex flex-1 flex-wrap items-center gap-4">
      <div className="flex items-center gap-3">
        {CHIP_VALUES.map((value) => {
          const active = activeChip === value;
          return (
            <button
              key={value}
              type="button"
              className="solo-chip-button flex items-center justify-center text-sm font-semibold"
              data-active={active}
              onClick={() => {
                onSelectChip(value);
                if (!disabled) {
                  onAddChip(value);
                }
              }}
              disabled={disabled}
              aria-pressed={active}
              aria-label={`Jeton ${value}`}
            >
              {value}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[var(--caps-track)] text-[var(--text-lo)]">
        <span>Mise : {formatCurrency(currentBet)}</span>
        <button
          type="button"
          className="solo-control solo-secondary h-10 px-4 text-[11px]"
          onClick={onClear}
          disabled={!canClear}
        >
          Clear
        </button>
        <button
          type="button"
          className="solo-control solo-secondary h-10 px-4 text-[11px]"
          onClick={onRebet}
          disabled={!canRebet}
        >
          Rebet
        </button>
      </div>
    </div>
  );
};
