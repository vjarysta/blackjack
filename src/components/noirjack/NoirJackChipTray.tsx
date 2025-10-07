import React from "react";
import type { ChipDenomination } from "../../theme/palette";
import { chipPalette } from "../../theme/palette";

const CHIP_VALUES: ChipDenomination[] = [1, 5, 25, 100, 500];

interface NoirJackChipTrayProps {
  activeChip: ChipDenomination;
  onSelect: (value: ChipDenomination) => void;
  onAdd: (value: ChipDenomination) => void;
  onRemove: (value: ChipDenomination) => void;
  onRemoveTop: () => void;
  disabled?: boolean;
}

export const NoirJackChipTray: React.FC<NoirJackChipTrayProps> = ({
  activeChip,
  onSelect,
  onAdd,
  onRemove,
  onRemoveTop,
  disabled = false
}) => {
  const [animatedChip, setAnimatedChip] = React.useState<ChipDenomination | null>(null);

  const triggerAnimation = React.useCallback((value: ChipDenomination) => {
    setAnimatedChip(value);
    window.setTimeout(() => setAnimatedChip(null), 220);
  }, []);

  const handleClick = React.useCallback(
    (value: ChipDenomination) => {
      onSelect(value);
      if (!disabled) {
        onAdd(value);
        triggerAnimation(value);
      }
    },
    [disabled, onAdd, onSelect, triggerAnimation]
  );

  const handleContextMenu = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, value: ChipDenomination) => {
      event.preventDefault();
      if (!disabled) {
        onRemove(value);
      }
    },
    [disabled, onRemove]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="nj-label-inline">Chip Tray</span>
        {disabled && <span className="text-xs uppercase tracking-[0.2em] text-[var(--nj-text-muted)]">Locked</span>}
      </div>
      <div className="nj-chip-grid">
        {CHIP_VALUES.map((value) => {
          const palette = chipPalette[value];
          const isSelected = activeChip === value;
          const background = `radial-gradient(circle at 30% 30%, ${palette.core}, ${palette.base} 65%)`;
          const stripe = `conic-gradient(from 45deg, ${palette.ring} 0 30deg, transparent 30deg 60deg, ${palette.ring} 60deg 90deg, transparent 90deg 120deg, ${palette.ring} 120deg 150deg, transparent 150deg 180deg, ${palette.ring} 180deg 210deg, transparent 210deg 240deg, ${palette.ring} 240deg 270deg, transparent 270deg 300deg, ${palette.ring} 300deg 330deg, transparent 330deg 360deg)`;
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleClick(value)}
              onContextMenu={(event) => handleContextMenu(event, value)}
              className="nj-chip"
              style={{ background }}
              data-selected={isSelected}
              data-disabled={disabled}
              data-motion={animatedChip === value ? "enter" : undefined}
              aria-label={`Select €${value} chip`}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-1 rounded-full"
                style={{
                  background: stripe,
                  opacity: 0.22,
                  mixBlendMode: "screen"
                }}
              />
              <span className="nj-chip-value">€{value}</span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="nj-btn nj-btn-primary text-sm"
          onClick={() => {
            onAdd(activeChip);
            triggerAnimation(activeChip);
          }}
          disabled={disabled}
        >
          Add €{activeChip}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="nj-btn nj-btn-secondary text-sm"
            onClick={() => onRemove(activeChip)}
            disabled={disabled}
          >
            Remove
          </button>
          <button
            type="button"
            className="nj-btn nj-btn-secondary text-sm"
            onClick={onRemoveTop}
            disabled={disabled}
          >
            Undo
          </button>
        </div>
      </div>
    </div>
  );
};
