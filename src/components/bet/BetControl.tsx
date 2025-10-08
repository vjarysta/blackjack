import React from "react";
import { ChipSVG } from "../table/ChipSVG";
import type { ChipDenomination } from "../../theme/palette";
import { cn } from "../../utils/cn";
import { formatCurrency } from "../../utils/currency";
import { diffStacks, makeChange, type Denomination } from "../../utils/chips";

type BetControlProps = {
  amount: number;
  min: number;
  max: number;
  bankroll: number;
  disabled?: boolean;
  onChange: (amount: number) => void;
};

type Hint = "min" | "max" | "bankroll" | null;

type ChipItem = {
  id: string;
  denom: Denomination;
};

const CHIP_VALUES: ChipDenomination[] = [1, 5, 25, 100, 500];
const STACK_SIZE = 10;

const useHoldRepeat = (action: () => void, disabled: boolean) => {
  const actionRef = React.useRef(action);
  actionRef.current = action;

  const timers = React.useRef<{ timeout: number | null; interval: number | null }>({
    timeout: null,
    interval: null
  });

  const clearTimers = React.useCallback(() => {
    if (timers.current.timeout !== null) {
      window.clearTimeout(timers.current.timeout);
      timers.current.timeout = null;
    }
    if (timers.current.interval !== null) {
      window.clearInterval(timers.current.interval);
      timers.current.interval = null;
    }
  }, []);

  const start = React.useCallback(() => {
    if (disabled) {
      return;
    }
    if (timers.current.timeout !== null || timers.current.interval !== null) {
      return;
    }
    timers.current.timeout = window.setTimeout(() => {
      timers.current.interval = window.setInterval(() => {
        actionRef.current();
      }, 80);
    }, 350);
  }, [disabled]);

  const stop = React.useCallback(() => {
    clearTimers();
  }, [clearTimers]);

  React.useEffect(() => stop, [stop]);

  return { start, stop };
};

const useChipPulse = () => {
  const [pulse, setPulse] = React.useState<{ value: ChipDenomination; mode: "add" | "remove" } | null>(
    null
  );

  const trigger = React.useCallback((value: ChipDenomination, mode: "add" | "remove") => {
    setPulse({ value, mode });
  }, []);

  React.useEffect(() => {
    if (!pulse) {
      return;
    }
    const timer = window.setTimeout(() => {
      setPulse(null);
    }, 260);
    return () => {
      window.clearTimeout(timer);
    };
  }, [pulse]);

  return { pulse, trigger };
};

const useDeltaFeedback = () => {
  const [feedback, setFeedback] = React.useState<{ value: number; key: number } | null>(null);

  React.useEffect(() => {
    if (!feedback) {
      return;
    }
    const timer = window.setTimeout(() => {
      setFeedback(null);
    }, 600);
    return () => {
      window.clearTimeout(timer);
    };
  }, [feedback]);

  return {
    feedback,
    show(value: number) {
      setFeedback({ value, key: Date.now() });
    }
  };
};

const useLongPress = (
  tap: () => void,
  hold: () => void,
  disabled: boolean
): {
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
} => {
  const timerRef = React.useRef<number | null>(null);
  const triggeredRef = React.useRef(false);

  const clearTimer = React.useCallback(
    (shouldTap: boolean) => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (!triggeredRef.current && shouldTap && !disabled) {
        tap();
      }
      triggeredRef.current = false;
    },
    [disabled, tap]
  );

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled) {
        return;
      }
      event.preventDefault();
      triggeredRef.current = false;
      timerRef.current = window.setTimeout(() => {
        triggeredRef.current = true;
        hold();
      }, 400);
    },
    [disabled, hold]
  );

  const onPointerUp = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled) {
        return;
      }
      event.preventDefault();
      clearTimer(true);
    },
    [clearTimer, disabled]
  );

  const onPointerLeave = React.useCallback(() => {
    clearTimer(false);
  }, [clearTimer]);

  React.useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { onPointerDown, onPointerUp, onPointerLeave, onPointerCancel: onPointerLeave };
};

type ChipButtonProps = {
  value: ChipDenomination;
  disabled: boolean;
  pulse: ReturnType<typeof useChipPulse>["pulse"];
  onAdd: (value: ChipDenomination) => boolean;
  onSubtract: (value: ChipDenomination) => boolean;
  onPulse: (value: ChipDenomination, mode: "add" | "remove") => void;
};

const BetChipButton: React.FC<ChipButtonProps> = ({ value, disabled, pulse, onAdd, onSubtract, onPulse }) => {
  const handlers = useLongPress(
    () => {
      if (onAdd(value)) {
        onPulse(value, "add");
      }
    },
    () => {
      if (onSubtract(value)) {
        onPulse(value, "remove");
      }
    },
    disabled
  );

  return (
    <button
      type="button"
      className={cn(
        "relative flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/40 bg-emerald-950/60 text-emerald-50 shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition",
        "hover:border-amber-300/80 hover:bg-emerald-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60",
        disabled && "opacity-50"
      )}
      aria-label={`Chip ${value} euros`}
      disabled={disabled}
      onPointerDown={handlers.onPointerDown}
      onPointerUp={handlers.onPointerUp}
      onPointerLeave={handlers.onPointerLeave}
      onPointerCancel={handlers.onPointerCancel}
      onContextMenu={(event) => {
        event.preventDefault();
        if (disabled) {
          return;
        }
        if (onSubtract(value)) {
          onPulse(value, "remove");
        }
      }}
    >
      <ChipSVG
        value={value}
        size={60}
        className={cn(
          "transition-transform motion-safe:duration-200",
          pulse?.value === value && pulse.mode === "add" && "motion-safe:scale-105",
          pulse?.value === value && pulse.mode === "remove" && "motion-safe:scale-95"
        )}
      />
    </button>
  );
};

export const BetControl: React.FC<BetControlProps> = ({
  amount,
  min,
  max,
  bankroll,
  disabled = false,
  onChange
}) => {
  const maxCap = Number.isFinite(max) ? max : Number.POSITIVE_INFINITY;
  const effectiveMax = Math.min(maxCap, bankroll);
  const insufficientBankroll = effectiveMax < min;
  const controlsDisabled = disabled || insufficientBankroll;

  const betRef = React.useRef(amount);
  const historyRef = React.useRef<number[]>([]);
  const lastControlledChange = React.useRef<number | null>(null);
  const [historySize, setHistorySize] = React.useState(0);
  const idCounterRef = React.useRef(0);
  const { pulse, trigger } = useChipPulse();
  const { feedback, show } = useDeltaFeedback();
  const [hint, setHint] = React.useState<Hint>(null);

  React.useEffect(() => {
    betRef.current = amount;
    if (lastControlledChange.current === amount) {
      lastControlledChange.current = null;
      return;
    }
    if (historyRef.current.length > 0) {
      historyRef.current = [];
      setHistorySize(0);
    }
  }, [amount]);

  const [chipItems, setChipItems] = React.useState<ChipItem[]>(() => {
    const initial = makeChange(amount);
    idCounterRef.current = initial.length;
    return initial.map((denom, index) => ({ id: `chip-${index}`, denom }));
  });

  React.useEffect(() => {
    setChipItems((prev) => {
      const prevDenoms = prev.map((chip) => chip.denom);
      const nextDenoms = makeChange(amount);
      const diff = diffStacks(prevDenoms, nextDenoms);
      const pool = [...prev];

      diff.remove.forEach((denom) => {
        const removeIndex = pool.findIndex((chip) => chip.denom === denom);
        if (removeIndex >= 0) {
          pool.splice(removeIndex, 1);
        }
      });

      const used = new Set<number>();
      const next: ChipItem[] = nextDenoms.map((denom) => {
        const matchIndex = pool.findIndex((chip, index) => !used.has(index) && chip.denom === denom);
        if (matchIndex >= 0) {
          used.add(matchIndex);
          return pool[matchIndex];
        }
        idCounterRef.current += 1;
        return { id: `chip-${idCounterRef.current}`, denom };
      });

      return next;
    });
  }, [amount]);

  const applyDelta = React.useCallback(
    (delta: number) => {
      if (controlsDisabled || delta === 0) {
        if (controlsDisabled) {
          setHint("bankroll");
        }
        return false;
      }

      const current = betRef.current;
      const direction = Math.sign(delta);

      if (direction < 0 && current <= min) {
        setHint("min");
        return false;
      }
      if (direction > 0 && current >= effectiveMax) {
        setHint("max");
        return false;
      }

      const raw = Math.floor(current + delta);
      let next = Math.max(0, Math.min(raw, effectiveMax));

      if (direction > 0 && next < min) {
        next = min;
      }
      if (direction < 0 && current > min && next < min) {
        next = min;
      }

      if (next === current) {
        if (direction > 0) {
          setHint("max");
        } else if (direction < 0) {
          setHint("min");
        }
        return false;
      }

      historyRef.current = [...historyRef.current.slice(-9), current];
      setHistorySize(historyRef.current.length);
      betRef.current = next;
      onChange(next);
      lastControlledChange.current = next;
      show(next - current);
      setHint(null);
      return true;
    },
    [controlsDisabled, effectiveMax, min, onChange, show]
  );

  const handleUndo = React.useCallback(() => {
    if (controlsDisabled) {
      setHint("bankroll");
      return;
    }
    const history = historyRef.current;
    const previous = history.pop();
    if (previous === undefined) {
      return;
    }
    betRef.current = previous;
    onChange(previous);
    lastControlledChange.current = previous;
    show(previous - amount);
    setHint(null);
    setHistorySize(history.length);
  }, [amount, controlsDisabled, onChange, show]);

  const increaseHold = useHoldRepeat(() => applyDelta(1), controlsDisabled);
  const decreaseHold = useHoldRepeat(() => applyDelta(-1), controlsDisabled);

  const handleStepperPointerDown = React.useCallback(
    (
      event: React.PointerEvent<HTMLButtonElement>,
      delta: number,
      hold: { start: () => void; stop: () => void }
    ) => {
      if (controlsDisabled) {
        setHint("bankroll");
        return;
      }
      event.preventDefault();
      const multiplier = event.shiftKey ? 5 : 1;
      applyDelta(delta * multiplier);
      if (!event.shiftKey) {
        hold.start();
      }
    },
    [applyDelta, controlsDisabled]
  );

  const handleStepperPointerEnd = React.useCallback(
    (
      event: React.PointerEvent<HTMLButtonElement>,
      hold: { stop: () => void }
    ) => {
      if (controlsDisabled) {
        return;
      }
      event.preventDefault();
      hold.stop();
    },
    [controlsDisabled]
  );

  const stackColumns = React.useMemo(() => {
    const columns: ChipItem[][] = [];
    for (let index = 0; index < chipItems.length; index += STACK_SIZE) {
      columns.push(chipItems.slice(index, index + STACK_SIZE));
    }
    return columns;
  }, [chipItems]);

  const hintMessage = React.useMemo(() => {
    if (insufficientBankroll) {
      return `Need ${formatCurrency(min)} bankroll to bet`;
    }
    if (hint === "max") {
      return Number.isFinite(effectiveMax) ? `Max ${formatCurrency(effectiveMax)}` : "Max bet reached";
    }
    if (hint === "min") {
      return `Min ${formatCurrency(min)}`;
    }
    if (hint === "bankroll") {
      return "Insufficient bankroll";
    }
    return null;
  }, [effectiveMax, hint, insufficientBankroll, min]);

  return (
    <div
      className={cn(
        "relative rounded-3xl border border-amber-400/30 bg-emerald-950/70 px-5 py-6 text-emerald-50 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur",
        controlsDisabled && "opacity-75"
      )}
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />

      <div className="flex flex-col items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-emerald-200">Bet</span>
        <div className="relative flex items-center justify-center">
          <span className="text-4xl font-semibold tracking-tight" aria-live="polite">
            {formatCurrency(amount)}
          </span>
          {feedback && (
            <span
              key={feedback.key}
              className={cn(
                "absolute -right-16 rounded-full border px-2 py-1 text-xs font-semibold text-emerald-100 shadow-lg backdrop-blur",
                feedback.value >= 0
                  ? "border-emerald-400/70 bg-emerald-900/80"
                  : "border-rose-400/70 bg-rose-900/70 text-rose-100"
              )}
              aria-live="polite"
            >
              {feedback.value >= 0 ? "+" : ""}
              {feedback.value}
            </span>
          )}
        </div>
        {hintMessage && (
          <p className="text-xs text-emerald-200/80" aria-live="polite">
            {hintMessage}
          </p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          type="button"
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/40 bg-emerald-900/70 text-3xl font-bold text-emerald-50 transition",
            "hover:bg-emerald-900/80 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60",
            controlsDisabled && "opacity-50"
          )}
          aria-label="Decrease bet"
          disabled={controlsDisabled}
          onPointerDown={(event) => handleStepperPointerDown(event, -1, decreaseHold)}
          onPointerUp={(event) => handleStepperPointerEnd(event, decreaseHold)}
          onPointerLeave={(event) => handleStepperPointerEnd(event, decreaseHold)}
          onPointerCancel={(event) => handleStepperPointerEnd(event, decreaseHold)}
          onKeyDown={(event) => {
            if (controlsDisabled) {
              return;
            }
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              applyDelta(-1 * (event.shiftKey ? 5 : 1));
            }
          }}
        >
          −
        </button>
        <button
          type="button"
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/40 bg-emerald-900/70 text-3xl font-bold text-emerald-50 transition",
            "hover:bg-emerald-900/80 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60",
            controlsDisabled && "opacity-50"
          )}
          aria-label="Increase bet"
          disabled={controlsDisabled}
          onPointerDown={(event) => handleStepperPointerDown(event, 1, increaseHold)}
          onPointerUp={(event) => handleStepperPointerEnd(event, increaseHold)}
          onPointerLeave={(event) => handleStepperPointerEnd(event, increaseHold)}
          onPointerCancel={(event) => handleStepperPointerEnd(event, increaseHold)}
          onKeyDown={(event) => {
            if (controlsDisabled) {
              return;
            }
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              applyDelta(1 * (event.shiftKey ? 5 : 1));
            }
          }}
        >
          +
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between text-[10px] uppercase tracking-[0.45em] text-emerald-200">
          <span>Chip rack</span>
          <span className="text-[9px] tracking-[0.3em] text-emerald-300/80">Tap add · Hold subtract</span>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {CHIP_VALUES.map((value) => (
            <BetChipButton
              key={value}
              value={value}
              disabled={controlsDisabled}
              pulse={pulse}
              onAdd={(chipValue) => applyDelta(chipValue)}
              onSubtract={(chipValue) => applyDelta(-chipValue)}
              onPulse={trigger}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        {stackColumns.length === 0 ? (
          <div className="rounded-full border border-emerald-500/30 bg-emerald-900/40 px-4 py-2 text-xs text-emerald-200/80">
            No chips placed
          </div>
        ) : (
          <div className="flex justify-center gap-4">
            {stackColumns.map((column, columnIndex) => (
              <div key={`column-${columnIndex}`} className="relative h-24 w-16">
                {column.map((chip, index) => (
                  <ChipSVG
                    key={chip.id}
                    value={chip.denom}
                    size={52}
                    shadow={index === column.length - 1}
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{ bottom: index * 12 }}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          className={cn(
            "rounded-full border border-amber-400/40 bg-emerald-900/60 px-3 py-1 text-xs uppercase tracking-[0.3em] text-emerald-200 transition",
            "hover:border-amber-300/70 hover:text-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60",
            (controlsDisabled || historySize === 0) && "opacity-50"
          )}
          onClick={handleUndo}
          disabled={controlsDisabled || historySize === 0}
        >
          Undo
        </button>
      </div>
    </div>
  );
};

