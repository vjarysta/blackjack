import React from "react";

const clamp = (min: number, value: number, max: number): number => Math.min(max, Math.max(min, value));

export interface CardMetrics {
  width: number;
  height: number;
}

const computeMetrics = (containerWidth: number): CardMetrics => {
  const vw = containerWidth > 0 ? containerWidth : typeof window !== "undefined" ? window.innerWidth : 360;
  const width = Math.round(clamp(72, vw * 0.24, 128));
  const height = Math.round(width * 1.4);
  return { width, height };
};

export const useCardMetrics = (containerWidth: number): CardMetrics => {
  const [metrics, setMetrics] = React.useState<CardMetrics>(() => computeMetrics(containerWidth));

  React.useEffect(() => {
    setMetrics(computeMetrics(containerWidth));
  }, [containerWidth]);

  return metrics;
};

export const useResizeObserver = <T extends HTMLElement>(): [React.RefObject<T>, number] => {
  const ref = React.useRef<T>(null);
  const [width, setWidth] = React.useState<number>(0);

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect?.width) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(element);
    setWidth(element.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
};
