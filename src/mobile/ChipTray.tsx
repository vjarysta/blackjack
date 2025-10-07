import React from "react";
import type { ChipDenomination } from "../theme/palette";
import { Chip } from "../components/hud/Chip";
import { cn } from "../utils/cn";
import { formatCurrency } from "../utils/currency";

const CHIP_VALUES: ChipDenomination[] = [1, 5, 25, 100, 500];
const LONG_PRESS_MS = 450;

interface MobileChipTrayProps {
  selected: ChipDenomination;
  canModify: boolean;
  onSelect: (value: ChipDenomination) => void;
  onAdd: (value: ChipDenomination) => void;
  onRemove: (value: ChipDenomination) => void;
  onRemoveTop: () => void;
  totalBet: number;
}

export const MobileChipTray: React.FC<MobileChipTrayProps> = ({
  selected,
  canModify,
  onSelect,
  onAdd,
  onRemove,
  onRemoveTop,
  totalBet
}) => {
  const timerRef = React.useRef<number | null>(null);
  const longPressValue = React.useRef<ChipDenomination | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    longPressValue.current = null;
  };

  React.useEffect(() => clearTimer, []);

  const handlePointerDown = (value: ChipDenomination) => (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button === 2) {
      event.preventDefault();
      if (canModify) {
        onRemove(value);
      }
      return;
    }
    longPressValue.current = value;
    timerRef.current = window.setTimeout(() => {
      if (canModify) {
        onRemove(value);
      }
      longPressValue.current = null;
    }, LONG_PRESS_MS);
  };

  const handlePointerUp = (value: ChipDenomination) => () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
      if (longPressValue.current !== null) {
        onSelect(value);
        if (canModify) {
          onAdd(value);
        }
      }
    }
    longPressValue.current = null;
  };

  const handlePointerLeave = () => {
    clearTimer();
  };

  const handleRemoveTop = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (canModify) {
      onRemoveTop();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.45em] text-emerald-200">Bet</div>
      <div className="rounded-2xl border border-[#c8a24a]/45 bg-[#0c2f24]/85 px-3 py-3 shadow-[0_16px_34px_rgba(0,0,0,0.45)]">
        <div className="flex items-center gap-2">
          {CHIP_VALUES.map((value) => {
            const isActive = value === selected;
            return (
              <Chip
                key={value}
                value={value}
                selected={isActive}
                size={isActive ? 58 : 52}
                className={cn(!canModify && "opacity-60")}
                onPointerDown={handlePointerDown(value)}
                onPointerUp={handlePointerUp(value)}
                onPointerLeave={handlePointerLeave}
                onContextMenu={(event) => {
                  event.preventDefault();
                  if (canModify) {
                    onRemove(value);
                  }
                }}
                aria-pressed={isActive}
              />
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-emerald-300">
          <span>Total {formatCurrency(totalBet)}</span>
          <button
            type="button"
            onClick={handleRemoveTop}
            className="rounded-full border border-emerald-400/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-200 hover:bg-emerald-800/60"
            disabled={!canModify}
          >
            Remove chip
          </button>
        </div>
        <p className="mt-2 text-[10px] text-emerald-400">
          Tap to add · hold or right-click to remove
        </p>
      </div>
    </div>
  );
};
