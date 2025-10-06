import React from "react";
import type { GameState } from "../../engine/types";
import { TableSurfaceSVG, type SeatVisualState } from "./TableSurfaceSVG";
import { mapSeatAnchors } from "./coords";
import { BetSpotOverlay } from "./BetSpotOverlay";
import { CardLayer } from "./CardLayer";
import type { ChipDenomination } from "../../theme/palette";
import { ChipTray } from "../hud/ChipTray";
import { RoundActionBar } from "../hud/RoundActionBar";

const BASE_W = 1280;
const BASE_H = 720;
const HUD_HEIGHT = 150;
const STAGE_PADDING = 24;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const useStageScale = (containerRef: React.RefObject<HTMLDivElement>): number => {
  const [scale, setScale] = React.useState(1);

  React.useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const nextScale = Math.min(width / BASE_W, (height - HUD_HEIGHT) / BASE_H);
      setScale(clamp(Number.isFinite(nextScale) ? nextScale : 1, 0.5, 2));
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef]);

  return scale;
};

interface TableLayoutProps {
  game: GameState;
  activeChip: ChipDenomination;
  onSelectChip: (value: ChipDenomination) => void;
  onSit: (seatIndex: number) => void;
  onLeave: (seatIndex: number) => void;
  onAddChip: (seatIndex: number, denom: number) => void;
  onRemoveChipValue: (seatIndex: number, denom: number) => void;
  onRemoveTopChip: (seatIndex: number) => void;
  onInsurance: (seatIndex: number, handId: string, amount: number) => void;
  onDeclineInsurance: (seatIndex: number, handId: string) => void;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
  onSurrender: () => void;
  onDeal: () => void;
  onFinishInsurance: () => void;
  onPlayDealer: () => void;
  onNextRound: () => void;
}

export const TableLayout: React.FC<TableLayoutProps> = ({
  game,
  activeChip,
  onSelectChip,
  onSit,
  onLeave,
  onAddChip,
  onRemoveChipValue,
  onRemoveTopChip,
  onInsurance,
  onDeclineInsurance,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onSurrender,
  onDeal,
  onFinishInsurance,
  onPlayDealer,
  onNextRound
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scale = useStageScale(containerRef);
  const scaledWidth = BASE_W * scale;
  const scaledHeight = BASE_H * scale;

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
    <div ref={containerRef} className="relative flex h-full w-full flex-col items-center overflow-hidden">
      <div
        className="relative flex w-full flex-1 justify-center"
        style={{ paddingTop: STAGE_PADDING, paddingBottom: STAGE_PADDING }}
      >
        <div className="relative" style={{ width: scaledWidth, height: scaledHeight }}>
          <div
            data-testid="table-stage"
            className="relative mx-auto"
            style={{
              width: BASE_W,
              height: BASE_H,
              transform: `scale(${scale})`,
              transformOrigin: "top center"
            }}
          >
            <div className="absolute inset-0 z-10">
              <TableSurfaceSVG seats={seatStates} className="h-full w-full" />
            </div>
            <BetSpotOverlay
              game={game}
              dimensions={{ width: BASE_W, height: BASE_H }}
              activeChip={activeChip}
              onSit={onSit}
              onLeave={onLeave}
              onAddChip={onAddChip}
              onRemoveChipValue={onRemoveChipValue}
              onRemoveTopChip={onRemoveTopChip}
              onInsurance={onInsurance}
              onDeclineInsurance={onDeclineInsurance}
            />
            <CardLayer
              game={game}
              dimensions={{ width: BASE_W, height: BASE_H }}
              onHit={onHit}
              onStand={onStand}
              onDouble={onDouble}
              onSplit={onSplit}
              onSurrender={onSurrender}
            />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-50 flex w-full justify-center pb-2">
        <div
          data-testid="table-hud"
          className="flex w-full max-w-full flex-col gap-3 md:flex-row md:items-center md:justify-between"
          style={{ width: scaledWidth }}
        >
          <div className="flex flex-1 justify-start md:max-w-[50%]">
            <ChipTray activeChip={activeChip} onSelect={onSelectChip} disabled={game.phase !== "betting"} />
          </div>
          <div className="flex flex-1 justify-end">
            <RoundActionBar
              game={game}
              onDeal={onDeal}
              onFinishInsurance={onFinishInsurance}
              onPlayDealer={onPlayDealer}
              onNextRound={onNextRound}
              onHit={onHit}
              onStand={onStand}
              onDouble={onDouble}
              onSplit={onSplit}
              onSurrender={onSurrender}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
