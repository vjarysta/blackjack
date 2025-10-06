import React from "react";
import { Icon } from "@iconify/react";
import { palette } from "../../theme/palette";
import { defaultTableAnchors, type SeatAnchor, type TableAnchors } from "./coords";

export interface SeatVisualState {
  index: number;
  occupied: boolean;
  hasBet: boolean;
  isActive: boolean;
  label: string;
}

interface TableSurfaceSVGProps {
  className?: string;
  seats: SeatVisualState[];
  onLayout?: (layout: TableAnchors) => void;
}

const SEAT_RING_BASE = "rgba(234, 233, 225, 0.45)";

export const TableSurfaceSVG: React.FC<TableSurfaceSVGProps> = ({ className, seats, onLayout }) => {
  const outerTextId = React.useId();
  const innerTextId = React.useId();

  React.useEffect(() => {
    onLayout?.(defaultTableAnchors);
  }, [onLayout]);

  const seatByIndex = React.useMemo(() => {
    const map = new Map<number, SeatVisualState>();
    for (const seat of seats) {
      map.set(seat.index, seat);
    }
    return map;
  }, [seats]);

  const seatCircleStroke = (seat: SeatVisualState | undefined): string => {
    if (!seat) {
      return SEAT_RING_BASE;
    }
    if (seat.isActive) {
      return palette.gold;
    }
    if (seat.hasBet) {
      return "rgba(200, 162, 74, 0.7)";
    }
    if (seat.occupied) {
      return "rgba(255, 255, 255, 0.4)";
    }
    return "rgba(255, 255, 255, 0.15)";
  };

  return (
    <svg
      viewBox={`0 0 ${defaultTableAnchors.viewBox.width} ${defaultTableAnchors.viewBox.height}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="feltGradient" cx="50%" cy="40%" r="75%">
          <stop offset="0%" stopColor={palette.felt.light} />
          <stop offset="100%" stopColor={palette.felt.dark} />
        </radialGradient>
      </defs>

      <rect
        x={60}
        y={50}
        width={defaultTableAnchors.viewBox.width - 120}
        height={defaultTableAnchors.viewBox.height - 120}
        rx={220}
        fill="url(#feltGradient)"
        stroke={palette.gold}
        strokeWidth={3}
      />

      <rect
        x={defaultTableAnchors.dealerArea.x}
        y={defaultTableAnchors.dealerArea.y}
        width={defaultTableAnchors.dealerArea.width}
        height={defaultTableAnchors.dealerArea.height}
        rx={40}
        fill="rgba(15, 45, 34, 0.6)"
        stroke="rgba(200, 162, 74, 0.4)"
        strokeWidth={2}
      />

      <path id={outerTextId} d={defaultTableAnchors.outerTextPath} fill="none" />
      <path id={innerTextId} d={defaultTableAnchors.innerTextPath} fill="none" />

      <text fill={palette.line} fontSize={32} fontWeight={600} letterSpacing={6} textAnchor="middle">
        <textPath startOffset="50%" xlinkHref={`#${outerTextId}`}>BLACKJACK PAYS 3 TO 2</textPath>
      </text>
      <text fill={palette.line} fontSize={24} fontWeight={500} letterSpacing={8} textAnchor="middle">
        <textPath startOffset="50%" xlinkHref={`#${innerTextId}`}>INSURANCE PAYS 2 TO 1</textPath>
      </text>

      {defaultTableAnchors.seats.map((anchor: SeatAnchor) => {
        const seat = seatByIndex.get(anchor.index);
        return (
          <g key={anchor.index}>
            <circle
              cx={anchor.x}
              cy={anchor.y}
              r={defaultTableAnchors.seatRadius}
              fill="rgba(15, 46, 36, 0.75)"
              stroke={seatCircleStroke(seat)}
              strokeWidth={seat?.isActive ? 4 : 2.5}
            />
            <circle
              cx={anchor.x}
              cy={anchor.y}
              r={defaultTableAnchors.seatRadius - 10}
              fill="rgba(11, 37, 32, 0.8)"
              stroke="rgba(234, 233, 225, 0.08)"
              strokeWidth={1.5}
            />
            {seat?.label ? (
              <text
                x={anchor.x}
                y={anchor.y - defaultTableAnchors.seatLabelOffset}
                fill={palette.line}
                fontSize={18}
                fontWeight={600}
                textAnchor="middle"
                letterSpacing={3}
              >
                {seat.label.toUpperCase()}
              </text>
            ) : null}
          </g>
        );
      })}

      <g transform={`translate(${defaultTableAnchors.shoeAnchor.x - 30}, ${defaultTableAnchors.shoeAnchor.y - 30})`}>
        <Icon icon="game-icons:card-pick" width={60} height={60} color={palette.line} />
        <text x={30} y={70} fill={palette.line} fontSize={12} textAnchor="middle" letterSpacing={4}>
          SHOE
        </text>
      </g>

      <g transform={`translate(${defaultTableAnchors.discardAnchor.x - 30}, ${defaultTableAnchors.discardAnchor.y - 30})`}>
        <Icon icon="game-icons:card-exchange" width={60} height={60} color={palette.line} />
        <text x={30} y={70} fill={palette.line} fontSize={12} textAnchor="middle" letterSpacing={4}>
          DISCARD
        </text>
      </g>
    </svg>
  );
};
