import React from "react";

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

export interface CardMetrics {
  cardWidth: number;
  cardHeight: number;
  overlap: (count: number) => number;
  fanWidth: (count: number) => number;
  positions: (count: number) => { left: number }[];
}

const BASE_WIDTH = 92;

export const useCardMetrics = (): CardMetrics => {
  const [viewportWidth, setViewportWidth] = React.useState<number>(() =>
    typeof window === "undefined" ? 375 : window.innerWidth
  );

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const cardWidth = clamp(0.24 * viewportWidth, 72, 128);
  const cardHeight = Math.round(cardWidth * 1.4);

  const overlap = React.useCallback(
    (count: number) => {
      const factor = count > 5 ? 0.28 : 0.35;
      return Math.max(12, Math.round(cardWidth * factor));
    },
    [cardWidth]
  );

  const fanWidth = React.useCallback(
    (count: number) => {
      if (count <= 0) {
        return cardWidth;
      }
      const spacing = cardWidth - overlap(count);
      return cardWidth + Math.max(0, count - 1) * spacing;
    },
    [cardWidth, overlap]
  );

  const positions = React.useCallback(
    (count: number) => {
      if (count <= 0) {
        return [];
      }
      const spacing = cardWidth - overlap(count);
      return Array.from({ length: count }, (_, index) => ({ left: index * spacing }));
    },
    [cardWidth, overlap]
  );

  return { cardWidth, cardHeight, overlap, fanWidth, positions };
};

export const scaleForCardWidth = (targetWidth: number): number => targetWidth / BASE_WIDTH;
