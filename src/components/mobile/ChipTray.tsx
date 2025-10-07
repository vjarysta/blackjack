import React from "react";
import type { ChipDenomination } from "../../theme/palette";
import { Chip } from "../hud/Chip";
import { Button } from "../ui/button";
import { cn } from "../../utils/cn";

const CHIP_VALUES: ChipDenomination[] = [1, 5, 25, 100, 500];

interface ChipTrayProps {
  activeChip: ChipDenomination;
  onSelect: (value: ChipDenomination) => void;
  onAdd: (value: ChipDenomination) => void;
  onRemove: (value: ChipDenomination) => void;
  onRemoveTop: () => void;
  disabled?: boolean;
}

export const ChipTray: React.FC<ChipTrayProps> = ({
  activeChip,
  onSelect,
  onAdd,
  onRemove,
  onRemoveTop,
  disabled = false
}) => {
  const handleClick = (value: ChipDenomination) => {
    onSelect(value);
    if (!disabled) {
      onAdd(value);
    }
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLButtonElement>, value: ChipDenomination) => {
    event.preventDefault();
    if (!disabled) {
      onRemove(value);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.5em] text-emerald-200">Chips</span>
      <div className="flex items-center gap-2">
        {CHIP_VALUES.map((value) => (
          <Chip
            key={value}
            value={value}
            size={52}
            selected={activeChip === value}
            onClick={() => handleClick(value)}
            onContextMenu={(event) => handleContextMenu(event, value)}
            aria-label={`Select ${value} chip`}
            className={cn(
              "transition",
              activeChip === value ? "ring-2 ring-emerald-400/80" : "hover:ring-2 hover:ring-emerald-400/40"
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 text-[12px]">
        <Button
          type="button"
          size="sm"
          onClick={() => onAdd(activeChip)}
          disabled={disabled}
          className="col-span-2"
        >
          Add {activeChip}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onRemove(activeChip)}
          disabled={disabled}
        >
          Remove
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRemoveTop}
          disabled={disabled}
          className="col-span-3"
        >
          Undo last
        </Button>
      </div>
    </div>
  );
};
