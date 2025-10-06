import type { Seat } from "../../engine/types";

export interface SeatAnchor {
  index: number;
  label: string;
  x: number;
  y: number;
}

export type Point = { x: number; y: number };

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

export type TableAnchorPoints = { shoe: Point; dealer: Point; seats: Point[] };

const VIEWBOX_WIDTH = 1500;
const VIEWBOX_HEIGHT = 800;

const SEAT_COUNT = 5;
const START_DEG = -72;
const END_DEG = 252;

const computeSeatAnchors = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seatCount: number
): SeatAnchor[] => {
  const step = (END_DEG - START_DEG) / (seatCount - 1);
  return Array.from({ length: seatCount }, (_, index) => {
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
  seatRadius: 56,
  seatLabelOffset: 104,
  seatArc: {
    cx: VIEWBOX_WIDTH / 2,
    cy: 492,
    rx: 500,
    ry: 220,
    startDeg: START_DEG,
    endDeg: END_DEG
  },
  seats: computeSeatAnchors(VIEWBOX_WIDTH / 2, 492, 500, 220, SEAT_COUNT).map((anchor, index) => ({
    ...anchor,
    index,
    label: `Seat ${index + 1}`
  })),
  dealerArea: {
    x: 588,
    y: 138,
    width: 325,
    height: 130
  },
  shoeAnchor: {
    x: 1165,
    y: 200
  },
  discardAnchor: {
    x: 338,
    y: 200
  },
  outerTextPath: buildArcPath(VIEWBOX_WIDTH / 2, 202, 438, 180),
  innerTextPath: buildArcPath(VIEWBOX_WIDTH / 2, 248, 360, 150)
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

export const getTableAnchorPoints = (dimensions: { width: number; height: number }): TableAnchorPoints => {
  const shoe = toPixels(defaultTableAnchors.shoeAnchor.x, defaultTableAnchors.shoeAnchor.y, dimensions);
  const dealer = toPixels(
    defaultTableAnchors.dealerArea.x + defaultTableAnchors.dealerArea.width / 2,
    defaultTableAnchors.dealerArea.y + defaultTableAnchors.dealerArea.height / 2,
    dimensions
  );
  const seats = defaultTableAnchors.seats.map((anchor) => toPixels(anchor.x, anchor.y, dimensions));
  return { shoe, dealer, seats };
};
