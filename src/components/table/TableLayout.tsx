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
const HUD_HEIGHT = 120;

interface TableLayoutProps {
  game: GameState;
  activeChip: ChipDenomination;
  onSelectChip: (value: ChipDenomination) => void;
  onSit: (seatIndex: number) => void;
  onLeave: (seatIndex: number) => void;
  onAddChip: (seatIndex: number, value: number) => void;
  onRemoveChipValue: (seatIndex: number, value: number) => void;
  onRemoveTopChip: (seatIndex: number) => void;
  onInsurance: (seatIndex: number, handId: string, amount: number) => void;
  onDeclineInsurance: (seatIndex: number, handId: string) => void;
  onDeal: () => void;
  onFinishInsurance: () => void;
  onPlayDealer: () => void;
  onNextRound: () => void;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
  onSurrender: () => void;
}

type StageScaleState = {
  scale: number;
  stageWidth: number;
  stageHeight: number;
};

const clampScale = (value: number): number => Math.max(0.5, Math.min(value, 2));

const useStageScale = (containerRef: React.RefObject<HTMLDivElement>): StageScaleState => {
  const [state, setState] = React.useState<StageScaleState>({
    scale: 1,
    stageWidth: BASE_W,
    stageHeight: BASE_H
  });

  React.useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const updateScale = (width: number, height: number) => {
      const rawScale = Math.min(width / BASE_W, (height - HUD_HEIGHT) / BASE_H);
      const scale = clampScale(Number.isFinite(rawScale) ? rawScale : 1);
      setState({
        scale,
        stageWidth: BASE_W * scale,
        stageHeight: BASE_H * scale
      });
    };

    updateScale(element.clientWidth, element.clientHeight);

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) {
        return;
      }
      const { width, height } = entry.contentRect;
      updateScale(width, height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef]);

  return state;
};

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
  onDeal,
  onFinishInsurance,
  onPlayDealer,
  onNextRound,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onSurrender
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const { scale, stageWidth, stageHeight } = useStageScale(containerRef);
  const stageDimensions = React.useMemo(() => ({ width: BASE_W, height: BASE_H }), []);

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
    <div
      ref={containerRef}
      className="relative flex w-full flex-1 flex-col items-center gap-6"
      style={{ minHeight: 0 }}
    >
      <div className="relative flex w-full flex-1 items-start justify-center overflow-hidden px-4 pt-6">
        <div className="relative" style={{ width: stageWidth, height: stageHeight }}>
          <div
            className="relative mx-auto h-full w-full rounded-[48px] border border-[#c8a24a]/40 bg-[#08261d] shadow-[0_25px_80px_rgba(0,0,0,0.55)]"
            style={{
              width: BASE_W,
              height: BASE_H,
              transform: `scale(${scale})`,
              transformOrigin: "top center"
            }}
          >
            <div className="pointer-events-none absolute inset-0 z-10">
              <TableSurfaceSVG seats={seatStates} className="h-full w-full" />
            </div>
            <div className="absolute inset-0 z-20">
              <BetSpotOverlay
                game={game}
                dimensions={stageDimensions}
                activeChip={activeChip}
                onSit={onSit}
                onLeave={onLeave}
                onAddChip={onAddChip}
                onRemoveChipValue={onRemoveChipValue}
                onRemoveTopChip={onRemoveTopChip}
                onInsurance={onInsurance}
                onDeclineInsurance={onDeclineInsurance}
              />
            </div>
            <div className="absolute inset-0 z-30">
              <CardLayer
                game={game}
                dimensions={stageDimensions}
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

      <div className="pointer-events-none sticky bottom-0 z-50 w-full px-4 pb-4">
        <div
          className="pointer-events-auto mx-auto flex w-full flex-col gap-4 rounded-3xl border border-[#c8a24a]/40 bg-[#0b2d22]/85 px-6 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.5)] backdrop-blur"
          style={{ width: stageWidth, maxWidth: "100%" }}
        >
          <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <ChipTray activeChip={activeChip} onSelect={onSelectChip} disabled={game.phase !== "betting"} />
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
