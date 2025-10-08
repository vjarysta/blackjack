import React from "react";

interface HoldRepeatOptions {
  disabled?: boolean;
  initialDelay?: number;
  repeatInterval?: number;
  onStop?: () => void;
}

interface HoldHandlers {
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
}

export const useHoldRepeat = (
  action: () => void,
  { disabled = false, initialDelay = 350, repeatInterval = 70, onStop }: HoldRepeatOptions = {}
): HoldHandlers => {
  const actionRef = React.useRef(action);
  const disabledRef = React.useRef(disabled);
  const timeoutRef = React.useRef<number | null>(null);
  const intervalRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    actionRef.current = action;
  }, [action]);

  React.useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const clearTimers = React.useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (onStop) {
      onStop();
    }
  }, [onStop]);

  React.useEffect(() => () => clearTimers(), [clearTimers]);

  const start = React.useCallback(() => {
    if (disabledRef.current) {
      return;
    }
    actionRef.current();
    timeoutRef.current = window.setTimeout(() => {
      intervalRef.current = window.setInterval(() => {
        actionRef.current();
      }, repeatInterval);
    }, initialDelay);
  }, [initialDelay, repeatInterval]);

  return {
    onPointerDown: () => {
      start();
    },
    onPointerUp: clearTimers,
    onPointerLeave: clearTimers,
    onPointerCancel: clearTimers,
  };
};
