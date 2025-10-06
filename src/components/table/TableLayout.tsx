import React from "react";
import type { GameState } from "../../engine/types";
import { TableSurfaceSVG, type SeatVisualState } from "./TableSurfaceSVG";
import { mapSeatAnchors } from "./coords";
import { BetSpotOverlay } from "./BetSpotOverlay";
import { CardLayer } from "./CardLayer";
import type { ChipDenomination } from "../../theme/palette";
import { ChipTray } from "../hud/ChipTray";
import { RoundActionBar } from "../hud/RoundActionBar";

const BASE_W = 1850;
const BASE_H = 780;
const HUD_HEIGHT = 120;
const STAGE_PADDING = 16;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

interface StageMetrics {
  scale: number;
  containerWidth: number;
}

const useStageMetrics = (containerRef: React.RefObject<HTMLDivElement>): StageMetrics => {
  const [metrics, setMetrics] = React.useState<StageMetrics>({
    scale: 1,
    containerWidth: BASE_W
  });

  React.useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const availableHeight = height - HUD_HEIGHT;
      const nextScale = Math.min(width / BASE_W, availableHeight / BASE_H);
      setMetrics({
        scale: clamp(Number.isFinite(nextScale) ? nextScale : 1, 0.55, 2),
        containerWidth: width
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef]);

  return metrics;
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
  const { scale, containerWidth } = useStageMetrics(containerRef);
  const scaledWidth = BASE_W * scale;
  const scaledHeight = BASE_H * scale;
  const hudWidth = Math.max(scaledWidth, containerWidth - STAGE_PADDING * 2);

  const seatStates = React.useMemo<SeatVisualState[]>(
    () =>
      mapSeatAnchors(game.seats, (seat, anchor) => ({
        index: seat.index,
        occupied: seat.occupied,
        hasBet: seat.baseBet > 0,
        isActive: game.activeSeatIndex === seat.index,
        label: seat.occupied || seat.baseBet > 0 ? "" : anchor.label
      })),
    [game]
  );

  return (
    <div
      ref={containerRef}
      data-testid="table-layout"
      className="relative flex h-full w-full flex-col items-center overflow-hidden px-2 sm:px-6"
    >
      <div
        className="relative flex w-full flex-1 items-center justify-center"
        style={{ paddingTop: STAGE_PADDING, paddingBottom: STAGE_PADDING }}
      >
        <div className="relative" style={{ width: scaledWidth, height: scaledHeight }}>
          <div
            data-testid="table-stage"
            className="relative"
            style={{
              width: BASE_W,
              height: BASE_H,
              left: "50%",
              transform: `translateX(-50%) scale(${scale})`,
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
        />
        <CardLayer
          game={game}
          dimensions={{ width: BASE_W, height: BASE_H }}
          onInsurance={onInsurance}
          onDeclineInsurance={onDeclineInsurance}
        />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-50 flex w-full justify-center pb-2">
        <div
          data-testid="table-hud"
          className="flex w-full max-w-full flex-col gap-3 md:flex-row md:items-center md:justify-between"
          style={{ width: hudWidth }}
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
