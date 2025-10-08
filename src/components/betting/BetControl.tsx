import React from "react";
import { Chip } from "../hud/Chip";
import { useHoldRepeat } from "../../hooks/useHoldRepeat";
import { useLongPress } from "../../hooks/useLongPress";
import {
  makeChange,
  reconcileChipItems,
  type ChipItem,
  type Denom,
} from "../../utils/chips";

const EURO_FORMATTER = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const formatEuro = (value: number): string => {
  const parts = EURO_FORMATTER.formatToParts(value);
  const currency = parts.find((part) => part.type === "currency")?.value ?? "€";
  const number = parts
    .filter((part) => part.type !== "currency")
    .map((part) => part.value)
    .join("")
    .trim();
  return `${currency}${number}`;
};

const DEFAULT_DENOMS: ReadonlyArray<Denom> = [500, 100, 25, 5, 1];
const MAX_CHIPS_PER_COLUMN = 10;
const HOLD_SOURCE = "hold" as const;

export type BetBlockReason = "min" | "bankroll" | "max" | "disabled";

type HoldDirection = "increment" | "decrement";

type BetControlProps = {
  amount: number;
  min: number;
  max: number;
  bankroll: number;
  disabled?: boolean;
  denoms?: ReadonlyArray<Denom>;
  prefersReducedMotion?: boolean;
  onChange: (amount: number) => void;
  onCommit?: (delta: number) => void;
  onBlocked?: (reason: BetBlockReason) => void;
  onUndo?: (previous: number | null) => void;
};

interface DeltaHintState {
  direction: HoldDirection;
  amount: number;
}

const clampValue = (
  target: number,
  {
    min,
    max,
    bankroll,
    canAffordMin,
  }: { min: number; max: number; bankroll: number; canAffordMin: boolean }
): { value: number; reason: BetBlockReason | null } => {
  if (!canAffordMin) {
    const value = Math.max(0, Math.min(Math.floor(target), Math.floor(bankroll)));
    return { value, reason: bankroll <= 0 ? "bankroll" : null };
  }

  const floored = Math.floor(target);
  const cappedByBankroll = Math.min(floored, Math.floor(bankroll));
  const capped = Math.min(cappedByBankroll, Math.floor(max));
  const finalValue = Math.max(min, Math.max(0, capped));

  if (finalValue === min && floored < min) {
    return { value: finalValue, reason: "min" };
  }
  if (finalValue === Math.floor(bankroll) && floored > bankroll) {
    return { value: finalValue, reason: "bankroll" };
  }
  if (Number.isFinite(max) && finalValue === Math.floor(max) && floored > max) {
    return { value: finalValue, reason: "max" };
  }
  return { value: finalValue, reason: null };
};

const useChipStack = (amount: number, denoms: ReadonlyArray<Denom>): ChipItem[] => {
  const idRef = React.useRef(0);
  const [items, setItems] = React.useState<ChipItem[]>(() => {
    const initial = makeChange(amount, denoms);
    return initial.map((value) => ({
      id: `chip-${value}-${idRef.current++}`,
      value,
    }));
  });

  React.useEffect(() => {
    const nextValues = makeChange(amount, denoms);
    setItems((previous) =>
      reconcileChipItems(previous, nextValues, () => `chip-${idRef.current++}`)
    );
  }, [amount, denoms]);

  return items;
};

const useFeedback = () => {
  const [message, setMessage] = React.useState<string | null>(null);
  const timerRef = React.useRef<number | null>(null);

  const clear = React.useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = React.useCallback(
    (text: string) => {
      clear();
      setMessage(text);
      timerRef.current = window.setTimeout(() => {
        setMessage(null);
        timerRef.current = null;
      }, 1800);
    },
    [clear]
  );

  React.useEffect(() => () => clear(), [clear]);

  return { message, show, clear };
};

const reasonMessage = (
  reason: BetBlockReason,
  {
    min,
    max,
    bankroll,
  }: { min: number; max: number; bankroll: number }
): string => {
  switch (reason) {
    case "min":
      return `Min bet ${formatEuro(min)}`;
    case "max":
      return `Max bet ${formatEuro(Math.floor(max))}`;
    case "bankroll":
      return `Insufficient bankroll (${formatEuro(Math.floor(bankroll))})`;
    case "disabled":
    default:
      return "Betting locked";
  }
};

const splitIntoColumns = (items: ChipItem[]): ChipItem[][] => {
  const columns: ChipItem[][] = [];
  for (let index = 0; index < items.length; index += MAX_CHIPS_PER_COLUMN) {
    columns.push(items.slice(index, index + MAX_CHIPS_PER_COLUMN));
  }
  return columns;
};

const usePrevious = <T,>(value: T): T | undefined => {
  const ref = React.useRef<T>();
  React.useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

const ChipShortcut: React.FC<{
  value: Denom;
  disabled: boolean;
  className?: string;
  onAdd: () => void;
  onSubtract: () => void;
  onContextMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
}> = ({ value, disabled, className, onAdd, onSubtract, onContextMenu }) => {
  const handlers = useLongPress(
    () => {
      onSubtract();
    },
    () => {
      onAdd();
    },
    { disabled }
  );

  return (
    <Chip
      value={value}
      size={52}
      className={className}
      disabled={disabled}
      aria-label={`Adjust bet by ${value}`}
      onContextMenu={onContextMenu}
      {...handlers}
    />
  );
};

export const BetControl: React.FC<BetControlProps> = ({
  amount,
  min,
  max,
  bankroll,
  disabled = false,
  denoms = DEFAULT_DENOMS,
  prefersReducedMotion = false,
  onChange,
  onCommit,
  onBlocked,
  onUndo,
}) => {
  const normalizedMax = Number.isFinite(max) ? max : Number.MAX_SAFE_INTEGER;
  const canAffordMin = bankroll >= min && min > 0;
  const incrementsDisabled = disabled || !canAffordMin;
  const { message, show: showFeedback } = useFeedback();
  const [deltaHint, setDeltaHint] = React.useState<DeltaHintState | null>(null);
  const historyRef = React.useRef<number[]>([]);
  const prevAmount = usePrevious(amount);

  React.useEffect(() => {
    if (prevAmount !== undefined && prevAmount !== amount) {
      if (historyRef.current.length > 64) {
        historyRef.current.splice(0, historyRef.current.length - 64);
      }
    }
  }, [amount, prevAmount]);

  const chipItems = useChipStack(amount, denoms);
  const columns = splitIntoColumns(chipItems);

  const triggerBlocked = React.useCallback(
    (reason: BetBlockReason) => {
      if (onBlocked) {
        onBlocked(reason);
      }
      if (reason !== "disabled") {
        showFeedback(reasonMessage(reason, { min, max: normalizedMax, bankroll }));
      }
    },
    [bankroll, min, normalizedMax, onBlocked, showFeedback]
  );

  const commitChange = React.useCallback(
    (next: number, deltaSource?: { direction: HoldDirection; origin?: typeof HOLD_SOURCE }) => {
      const sanitizedNext = Math.floor(next);
      if (sanitizedNext === amount) {
        return false;
      }
      historyRef.current.push(amount);
      onChange(sanitizedNext);
      if (onCommit) {
        onCommit(sanitizedNext - amount);
      }
      if (deltaSource?.origin === HOLD_SOURCE) {
        const difference = sanitizedNext - amount;
        const magnitude = Math.abs(difference);
        if (magnitude > 0) {
          setDeltaHint((current) => {
            if (!current || current.direction !== deltaSource.direction) {
              return { direction: deltaSource.direction, amount: magnitude };
            }
            return {
              direction: current.direction,
              amount: current.amount + magnitude,
            };
          });
        }
      } else {
        setDeltaHint(null);
      }
      return true;
    },
    [amount, onChange, onCommit]
  );

  const evaluateAndCommit = React.useCallback(
    (
      target: number,
      options?: { direction: HoldDirection; origin?: typeof HOLD_SOURCE }
    ): boolean => {
      if (disabled) {
        triggerBlocked("disabled");
        return false;
      }
      const { value, reason } = clampValue(target, {
        min,
        max: normalizedMax,
        bankroll,
        canAffordMin,
      });
      const changed = commitChange(value, options);
      if (!changed && reason) {
        triggerBlocked(reason);
      }
      return changed;
    },
    [bankroll, canAffordMin, commitChange, disabled, min, normalizedMax, triggerBlocked]
  );

  const handleIncrement = React.useCallback(
    (step: number, origin?: typeof HOLD_SOURCE): boolean =>
      evaluateAndCommit(amount + step, { direction: "increment", origin }),
    [amount, evaluateAndCommit]
  );

  const handleDecrement = React.useCallback(
    (step: number, origin?: typeof HOLD_SOURCE): boolean =>
      evaluateAndCommit(amount - step, { direction: "decrement", origin }),
    [amount, evaluateAndCommit]
  );

  const plusHold = useHoldRepeat(() => handleIncrement(1, HOLD_SOURCE), {
    disabled: incrementsDisabled,
    onStop: prefersReducedMotion ? undefined : () => setDeltaHint(null),
  });
  const minusHold = useHoldRepeat(() => handleDecrement(1, HOLD_SOURCE), {
    disabled,
    onStop: prefersReducedMotion ? undefined : () => setDeltaHint(null),
  });

  const handlePlusClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const step = event.shiftKey ? 5 : 1;
      handleIncrement(step);
    },
    [handleIncrement]
  );

  const handleMinusClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const step = event.shiftKey ? 5 : 1;
      handleDecrement(step);
    },
    [handleDecrement]
  );

  const handleChipAdd = React.useCallback(
    (value: Denom) => handleIncrement(value),
    [handleIncrement]
  );

  const handleChipSubtract = React.useCallback(
    (value: Denom) => handleDecrement(value),
    [handleDecrement]
  );

  const [pulsingChip, setPulsingChip] = React.useState<{ value: Denom; direction: HoldDirection } | null>(
    null
  );
  const pulseTimer = React.useRef<number | null>(null);

  const triggerPulse = React.useCallback(
    (value: Denom, direction: HoldDirection) => {
      if (prefersReducedMotion) {
        return;
      }
      if (pulseTimer.current !== null) {
        window.clearTimeout(pulseTimer.current);
      }
      setPulsingChip({ value, direction });
      pulseTimer.current = window.setTimeout(() => {
        setPulsingChip(null);
        pulseTimer.current = null;
      }, 240);
    },
    [prefersReducedMotion]
  );

  React.useEffect(() => () => {
    if (pulseTimer.current !== null) {
      window.clearTimeout(pulseTimer.current);
    }
  }, []);

  const handleUndo = React.useCallback(() => {
    if (disabled) {
      triggerBlocked("disabled");
      return;
    }
    const previous = historyRef.current.pop() ?? null;
    if (previous === null) {
      if (onUndo) {
        onUndo(null);
      }
      return;
    }
    onChange(previous);
    if (onUndo) {
      onUndo(previous);
    }
    if (onCommit) {
      onCommit(previous - amount);
    }
  }, [amount, disabled, onChange, onCommit, onUndo, triggerBlocked]);

  const affordHint = !canAffordMin;

  return (
    <div className="nj-bet-control nj-glass">
      <div className="nj-bet-control__top">
        <div className="nj-bet-control__summary">
          <span className="nj-bet-control__label">Bet</span>
          <span className="nj-bet-control__amount">{formatEuro(amount)}</span>
          {!prefersReducedMotion && deltaHint ? (
            <span
              className={"nj-bet-control__delta"}
              data-direction={deltaHint.direction}
            >
              {deltaHint.direction === "increment" ? "+" : "-"}
              {deltaHint.amount}
            </span>
          ) : null}
        </div>
        {onUndo ? (
          <button
            type="button"
            className="nj-bet-control__undo"
            onClick={handleUndo}
            disabled={disabled || historyRef.current.length === 0}
            aria-label="Undo last bet adjustment"
          >
            Undo
          </button>
        ) : null}
      </div>

      <div className="nj-bet-control__stepper" aria-hidden={disabled}>
        <button
          type="button"
          className="nj-bet-control__step"
          onClick={handleMinusClick}
          disabled={disabled}
          {...minusHold}
        >
          −
        </button>
        <button
          type="button"
          className="nj-bet-control__step"
          onClick={handlePlusClick}
          disabled={incrementsDisabled}
          {...plusHold}
        >
          +
        </button>
      </div>

      <div className="nj-bet-control__rack" role="group" aria-label="Chip shortcuts">
        {denoms.map((value) => {
          const isPulsing = pulsingChip?.value === value;
          return (
            <ChipShortcut
              key={value}
              value={value}
              disabled={disabled}
              className={"nj-bet-chip" + (isPulsing ? " is-pulsing" : "")}
              onAdd={() => {
                if (handleChipAdd(value)) {
                  triggerPulse(value, "increment");
                }
              }}
              onSubtract={() => {
                if (handleChipSubtract(value)) {
                  triggerPulse(value, "decrement");
                }
              }}
              onContextMenu={(event) => {
                event.preventDefault();
                if (handleChipSubtract(value)) {
                  triggerPulse(value, "decrement");
                }
              }}
            />
          );
        })}
      </div>

      <div className="nj-bet-control__stack" aria-hidden={chipItems.length === 0}>
        {columns.map((column, columnIndex) => {
          const height = 44 + Math.max(0, column.length - 1) * 12;
          return (
            <div
              key={`column-${columnIndex}`}
              className="nj-bet-stack__column"
              style={{ height }}
            >
              {column.map((chip, index) => (
                <div
                  key={chip.id}
                  className="nj-bet-stack__chip"
                  style={{
                    zIndex: column.length - index,
                    bottom: index * 12,
                  }}
                >
                  <Chip
                    value={chip.value}
                    size={44}
                    className="nj-bet-stack__token"
                    disabled
                    aria-hidden
                    tabIndex={-1}
                  />
                </div>
              ))}
            </div>
          );
        })}
        {chipItems.length === 0 ? (
          <span className="nj-bet-stack__empty">No chips</span>
        ) : null}
      </div>

      <div className="nj-bet-control__footer" role="status" aria-live="polite">
        {affordHint ? (
          <span>Bankroll below minimum bet {formatEuro(min)}</span>
        ) : message ? (
          <span>{message}</span>
        ) : null}
      </div>
    </div>
  );
};
