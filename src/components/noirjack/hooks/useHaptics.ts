import * as React from "react";

export function useHaptics(disabled: boolean): () => void {
  return React.useCallback(() => {
    if (disabled || typeof window === "undefined" || typeof navigator === "undefined") {
      return;
    }
    if (typeof navigator.vibrate === "function") {
      navigator.vibrate(12);
    }
  }, [disabled]);
}
