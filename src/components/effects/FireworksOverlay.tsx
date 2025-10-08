import React from "react";
import { Fireworks, type FireworksOptions } from "fireworks-js";
import { cn } from "../../utils/cn";

export interface FireworksOverlayHandle {
  start(durationMs?: number): void;
  stop(): void;
}

interface FireworksOverlayProps {
  disabled?: boolean;
  intensity?: "default" | "reduced";
  className?: string;
}

const MIN_DURATION = 1200;

const createOptions = (intensity: "default" | "reduced"): FireworksOptions => {
  const softened = intensity === "reduced";
  const particles = softened ? 45 : 80;
  const explosion = softened ? 4.2 : 5.4;
  const intensityValue = softened ? 22 : 34;
  return {
    hue: { min: 38, max: 165 },
    brightness: { min: 55, max: 85 },
    opacity: 0.38,
    acceleration: 1.02,
    friction: 0.96,
    gravity: 1.55,
    particles,
    explosion,
    intensity: intensityValue,
    traceLength: softened ? 3 : 3.5,
    traceSpeed: softened ? 1.6 : 1.9,
    lineWidth: {
      trace: { min: 0.6, max: 1.1 },
      explosion: { min: 1.3, max: 1.9 }
    },
    decay: { min: 0.012, max: 0.028 },
    flickering: softened ? 35 : 48,
    delay: { min: softened ? 22 : 16, max: softened ? 32 : 26 },
    mouse: { click: false, move: false, max: 0 },
    sound: { enabled: false, files: [], volume: { min: 0, max: 0 } },
    autoresize: true,
    rocketsPoint: { min: 20, max: 80 },
  };
};

export const FireworksOverlay = React.forwardRef<FireworksOverlayHandle, FireworksOverlayProps>(
  ({ disabled = false, intensity = "default", className }, ref) => {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const fireworksRef = React.useRef<Fireworks | null>(null);
    const stopTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const options = React.useMemo(() => createOptions(intensity), [intensity]);

    const stopInternal = React.useCallback(() => {
      if (stopTimerRef.current !== null) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
      const instance = fireworksRef.current;
      if (instance) {
        instance.stop();
        instance.clear();
      }
    }, []);

    const ensureInstance = React.useCallback((): Fireworks | null => {
      if (!containerRef.current) {
        return null;
      }
      if (!fireworksRef.current) {
        fireworksRef.current = new Fireworks(containerRef.current, options);
        return fireworksRef.current;
      }
      fireworksRef.current.updateOptions(options);
      return fireworksRef.current;
    }, [options]);

    const start = React.useCallback(
      (durationMs?: number) => {
        if (disabled) {
          return;
        }
        const instance = ensureInstance();
        if (!instance) {
          return;
        }
        stopInternal();
        instance.updateOptions(options);
        instance.start();
        const duration = Math.max(MIN_DURATION, durationMs ?? 3200);
        const schedule =
          typeof window !== "undefined"
            ? window.setTimeout
            : (fn: () => void, ms?: number) => setTimeout(fn, ms);
        stopTimerRef.current = schedule(() => {
          stopInternal();
        }, duration);
      },
      [disabled, ensureInstance, options, stopInternal]
    );

    React.useImperativeHandle(
      ref,
      () => ({
        start,
        stop: stopInternal,
      }),
      [start, stopInternal]
    );

    React.useEffect(() => () => {
      stopInternal();
      fireworksRef.current?.stop(true);
      fireworksRef.current = null;
    }, [stopInternal]);

    React.useEffect(() => {
      if (typeof document === "undefined") {
        return;
      }
      const handleVisibility = (): void => {
        if (document.hidden) {
          stopInternal();
        }
      };
      document.addEventListener("visibilitychange", handleVisibility);
      return () => {
        document.removeEventListener("visibilitychange", handleVisibility);
      };
    }, [stopInternal]);

    return <div ref={containerRef} className={cn("nj-fireworks", className)} aria-hidden />;
  }
);

FireworksOverlay.displayName = "FireworksOverlay";
