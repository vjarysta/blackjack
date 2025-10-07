import React from "react";
import type { GameState, Seat } from "../../engine/types";
import { bestTotal, isBust } from "../../engine/totals";
import { TableSurfaceSVG, type SeatVisualState } from "./TableSurfaceSVG";
import { mapSeatAnchors } from "./coords";
import { BetSpotOverlay } from "./BetSpotOverlay";
import { CardLayer } from "./CardLayer";
import type { ChipDenomination } from "../../theme/palette";
import { ChipTray } from "../hud/ChipTray";
import { RoundActionBar, type CoachFeedback } from "../hud/RoundActionBar";
import { filterSeatsForMode, isSingleSeatMode } from "../../ui/config";
import { ResultBanner, type ResultKind } from "./ResultBanner";
import type { CoachMode } from "../../store/useGameStore";

const MIN_AMOUNT = 0.005;

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

type BannerPhase = "enter" | "exit";

type BannerState = {
  key: number;
  kind: ResultKind;
  amount?: number;
  phase: BannerPhase;
};

type OutcomeSummary = {
  net: number;
  baseNet: number;
  insuranceNet: number;
  hasBlackjackWin: boolean;
};

const roundToCents = (value: number): number => Math.round(value * 100) / 100;

const calculateOutcomeForSeats = (game: GameState, seats: Seat[]): OutcomeSummary | null => {
  const dealerHand = game.dealer.hand;
  const dealerBlackjack = dealerHand.isBlackjack;
  const dealerBust = isBust(dealerHand);
  const dealerTotal = bestTotal(dealerHand);

  let totalBet = 0;
  let totalInsurance = 0;
  let basePayout = 0;
  let insurancePayout = 0;
  let hasBlackjackWin = false;

  const relevantSeats = seats.filter((seat) =>
    seat.hands.some((hand) => (hand.bet ?? 0) > 0 || (hand.insuranceBet ?? 0) > 0)
  );

  if (relevantSeats.length === 0) {
    return null;
  }

  const blackjackMultiplier = game.rules.blackjackPayout === "6:5" ? 1.2 : 1.5;

  for (const seat of relevantSeats) {
    for (const hand of seat.hands) {
      const bet = hand.bet ?? 0;
      const insuranceBet = hand.insuranceBet ?? 0;

      totalBet += bet;
      totalInsurance += insuranceBet;

      if (dealerBlackjack) {
        if (insuranceBet > 0) {
          insurancePayout += insuranceBet * 3;
        }
        if (hand.isBlackjack) {
          basePayout += bet;
        }
        continue;
      }

      if (hand.isSurrendered) {
        basePayout += bet / 2;
        continue;
      }

      if (isBust(hand)) {
        continue;
      }

      if (hand.isBlackjack) {
        basePayout += bet * (1 + blackjackMultiplier);
        hasBlackjackWin = true;
        continue;
      }

      if (dealerBust) {
        basePayout += bet * 2;
        continue;
      }

      const playerTotal = bestTotal(hand);
      if (playerTotal > dealerTotal) {
        basePayout += bet * 2;
      } else if (playerTotal === dealerTotal) {
        basePayout += bet;
      }
    }
  }

  if (totalBet <= 0 && totalInsurance <= 0) {
    return null;
  }

  const baseNet = roundToCents(basePayout - totalBet);
  const insuranceNet = roundToCents(insurancePayout - totalInsurance);
  const net = roundToCents(baseNet + insuranceNet);

  return { net, baseNet, insuranceNet, hasBlackjackWin };
};

const resolveResultKind = (outcome: OutcomeSummary): ResultKind => {
  const { net, baseNet, insuranceNet, hasBlackjackWin } = outcome;
  if (net > MIN_AMOUNT) {
    if (insuranceNet > MIN_AMOUNT && baseNet <= MIN_AMOUNT) {
      return "insurance";
    }
    return hasBlackjackWin ? "blackjack" : "win";
  }
  if (net < -MIN_AMOUNT) {
    return "lose";
  }
  return "push";
};

interface TableLayoutProps {
  game: GameState;
  coachMode: CoachMode;
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
  coachMode,
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

  const seatsForMode = React.useMemo(() => filterSeatsForMode(game.seats), [game.seats]);

  const [bannerState, setBannerState] = React.useState<BannerState | null>(null);
  const exitTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousRoundRef = React.useRef(game.roundCount);

  const [coachFeedback, setCoachFeedback] = React.useState<CoachFeedback | null>(null);
  const coachFeedbackTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCoachFeedback = React.useCallback(() => {
    if (coachFeedbackTimerRef.current) {
      clearTimeout(coachFeedbackTimerRef.current);
      coachFeedbackTimerRef.current = null;
    }
    setCoachFeedback(null);
  }, []);

  const showCoachFeedback = React.useCallback(
    (feedback: CoachFeedback) => {
      clearCoachFeedback();
      setCoachFeedback(feedback);
      coachFeedbackTimerRef.current = window.setTimeout(() => {
        setCoachFeedback(null);
        coachFeedbackTimerRef.current = null;
      }, 1900);
    },
    [clearCoachFeedback]
  );

  React.useEffect(() => () => clearCoachFeedback(), [clearCoachFeedback]);

  React.useEffect(() => {
    if (coachMode !== "feedback") {
      clearCoachFeedback();
    }
  }, [coachMode, clearCoachFeedback]);

  const clearBannerTimers = React.useCallback(() => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    if (removeTimerRef.current) {
      clearTimeout(removeTimerRef.current);
      removeTimerRef.current = null;
    }
  }, []);

  const showBanner = React.useCallback(
    (next: { kind: ResultKind; amount?: number }) => {
      clearBannerTimers();
      const key = Date.now();
      setBannerState({ key, phase: "enter", ...next });

      exitTimerRef.current = window.setTimeout(() => {
        setBannerState((current) => (current ? { ...current, phase: "exit" } : null));
        removeTimerRef.current = window.setTimeout(() => {
          setBannerState(null);
        }, 320);
      }, 3000);
    },
    [clearBannerTimers]
  );

  React.useEffect(() => () => clearBannerTimers(), [clearBannerTimers]);

  React.useEffect(() => {
    const previousRound = previousRoundRef.current;
    if (game.phase === "settlement" && game.roundCount > previousRound) {
      const outcome = calculateOutcomeForSeats(game, seatsForMode);
      if (outcome) {
        const kind = resolveResultKind(outcome);
        const amount = Math.abs(outcome.net);
        showBanner({ kind, amount: amount > MIN_AMOUNT ? amount : undefined });
      }
    }
    previousRoundRef.current = game.roundCount;
  }, [game, seatsForMode, showBanner]);

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
              coachMode={coachMode}
              onCoachFeedback={showCoachFeedback}
            />
            {bannerState ? (
              <ResultBanner
                key={bannerState.key}
                kind={bannerState.kind}
                amount={bannerState.amount}
                phase={bannerState.phase}
              />
            ) : null}
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
              coachMode={coachMode}
              feedback={coachFeedback}
              onCoachFeedback={showCoachFeedback}
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
