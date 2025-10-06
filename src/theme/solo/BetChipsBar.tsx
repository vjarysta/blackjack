import React from "react";
import type { ChipDenomination } from "../../theme/palette";
import { cn } from "../../utils/cn";

interface BetChipsBarProps {
  chips: ChipDenomination[];
  activeChip: ChipDenomination;
  onSelect: (value: ChipDenomination) => void;
  onAdd: () => void;
  onRemove: () => void;
  onClear: () => void;
  onRebet: () => void;
  canInteract: boolean;
  showRebet: boolean;
}

export const BetChipsBar: React.FC<BetChipsBarProps> = ({
  chips,
  activeChip,
  onSelect,
  onAdd,
  onRemove,
  onClear,
  onRebet,
  canInteract,
  showRebet,
}) => {
  return (
    <div className="flex w-full flex-col gap-3 text-[10px] uppercase tracking-[0.24em] text-[var(--text-lo)]">
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((value) => {
          const isActive = value === activeChip;
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                if (value === activeChip && canInteract) {
                  onAdd();
                } else {
                  onSelect(value);
                }
              }}
              disabled={!canInteract}
              className={cn(
                "solo-chip flex h-[var(--chip-size)] w-[var(--chip-size)] items-center justify-center rounded-full text-sm font-semibold text-[var(--text-hi)] transition-transform",
                isActive && "shadow-[0_0_0_2px_rgba(216,182,76,0.5)]",
                !canInteract && "opacity-60",
              )}
              data-active={isActive}
            >
              {value}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[var(--text-hi)]">
        <button
          type="button"
          onClick={onAdd}
          disabled={!canInteract}
          className={cn(
            "rounded-full border border-[rgba(216,182,76,0.35)] px-4 py-2 text-[11px] uppercase tracking-[0.28em] transition",
            canInteract ? "hover:bg-[rgba(216,182,76,0.1)]" : "opacity-50",
          )}
        >
          Add Chip
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canInteract}
          className={cn(
            "rounded-full border border-[rgba(216,182,76,0.18)] px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[var(--text-lo)] transition",
            canInteract ? "hover:bg-[rgba(216,182,76,0.08)]" : "opacity-50",
          )}
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={!canInteract}
          className={cn(
            "rounded-full border border-[rgba(216,182,76,0.18)] px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[var(--danger)] transition",
            canInteract ? "hover:bg-[rgba(215,90,90,0.12)]" : "opacity-50",
          )}
        >
          Clear
        </button>
        {showRebet && (
          <button
            type="button"
            onClick={onRebet}
            className="rounded-full border border-[rgba(216,182,76,0.35)] px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[var(--text-hi)] transition hover:bg-[rgba(216,182,76,0.12)]"
          >
            Rebet
          </button>
        )}
      </div>
    </div>
  );
};
