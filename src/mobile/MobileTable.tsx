import React from "react";
import type { GameState } from "../engine/types";
import type { CoachMode } from "../store/useGameStore";
import type { ChipDenomination } from "../theme/palette";
import { AppShellMobile } from "./AppShellMobile";
import { TopBarCompact } from "./TopBarCompact";
import { DealerHandView } from "./DealerHandView";
import { PlayerHandView } from "./PlayerHandView";
import { MobileChipTray } from "./ChipTray";
import { ActionBar } from "./ActionBar";
import { InsuranceSheet } from "./InsuranceSheet";
import { ResultBanner } from "./ResultBanner";
import { useCardMetrics } from "./useCardMetrics";
import { summarizeSeatOutcome, resolveOutcomeKind, MIN_AMOUNT, type OutcomeKind } from "./outcome";
import { PRIMARY_SEAT_INDEX } from "../ui/config";

interface MobileTableProps {
  game: GameState;
  coachMode: CoachMode;
  actions: {
    sit: (seatIndex: number) => void;
    leave: (seatIndex: number) => void;
    addChip: (seatIndex: number, denom: number) => void;
    removeChipValue: (seatIndex: number, denom: number) => void;
    removeTopChip: (seatIndex: number) => void;
    deal: () => void;
    playerHit: () => void;
    playerStand: () => void;
    playerDouble: () => void;
    playerSplit: () => void;
    playerSurrender: () => void;
    takeInsurance: (seatIndex: number, handId: string, amount: number) => void;
    declineInsurance: (seatIndex: number, handId: string) => void;
    finishInsurance: () => void;
    playDealer: () => void;
    nextRound: () => void;
  };
  onCoachModeChange: (mode: CoachMode) => void;
}

const DEFAULT_CHIP: ChipDenomination = 25;

export const MobileTable: React.FC<MobileTableProps> = ({ game, coachMode, actions, onCoachModeChange }) => {
  const seat = game.seats[PRIMARY_SEAT_INDEX] ?? null;
  const metrics = useCardMetrics();
  const [selectedChip, setSelectedChip] = React.useState<ChipDenomination>(DEFAULT_CHIP);
  const activeHand = seat?.hands.find((hand) => hand.id === game.activeHandId) ?? null;
  const [focusedHandId, setFocusedHandId] = React.useState<string | null>(activeHand?.id ?? null);
  const lastActiveRef = React.useRef<string | null>(activeHand?.id ?? null);

  React.useEffect(() => {
    const activeId = activeHand?.id ?? null;
    if (activeId && activeId !== lastActiveRef.current) {
      setFocusedHandId(activeId);
    }
    lastActiveRef.current = activeId;
  }, [activeHand?.id]);

  React.useEffect(() => {
    if (!seat) {
      setFocusedHandId(null);
      return;
    }
    if (focusedHandId && seat.hands.some((hand) => hand.id === focusedHandId)) {
      return;
    }
    if (activeHand) {
      setFocusedHandId(activeHand.id);
    } else if (seat.hands[0]) {
      setFocusedHandId(seat.hands[0].id);
    } else {
      setFocusedHandId(null);
    }
  }, [seat, focusedHandId, activeHand]);

  const handleSelectChip = (value: ChipDenomination) => {
    setSelectedChip(value);
  };

  const handleAddChip = (value: ChipDenomination) => {
    actions.addChip(PRIMARY_SEAT_INDEX, value);
  };

  const handleRemoveChip = (value: ChipDenomination) => {
    actions.removeChipValue(PRIMARY_SEAT_INDEX, value);
  };

  const handleRemoveTop = () => {
    actions.removeTopChip(PRIMARY_SEAT_INDEX);
  };

  const focusMatchesActive = !activeHand || focusedHandId === activeHand.id;
  const totalBet = seat?.baseBet ?? 0;

  const insuranceHand = React.useMemo(() => {
    if (game.phase !== "insurance" || !seat) {
      return null;
    }
    return seat.hands.find((hand) => hand.insuranceBet === undefined) ?? null;
  }, [game.phase, seat]);

  const insuranceAmount = insuranceHand ? Math.min(Math.floor(insuranceHand.bet / 2), Math.floor(game.bankroll)) : 0;
  const showInsuranceSheet = Boolean(
    insuranceHand && insuranceAmount > 0 && game.phase === "insurance" && game.awaitingInsuranceResolution
  );

  const previousRoundRef = React.useRef(game.roundCount);
  const [banner, setBanner] = React.useState<{ kind: OutcomeKind; amount?: number; state: "enter" | "exit" } | null>(null);
  const exitTimerRef = React.useRef<number | null>(null);
  const removeTimerRef = React.useRef<number | null>(null);

  const clearBannerTimers = React.useCallback(() => {
    if (exitTimerRef.current) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    if (removeTimerRef.current) {
      window.clearTimeout(removeTimerRef.current);
      removeTimerRef.current = null;
    }
  }, []);

  const showBanner = React.useCallback(
    (kind: OutcomeKind, amount?: number) => {
      clearBannerTimers();
      setBanner({ kind, amount, state: "enter" });
      exitTimerRef.current = window.setTimeout(() => {
        setBanner((current) => (current ? { ...current, state: "exit" } : null));
        removeTimerRef.current = window.setTimeout(() => {
          setBanner(null);
        }, 300);
      }, 2600);
    },
    [clearBannerTimers]
  );

  React.useEffect(() => clearBannerTimers, [clearBannerTimers]);

  React.useEffect(() => {
    const previousRound = previousRoundRef.current;
    if (game.phase === "settlement" && game.roundCount > previousRound) {
      const outcome = summarizeSeatOutcome(game, seat);
      if (outcome) {
        const kind = resolveOutcomeKind(outcome);
        const amount = Math.abs(outcome.net);
        showBanner(kind, amount > MIN_AMOUNT ? amount : undefined);
      }
    }
    previousRoundRef.current = game.roundCount;
  }, [game, seat, showBanner]);

  const handleTakeInsurance = () => {
    if (!insuranceHand || insuranceAmount <= 0) {
      return;
    }
    actions.takeInsurance(PRIMARY_SEAT_INDEX, insuranceHand.id, insuranceAmount);
  };

  const handleSkipInsurance = () => {
    if (!insuranceHand) {
      return;
    }
    actions.declineInsurance(PRIMARY_SEAT_INDEX, insuranceHand.id);
  };

  const bottomBar = (
    <>
      <MobileChipTray
        selected={selectedChip}
        canModify={game.phase === "betting"}
        onSelect={handleSelectChip}
        onAdd={handleAddChip}
        onRemove={handleRemoveChip}
        onRemoveTop={handleRemoveTop}
        totalBet={totalBet}
      />
      <ActionBar
        game={game}
        activeHand={activeHand}
        focusMatchesActive={focusMatchesActive}
        coachMode={coachMode}
        onDeal={actions.deal}
        onHit={actions.playerHit}
        onStand={actions.playerStand}
        onDouble={actions.playerDouble}
        onSplit={actions.playerSplit}
        onSurrender={actions.playerSurrender}
        onFinishInsurance={actions.finishInsurance}
        onPlayDealer={actions.playDealer}
        onNextRound={actions.nextRound}
      />
    </>
  );

  return (
    <AppShellMobile
      topBar={<TopBarCompact game={game} coachMode={coachMode} onCoachModeChange={onCoachModeChange} />}
      bottomBar={bottomBar}
      overlays={
        <>
          <InsuranceSheet
            open={showInsuranceSheet}
            amount={insuranceAmount}
            onTake={handleTakeInsurance}
            onSkip={handleSkipInsurance}
          />
          {banner ? <ResultBanner kind={banner.kind} amount={banner.amount} state={banner.state} /> : null}
        </>
      }
    >
      <DealerHandView game={game} metrics={metrics} />
      <PlayerHandView
        game={game}
        seat={seat}
        focusedHandId={focusedHandId}
        activeHandId={activeHand?.id ?? null}
        metrics={metrics}
        onFocusHand={setFocusedHandId}
      />
    </AppShellMobile>
  );
};
