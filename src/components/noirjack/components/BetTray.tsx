import * as React from "react";
import type { ChipDenomination } from "../../../theme/palette";
import { formatCurrency } from "../../../utils/currency";
import { Chip } from "../../hud/Chip";

interface ChipMotion {
  value: ChipDenomination;
  type: "add" | "remove";
  stamp: number;
}

interface BetTrayProps {
  chipValues: readonly ChipDenomination[];
  activeChip: ChipDenomination;
  baseBet: number;
  isBettingPhase: boolean;
  onSelectChip(value: ChipDenomination): void;
  onRemoveChip(value: ChipDenomination): void;
  onAddActive(): void;
  onRemoveActive(): void;
  onUndo(): void;
  chipMotion: ChipMotion | null;
  closable?: boolean;
  onClose?(): void;
}

export const BetTray: React.FC<BetTrayProps> = ({
  chipValues,
  activeChip,
  baseBet,
  isBettingPhase,
  onSelectChip,
  onRemoveChip,
  onAddActive,
  onRemoveActive,
  onUndo,
  chipMotion,
  closable,
  onClose,
}) => (
  <>
    <div className="nj-controls__tray-header">
      <span>Chips</span>
      <div className="nj-controls__tray-meta">
        <span>{formatCurrency(baseBet)}</span>
        {closable ? (
          <button
            type="button"
            className="nj-chip-sheet__close"
            onClick={onClose}
          >
            Close
          </button>
        ) : null}
      </div>
    </div>
    <div className="nj-chip-row">
      {chipValues.map((value) => (
        <Chip
          key={value}
          value={value}
          size={56}
          selected={activeChip === value}
          onClick={() => onSelectChip(value)}
          onContextMenu={(event) => {
            event.preventDefault();
            onRemoveChip(value);
          }}
          aria-label={`Select ${value} chip`}
          data-chip-motion={
            chipMotion?.value === value
              ? `${chipMotion.type}-${chipMotion.stamp}`
              : undefined
          }
          className="nj-chip"
        />
      ))}
    </div>
    <div className="nj-tray-actions">
      <button
        type="button"
        className="nj-btn"
        onClick={onAddActive}
        disabled={!isBettingPhase}
      >
        Add {activeChip}
      </button>
      <button
        type="button"
        className="nj-btn nj-btn--ghost"
        onClick={onRemoveActive}
        disabled={!isBettingPhase || baseBet <= 0}
      >
        Remove
      </button>
      <button
        type="button"
        className="nj-btn nj-btn--ghost"
        onClick={onUndo}
        disabled={!isBettingPhase || baseBet <= 0}
      >
        Undo last
      </button>
    </div>
  </>
);
