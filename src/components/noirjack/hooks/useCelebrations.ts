import * as React from "react";
import type { FireworksOverlayHandle } from "../../effects/FireworksOverlay";

interface UseCelebrationsArgs {
  enabled: boolean;
  prefersReduced: boolean;
}

export function useCelebrations({
  enabled,
  prefersReduced,
}: UseCelebrationsArgs) {
  const ref = React.useRef<FireworksOverlayHandle | null>(null);

  const start = React.useCallback(
    (duration: number) => {
      if (!enabled) {
        return;
      }
      ref.current?.start(duration);
    },
    [enabled]
  );

  const stop = React.useCallback(() => {
    ref.current?.stop();
  }, []);

  React.useEffect(() => {
    if (!enabled) {
      ref.current?.stop();
    }
  }, [enabled]);

  const intensity = prefersReduced ? "reduced" : "default";

  return { ref, start, stop, intensity } as const;
}
