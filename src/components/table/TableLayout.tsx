import React from "react";
import type { GameState, Seat } from "../../engine/types";
import { TableSurfaceSVG, type SeatVisualState } from "./TableSurfaceSVG";
import { mapSeatAnchors } from "./coords";
import { BetSpotOverlay } from "./BetSpotOverlay";
import { CardLayer } from "./CardLayer";
import type { ChipDenomination } from "../../theme/palette";
import { ChipTray } from "../hud/ChipTray";
import { RoundActionBar } from "../hud/RoundActionBar";
import { filterSeatsForMode, isSingleSeatMode } from "../../ui/config";
import { ResultBanner, type ResultKind } from "./ResultBanner";

const BASE_W = 1850;
const BASE_H = 780;
const HUD_HEIGHT = 120;
const STAGE_PADDING = 16;

const EPSILON = 0.009;

const roundToCents = (value: number): number => Math.round(value * 100) / 100;

const isPositive = (value: number): boolean => value > EPSILON;

const isNegative = (value: number): boolean => value < -EPSILON;

const toDisplayAmount = (value: number): number | undefined => {
  const rounded = roundToCents(value);
  return Math.abs(rounded) > EPSILON ? rounded : undefined;
};

const hasActiveHands = (seats: Seat[]): boolean => seats.some((seat) => seat.hands && seat.hands.length > 0);

const calculateInsuranceProfit = (game: GameState, seats: Seat[]): number => {
  if (!game.dealer.hand.isBlackjack) {
    return 0;
  }
  const total = seats.reduce((sum, seat) => {
    const seatProfit = seat.hands.reduce((acc, hand) => acc + (hand.insuranceBet ?? 0) * 2, 0);
    return sum + seatProfit;
  }, 0);
  return roundToCents(total);
};

const deriveBannerPayload = (game: GameState, seats: Seat[], baseline: number): { kind: ResultKind; amount?: number } | null => {
  if (!hasActiveHands(seats)) {
    return null;
  }

  const net = roundToCents(game.bankroll - baseline);
  const insuranceProfit = calculateInsuranceProfit(game, seats);
  const handProfit = roundToCents(net - insuranceProfit);
  const blackjackWin = !game.dealer.hand.isBlackjack && seats.some((seat) =>
    seat.hands.some((hand) => hand.isBlackjack)
  );

  let kind: ResultKind;

  if (blackjackWin && isPositive(handProfit)) {
    kind = "blackjack";
  } else if (isPositive(handProfit)) {
    kind = "win";
  } else if (isNegative(net)) {
    kind = "lose";
  } else if (isPositive(insuranceProfit)) {
    kind = "insurance";
  } else {
    kind = "push";
  }

  let amount: number | undefined;
  if (kind === "insurance") {
    amount = toDisplayAmount(insuranceProfit);
  } else if (kind === "push") {
    amount = undefined;
  } else if (kind === "lose") {
    amount = toDisplayAmount(Math.abs(net));
  } else {
    amount = toDisplayAmount(net);
  }

  return { kind, amount };
};

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
  const baselineRef = React.useRef(game.bankroll);
  const prevPhaseRef = React.useRef(game.phase);
  const exitTimeoutRef = React.useRef<number | null>(null);
  const removeTimeoutRef = React.useRef<number | null>(null);
  const [banner, setBanner] = React.useState<{ kind: ResultKind; amount?: number; exiting: boolean } | null>(null);
  const { scale, containerWidth } = useStageMetrics(containerRef);
  const scaledWidth = BASE_W * scale;
  const scaledHeight = BASE_H * scale;
  const hudWidth = Math.max(scaledWidth, containerWidth - STAGE_PADDING * 2);

  const seatsForMode = React.useMemo(() => filterSeatsForMode(game.seats), [game.seats]);

  const seatStates = React.useMemo<SeatVisualState[]>(
    () =>
      mapSeatAnchors(seatsForMode, (seat, anchor) => ({
        index: seat.index,
        occupied: seat.occupied,
        hasBet: seat.baseBet > 0,
        isActive: game.activeSeatIndex === seat.index,
        label:
          seat.occupied || seat.baseBet > 0
            ? ""
            : isSingleSeatMode
              ? "You"
              : anchor.label
      })),
    [game.activeSeatIndex, seatsForMode]
  );

  const scheduleBanner = React.useCallback((payload: { kind: ResultKind; amount?: number }) => {
    setBanner({ ...payload, exiting: false });
    if (typeof window === "undefined") {
      return;
    }
    if (exitTimeoutRef.current !== null) {
      window.clearTimeout(exitTimeoutRef.current);
    }
    if (removeTimeoutRef.current !== null) {
      window.clearTimeout(removeTimeoutRef.current);
    }
    exitTimeoutRef.current = window.setTimeout(() => {
      setBanner((current) => (current ? { ...current, exiting: true } : current));
    }, 1200);
    removeTimeoutRef.current = window.setTimeout(() => {
      setBanner(null);
    }, 1600);
  }, []);

  React.useEffect(() => {
    if (game.phase === "betting") {
      baselineRef.current = game.bankroll;
    }
  }, [game.bankroll, game.phase]);

  React.useEffect(() => {
    const previousPhase = prevPhaseRef.current;
    if (previousPhase !== "settlement" && game.phase === "settlement") {
      const payload = deriveBannerPayload(game, seatsForMode, baselineRef.current);
      if (payload) {
        scheduleBanner(payload);
      }
    }
    prevPhaseRef.current = game.phase;
  }, [game, scheduleBanner, seatsForMode]);

  React.useEffect(() => () => {
    if (typeof window === "undefined") {
      return;
    }
    if (exitTimeoutRef.current !== null) {
      window.clearTimeout(exitTimeoutRef.current);
    }
    if (removeTimeoutRef.current !== null) {
      window.clearTimeout(removeTimeoutRef.current);
    }
  }, []);

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
            {banner ? <ResultBanner kind={banner.kind} amount={banner.amount} exiting={banner.exiting} /> : null}
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
