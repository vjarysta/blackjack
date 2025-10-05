import React from "react";
import type { GameState } from "../../engine/types";
import { TableSurfaceSVG, type SeatVisualState } from "./TableSurfaceSVG";
import { defaultTableAnchors, type TableAnchors, mapSeatAnchors } from "./coords";
import { BetSpotOverlay } from "./BetSpotOverlay";
import { CardLayer } from "./CardLayer";
import type { ChipDenomination } from "../../theme/palette";

interface TableLayoutProps {
  game: GameState;
  activeChip: ChipDenomination;
  onSetBet: (seatIndex: number, amount: number) => void;
  onSit: (seatIndex: number) => void;
  onLeave: (seatIndex: number) => void;
  onInsurance: (seatIndex: number, handId: string, amount: number) => void;
  onDeclineInsurance: (seatIndex: number, handId: string) => void;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
  onSurrender: () => void;
}

export const TableLayout: React.FC<TableLayoutProps> = ({
  game,
  activeChip,
  onSetBet,
  onSit,
  onLeave,
  onInsurance,
  onDeclineInsurance,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onSurrender
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = React.useState({
    width: defaultTableAnchors.viewBox.width,
    height: defaultTableAnchors.viewBox.height
  });
  const [, setLayout] = React.useState<TableAnchors>(defaultTableAnchors);

  React.useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const seatStates = React.useMemo<SeatVisualState[]>(
    () =>
      mapSeatAnchors(game.seats, (seat, anchor) => ({
        index: seat.index,
        occupied: seat.occupied,
        hasBet: seat.baseBet > 0,
        isActive: game.activeSeatIndex === seat.index,
        label: anchor.label
      })),
    [game]
  );

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-[48px] border border-[#c8a24a]/40 bg-[#08261d] shadow-[0_25px_80px_rgba(0,0,0,0.55)]"
        style={{ aspectRatio: "3 / 2" }}
      >
        <TableSurfaceSVG seats={seatStates} onLayout={setLayout} className="h-full w-full" />
        <BetSpotOverlay
          game={game}
          dimensions={dimensions}
          activeChip={activeChip}
          onSetBet={onSetBet}
          onSit={onSit}
          onLeave={onLeave}
          onInsurance={onInsurance}
          onDeclineInsurance={onDeclineInsurance}
        />
        <CardLayer
          game={game}
          dimensions={dimensions}
          onHit={onHit}
          onStand={onStand}
          onDouble={onDouble}
          onSplit={onSplit}
          onSurrender={onSurrender}
        />
      </div>
    </div>
  );
};
