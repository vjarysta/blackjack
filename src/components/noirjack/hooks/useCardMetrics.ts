import React from "react";

const clamp = (min: number, value: number, max: number): number => Math.min(max, Math.max(min, value));

export interface CardMetrics {
  width: number;
  height: number;
}

const CARD_ASPECT_RATIO = 1.4;
const MIN_CARD_WIDTH = 64;
const MAX_CARD_WIDTH = 132;
const MIN_CARD_HEIGHT = MIN_CARD_WIDTH * CARD_ASPECT_RATIO;
const MAX_CARD_HEIGHT = MAX_CARD_WIDTH * CARD_ASPECT_RATIO;
const MAX_SECTION_RATIO = 0.28;

const getViewport = (): { width: number; height: number } => {
  if (typeof window === "undefined") {
    return { width: 360, height: 720 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
};

export const computeCardMetrics = (
  containerWidth: number,
  viewport: { width: number; height: number } = getViewport()
): CardMetrics => {
  const basisWidth = containerWidth > 0 ? containerWidth : viewport.width;
  const widthFromWidth = clamp(MIN_CARD_WIDTH, basisWidth * 0.24, MAX_CARD_WIDTH);
  const maxCardHeight = clamp(MIN_CARD_HEIGHT, viewport.height * MAX_SECTION_RATIO, MAX_CARD_HEIGHT);
  const widthFromHeight = clamp(MIN_CARD_WIDTH, maxCardHeight / CARD_ASPECT_RATIO, MAX_CARD_WIDTH);
  const width = Math.round(Math.min(widthFromWidth, widthFromHeight));
  const height = Math.round(width * CARD_ASPECT_RATIO);
  return { width, height };
};

export const useCardMetrics = (containerWidth: number): CardMetrics => {
  const widthRef = React.useRef(containerWidth);
  const [metrics, setMetrics] = React.useState<CardMetrics>(() => computeCardMetrics(containerWidth));

  React.useEffect(() => {
    widthRef.current = containerWidth;
    setMetrics(computeCardMetrics(containerWidth));
  }, [containerWidth]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleResize = () => {
      setMetrics(computeCardMetrics(widthRef.current));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
