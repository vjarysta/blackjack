import React from "react";

interface LongPressOptions {
  delay?: number;
  disabled?: boolean;
}

interface LongPressHandlers {
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerLeave: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLButtonElement>) => void;
}

export const useLongPress = (
  onLongPress: (event: React.PointerEvent<HTMLButtonElement>) => void,
  onTap: (event: React.PointerEvent<HTMLButtonElement>) => void,
  { delay = 400, disabled = false }: LongPressOptions = {}
): LongPressHandlers => {
  const timeoutRef = React.useRef<number | null>(null);
  const longPressTriggered = React.useRef(false);
  const disabledRef = React.useRef(disabled);
  const longPressRef = React.useRef(onLongPress);
  const tapRef = React.useRef(onTap);

  React.useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  React.useEffect(() => {
    longPressRef.current = onLongPress;
  }, [onLongPress]);

  React.useEffect(() => {
    tapRef.current = onTap;
  }, [onTap]);

  const clearTimeoutRef = React.useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  React.useEffect(() => () => clearTimeoutRef(), [clearTimeoutRef]);

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (disabledRef.current) {
        return;
      }
      if (event.button !== undefined && event.button !== 0) {
        return;
      }
      longPressTriggered.current = false;
      if (event.currentTarget.setPointerCapture) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      clearTimeoutRef();
      timeoutRef.current = window.setTimeout(() => {
        longPressTriggered.current = true;
        longPressRef.current(event);
      }, delay);
    },
    [clearTimeoutRef, delay]
  );

  const handlePointerEnd = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, shouldTriggerTap: boolean) => {
      if (disabledRef.current) {
        return;
      }
      if (
        event.currentTarget.releasePointerCapture &&
        event.currentTarget.hasPointerCapture &&
        event.currentTarget.hasPointerCapture(event.pointerId)
      ) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      const triggered = longPressTriggered.current;
      clearTimeoutRef();
      if (!triggered && shouldTriggerTap) {
        tapRef.current(event);
      }
      longPressTriggered.current = false;
    },
    [clearTimeoutRef]
  );

  const handlePointerLeave = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      handlePointerEnd(event, false);
    },
    [handlePointerEnd]
  );

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: (event) => handlePointerEnd(event, true),
    onPointerLeave: handlePointerLeave,
    onPointerCancel: handlePointerLeave,
  };
};
