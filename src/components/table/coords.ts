import type { Seat } from "../../engine/types";

export interface SeatAnchor {
  index: number;
  label: string;
  x: number;
  y: number;
}

export interface TableAnchors {
  viewBox: {
    width: number;
    height: number;
  };
  seatRadius: number;
  seatLabelOffset: number;
  seatArc: {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    startDeg: number;
    endDeg: number;
  };
  seats: SeatAnchor[];
  dealerArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  shoeAnchor: { x: number; y: number };
  discardAnchor: { x: number; y: number };
  outerTextPath: string;
  innerTextPath: string;
}

const VIEWBOX_WIDTH = 1200;
const VIEWBOX_HEIGHT = 800;

const SEAT_COUNT = 7;
const START_DEG = -60;
const END_DEG = 240;

const computeSeatAnchors = (
  cx: number,
  cy: number,
  rx: number,
  ry: number
): SeatAnchor[] => {
  const step = (END_DEG - START_DEG) / (SEAT_COUNT - 1);
  return Array.from({ length: SEAT_COUNT }, (_, index) => {
    const theta = ((START_DEG + index * step) * Math.PI) / 180;
    const x = cx + rx * Math.cos(theta);
    const y = cy + ry * Math.sin(theta);
    return {
      index,
      label: `Seat ${index + 1}`,
      x,
      y
    };
  });
};

const buildArcPath = (cx: number, cy: number, rx: number, ry: number): string => {
  const startX = cx - rx;
  const startY = cy;
  const endX = cx + rx;
  const endY = cy;
  return `M ${startX} ${startY} A ${rx} ${ry} 0 0 1 ${endX} ${endY}`;
};

export const defaultTableAnchors: TableAnchors = {
  viewBox: {
    width: VIEWBOX_WIDTH,
    height: VIEWBOX_HEIGHT
  },
  seatRadius: 60,
  seatLabelOffset: 90,
  seatArc: {
    cx: VIEWBOX_WIDTH / 2,
    cy: 540,
    rx: 420,
    ry: 250,
    startDeg: START_DEG,
    endDeg: END_DEG
  },
  seats: computeSeatAnchors(VIEWBOX_WIDTH / 2, 540, 420, 250),
  dealerArea: {
    x: 470,
    y: 130,
    width: 260,
    height: 130
  },
  shoeAnchor: {
    x: 940,
    y: 190
  },
  discardAnchor: {
    x: 260,
    y: 190
  },
  outerTextPath: buildArcPath(VIEWBOX_WIDTH / 2, 210, 360, 180),
  innerTextPath: buildArcPath(VIEWBOX_WIDTH / 2, 290, 300, 150)
};

export const mapSeatAnchors = <T>(seats: Seat[], mapper: (seat: Seat, anchor: SeatAnchor) => T): T[] =>
  seats.map((seat) => {
    const anchor = defaultTableAnchors.seats[seat.index];
    return mapper(seat, anchor);
  });

export const toPixels = (
  x: number,
  y: number,
  dimensions: { width: number; height: number }
): { x: number; y: number } => {
  const scaleX = dimensions.width / defaultTableAnchors.viewBox.width;
  const scaleY = dimensions.height / defaultTableAnchors.viewBox.height;
  return {
    x: x * scaleX,
    y: y * scaleY
  };
};
