import * as React from "react";
import type { GameState, Hand } from "../../engine/types";
import { bestTotal } from "../../engine/totals";
import { PRIMARY_SEAT_INDEX } from "../../ui/config";
import type { CoachMode } from "../../store/useGameStore";
import type { ChipDenomination } from "../../theme/palette";
import { formatCurrency } from "../../utils/currency";
import { audioService } from "../../services/AudioService";
import type { Action } from "../../utils/basicStrategy";
import { NoirJackResultToaster } from "./NoirJackResultToaster";
import { FireworksOverlay } from "../effects/FireworksOverlay";
import { Topbar } from "./components/Topbar";
import { DealerPanel } from "./components/DealerPanel";
import { PlayerPanel, type CoachMessage } from "./components/PlayerPanel";
import { ActionsDock } from "./components/ActionsDock";
import { BetTray } from "./components/BetTray";
import { SettingsSheet } from "./components/SettingsSheet";
import { InsuranceSheet } from "./components/InsuranceSheet";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";
import { useHaptics } from "./hooks/useHaptics";
import { useActionRecommendation } from "./hooks/useActionRecommendation";
import { useCelebrations } from "./hooks/useCelebrations";
import { useResultToastOnSettlement } from "./hooks/useResultToastOnSettlement";
import { useFireworksOnWin } from "./hooks/useFireworksOnWin";
import { useDealSoundOnNewCard } from "./hooks/useDealSoundOnNewCard";
import { useFlipSoundOnHoleReveal } from "./hooks/useFlipSoundOnHoleReveal";
import { useInsurancePromptSound } from "./hooks/useInsurancePromptSound";
import { useMessageLogSounds } from "./hooks/useMessageLogSounds";
import { useCelebrationPreference } from "./hooks/useCelebrationPreference";
import {
  selectPrimarySeat,
  findActiveHand,
  deriveActionContext,
  deriveActionAvailability,
  deriveFaceDownIndexes,
  deriveDealerStatus,
} from "./selectors";

interface NoirJackTableProps {
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
  error: string | null;
  onDismissError: () => void;
  modeToggle: React.ReactNode;
}

const CHIP_VALUES: ChipDenomination[] = [1, 5, 25, 100, 500];

interface ChipMotion {
  value: ChipDenomination;
  type: "add" | "remove";
  stamp: number;
}

const buildCoachMessage = (action: Action, correct: boolean): string => {
  const label = action.charAt(0).toUpperCase() + action.slice(1);
  return correct ? `Nice! ${label} was the right move.` : `Try ${label} next time.`;
};

export const NoirJackTable: React.FC<NoirJackTableProps> = ({
  game,
  coachMode,
  actions,
  onCoachModeChange,
  error,
  onDismissError,
  modeToggle,
}) => {
  const [activeChip, setActiveChip] = React.useState<ChipDenomination>(25);
  const [chipMotion, setChipMotion] = React.useState<ChipMotion | null>(null);
  const [coachMessage, setCoachMessage] = React.useState<CoachMessage | null>(null);
  const [flashAction, setFlashAction] = React.useState<Action | null>(null);
  const [chipsOpen, setChipsOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const chipSheetId = React.useId();
  const settingsSheetId = React.useId();

  const messageTimer = React.useRef<number | undefined>();
  const highlightTimer = React.useRef<number | undefined>();

  const isMobile = useMediaQuery("(max-width: 480px)");
  const prefersReducedMotion = usePrefersReducedMotion();
  const vibrate = useHaptics(prefersReducedMotion);

  const celebrationPreference = useCelebrationPreference(prefersReducedMotion);
  const celebrationsEnabled = celebrationPreference.enabled;

  const { ref: fireworksRef, start: startCelebration, stop: stopCelebration, intensity } =
    useCelebrations({ enabled: celebrationsEnabled, prefersReduced: prefersReducedMotion });

  React.useEffect(() => {
    if (messageTimer.current) {
      window.clearTimeout(messageTimer.current);
      messageTimer.current = undefined;
    }
    if (coachMessage) {
      messageTimer.current = window.setTimeout(() => {
        setCoachMessage(null);
        messageTimer.current = undefined;
      }, 2500);
    }
    return () => {
      if (messageTimer.current) {
        window.clearTimeout(messageTimer.current);
        messageTimer.current = undefined;
      }
    };
  }, [coachMessage]);

  React.useEffect(() => () => {
    if (highlightTimer.current) {
      window.clearTimeout(highlightTimer.current);
    }
    if (messageTimer.current) {
      window.clearTimeout(messageTimer.current);
    }
  }, []);

  React.useEffect(() => {
    if (!isMobile) {
      setChipsOpen(false);
    }
  }, [isMobile]);

  React.useEffect(() => {
    if (!settingsOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [settingsOpen]);

  React.useEffect(() => {
    if (!chipsOpen || !isMobile) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setChipsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chipsOpen, isMobile]);

  const seat = selectPrimarySeat(game);
  const activeHand = React.useMemo<Hand | null>(() => findActiveHand(game), [game]);
  const actionContext = React.useMemo(
    () => deriveActionContext(game, activeHand, seat),
    [game, activeHand, seat]
  );

  const { recommendedAction, highlightedAction } = useActionRecommendation({
    game,
    hand: activeHand,
    legal: actionContext,
    coachMode,
    dealerUpcard: game.dealer.upcard,
    flashOverride: flashAction,
  });

  const availability = React.useMemo(
    () => deriveActionAvailability(game, actionContext),
    [game, actionContext]
  );

  const faceDownIndexes = React.useMemo(() => deriveFaceDownIndexes(game), [game]);
  const dealerStatus = React.useMemo(
    () => deriveDealerStatus(game, faceDownIndexes),
    [game, faceDownIndexes]
  );

  const playerHands = React.useMemo<Hand[]>(() => seat?.hands ?? [], [seat]);
  const rawActiveIndex = playerHands.findIndex((hand) => hand.id === game.activeHandId);
  const resolvedActiveIndex =
    rawActiveIndex >= 0 ? rawActiveIndex : playerHands.length > 0 ? 0 : -1;
  const focusedHand =
    activeHand ?? (resolvedActiveIndex >= 0 ? playerHands[resolvedActiveIndex] : null);
  const playerTotal = focusedHand ? bestTotal(focusedHand) : null;
  const playerBet = focusedHand?.bet ?? seat?.baseBet ?? 0;

  const stats = [
    { label: "Bankroll", value: formatCurrency(game.bankroll) },
    { label: "Round", value: game.roundCount },
    { label: "Phase", value: game.phase },
    { label: "Cards", value: game.shoe.cards.length },
    { label: "Discard", value: game.shoe.discard.length },
    { label: "Min", value: formatCurrency(game.rules.minBet) },
    { label: "Max", value: formatCurrency(game.rules.maxBet) },
  ];

  const insurance = useInsurancePromptSound(game, audioService);

  React.useEffect(() => {
    if (chipsOpen || settingsOpen || insurance.open) {
      stopCelebration();
    }
  }, [chipsOpen, settingsOpen, insurance.open, stopCelebration]);

  useResultToastOnSettlement(game);
  useFireworksOnWin(game, {
    start: startCelebration,
    stop: stopCelebration,
    enabled: celebrationsEnabled,
    prefersReduced: prefersReducedMotion,
    audio: audioService,
  });
  useDealSoundOnNewCard(game, audioService);
  useFlipSoundOnHoleReveal(game, audioService);
  useMessageLogSounds(game.messageLog, audioService);

  const playActionTap = React.useCallback((action: Action) => {
    if (action === "hit" || action === "stand") {
      audioService.play("button");
    }
  }, []);

  const triggerFeedback = React.useCallback(
    (action: Action, callback: () => void) => {
      if (coachMode === "feedback" && recommendedAction) {
        const correct = action === recommendedAction;
        setCoachMessage({
          tone: correct ? "correct" : "better",
          text: buildCoachMessage(recommendedAction, correct),
        });
        if (!correct) {
          setFlashAction(recommendedAction);
          if (highlightTimer.current) {
            window.clearTimeout(highlightTimer.current);
          }
          highlightTimer.current = window.setTimeout(() => {
            setFlashAction(null);
            highlightTimer.current = undefined;
          }, 1000);
        } else {
          setFlashAction(null);
        }
      }
      playActionTap(action);
      callback();
      vibrate();
    },
    [coachMode, playActionTap, recommendedAction, vibrate]
  );

  const handleHit = React.useCallback(() => triggerFeedback("hit", actions.playerHit), [actions.playerHit, triggerFeedback]);
  const handleStand = React.useCallback(() => triggerFeedback("stand", actions.playerStand), [actions.playerStand, triggerFeedback]);
  const handleDouble = React.useCallback(() => triggerFeedback("double", actions.playerDouble), [actions.playerDouble, triggerFeedback]);
  const handleSplit = React.useCallback(() => triggerFeedback("split", actions.playerSplit), [actions.playerSplit, triggerFeedback]);
  const handleSurrender = React.useCallback(() => triggerFeedback("surrender", actions.playerSurrender), [actions.playerSurrender, triggerFeedback]);

  const handleAddChip = React.useCallback(
    (value: ChipDenomination) => {
      if (game.phase !== "betting" || !seat) {
        audioService.play("invalid");
        return;
      }
      const nextBet = seat.baseBet + value;
      if (nextBet > game.rules.maxBet || nextBet > game.bankroll) {
        audioService.play("invalid");
        return;
      }
      actions.addChip(PRIMARY_SEAT_INDEX, value);
      audioService.play("chipAdd");
      vibrate();
      setChipMotion({ value, type: "add", stamp: Date.now() });
    },
    [actions, game.bankroll, game.phase, game.rules.maxBet, seat, vibrate]
  );

  const handleRemoveChipValue = React.useCallback(
    (value: ChipDenomination) => {
      if (game.phase !== "betting" || !seat || seat.baseBet <= 0) {
        audioService.play("invalid");
        return;
      }
      actions.removeChipValue(PRIMARY_SEAT_INDEX, value);
      audioService.play("chipRemove");
      vibrate();
      setChipMotion({ value, type: "remove", stamp: Date.now() });
    },
    [actions, game.phase, seat, vibrate]
  );

  const handleRemoveTopChip = React.useCallback(() => {
    if (game.phase !== "betting" || !seat || seat.baseBet <= 0) {
      audioService.play("invalid");
      return;
    }
    actions.removeTopChip(PRIMARY_SEAT_INDEX);
    audioService.play("chipRemove");
    vibrate();
    setChipMotion({ value: activeChip, type: "remove", stamp: Date.now() });
  }, [actions, activeChip, game.phase, seat, vibrate]);

  const handleSelectChip = React.useCallback(
    (value: ChipDenomination) => {
      setActiveChip(value);
      handleAddChip(value);
      if (isMobile) {
        setChipsOpen(false);
      }
    },
    [handleAddChip, isMobile]
  );

  const handleChipRemoval = React.useCallback(
    (value: ChipDenomination) => {
      setActiveChip(value);
      handleRemoveChipValue(value);
      if (isMobile) {
        setChipsOpen(false);
      }
    },
    [handleRemoveChipValue, isMobile]
  );

  const handleAddActiveChip = React.useCallback(() => {
    handleAddChip(activeChip);
    if (isMobile) {
      setChipsOpen(false);
    }
  }, [activeChip, handleAddChip, isMobile]);

  const handleRemoveActiveChip = React.useCallback(() => {
    handleChipRemoval(activeChip);
  }, [activeChip, handleChipRemoval]);

  const handleUndoChip = React.useCallback(() => {
    handleRemoveTopChip();
    if (isMobile) {
      setChipsOpen(false);
    }
  }, [handleRemoveTopChip, isMobile]);

  const takeInsurance = React.useCallback(() => {
    if (!insurance.handId) {
      return;
    }
    audioService.play("button");
    vibrate();
    actions.takeInsurance(PRIMARY_SEAT_INDEX, insurance.handId, insurance.amount);
  }, [actions, insurance.amount, insurance.handId, vibrate]);

  const skipInsurance = React.useCallback(() => {
    if (!insurance.handId) {
      return;
    }
    audioService.play("button");
    vibrate();
    actions.declineInsurance(PRIMARY_SEAT_INDEX, insurance.handId);
  }, [actions, insurance.handId, vibrate]);

  const handleDeal = React.useCallback(() => {
    audioService.play("button");
    vibrate();
    actions.deal();
  }, [actions, vibrate]);

  const handleFinishInsurance = React.useCallback(() => {
    audioService.play("button");
    vibrate();
    actions.finishInsurance();
  }, [actions, vibrate]);

  const handlePlayDealer = React.useCallback(() => {
    audioService.play("button");
    vibrate();
    actions.playDealer();
  }, [actions, vibrate]);

  const handleNextRound = React.useCallback(() => {
    audioService.play("button");
    vibrate();
    actions.nextRound();
  }, [actions, vibrate]);

  const roundControls = React.useMemo(() => {
    const controls: {
      label: string;
      onClick(): void;
      disabled: boolean;
      variant?: "primary" | "ghost";
    }[] = [];
    if (availability.deal) {
      controls.push({
        label: "Deal",
        onClick: handleDeal,
        disabled: !availability.deal,
        variant: "primary",
      });
    }
    if (availability.finishInsurance) {
      controls.push({
        label: "Finish insurance",
        onClick: handleFinishInsurance,
        disabled: !availability.finishInsurance,
        variant: "ghost",
      });
    }
    if (availability.playDealer) {
      controls.push({
        label: "Play dealer",
        onClick: handlePlayDealer,
        disabled: !availability.playDealer,
        variant: "ghost",
      });
    }
    if (availability.nextRound) {
      controls.push({
        label: "Next round",
        onClick: handleNextRound,
        disabled: !availability.nextRound,
        variant: "ghost",
      });
    }
    return controls;
  }, [availability, handleDeal, handleFinishInsurance, handlePlayDealer, handleNextRound]);

  const closeChipSheet = React.useCallback(() => setChipsOpen(false), []);

  const toggleSettings = React.useCallback(() => {
    setSettingsOpen((open) => !open);
  }, []);

  return (
    <div className="noirjack-app">
      <FireworksOverlay
        ref={fireworksRef}
        disabled={!celebrationsEnabled}
        intensity={intensity}
      />
      <NoirJackResultToaster isMobile={isMobile} />
      <div className="noirjack-felt" />
      <div className="noirjack-content">
        <Topbar
          coachMode={coachMode}
          onCoachModeChange={onCoachModeChange}
          onOpenSettings={toggleSettings}
          settingsOpen={settingsOpen}
          settingsSheetId={settingsSheetId}
          modeToggle={modeToggle}
          stats={stats}
          error={error}
          onDismissError={onDismissError}
        />
        <div className="nj-play-area">
          <DealerPanel
            cards={game.dealer.hand.cards}
            faceDownIndexes={faceDownIndexes}
            status={dealerStatus}
            showInsuranceFooter={game.phase === "insurance"}
          />
          <PlayerPanel
            hands={playerHands}
            activeIndex={resolvedActiveIndex}
            focusedHand={focusedHand}
            playerTotal={playerTotal}
            playerBet={playerBet}
            coachMessage={coachMessage}
          />
        </div>
      </div>

      <div className="nj-controls nj-sticky-bottom">
        <div className="nj-controls__layout">
          <div className="nj-controls__tray-slot">
            {isMobile ? (
              <>
                <button
                  type="button"
                  className="nj-btn nj-btn-primary nj-chip-trigger"
                  onClick={() => setChipsOpen((open) => !open)}
                  aria-expanded={chipsOpen}
                  aria-controls={chipSheetId}
                >
                  Chips
                </button>
                {chipsOpen ? (
                  <div
                    className="nj-chip-sheet"
                    id={chipSheetId}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Select chips"
                  >
                    <button
                      type="button"
                      className="nj-chip-sheet__backdrop"
                      aria-label="Close chips menu"
                      onClick={closeChipSheet}
                    />
                    <div className="nj-controls__tray nj-glass nj-chip-sheet__panel">
                      <BetTray
                        chipValues={CHIP_VALUES}
                        activeChip={activeChip}
                        baseBet={seat?.baseBet ?? 0}
                        isBettingPhase={game.phase === "betting"}
                        onSelectChip={handleSelectChip}
                        onRemoveChip={handleChipRemoval}
                        onAddActive={handleAddActiveChip}
                        onRemoveActive={handleRemoveActiveChip}
                        onUndo={handleUndoChip}
                        chipMotion={chipMotion}
                        closable
                        onClose={closeChipSheet}
                      />
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="nj-controls__tray nj-glass">
                <BetTray
                  chipValues={CHIP_VALUES}
                  activeChip={activeChip}
                  baseBet={seat?.baseBet ?? 0}
                  isBettingPhase={game.phase === "betting"}
                  onSelectChip={handleSelectChip}
                  onRemoveChip={handleChipRemoval}
                  onAddActive={handleAddActiveChip}
                  onRemoveActive={handleRemoveActiveChip}
                  onUndo={handleUndoChip}
                  chipMotion={chipMotion}
                />
              </div>
            )}
          </div>
          <ActionsDock
            phase={game.phase}
            availability={availability}
            highlightedAction={highlightedAction}
            onHit={handleHit}
            onStand={handleStand}
            onDouble={handleDouble}
            onSplit={handleSplit}
            onSurrender={handleSurrender}
            roundControls={roundControls}
          />
        </div>
      </div>

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        sheetId={settingsSheetId}
        celebrationsEnabled={celebrationsEnabled}
        toggleCelebrations={celebrationPreference.toggle}
        prefersReducedMotion={prefersReducedMotion}
      />

      <InsuranceSheet
        open={insurance.open}
        amount={insurance.amount}
        onTake={takeInsurance}
        onSkip={skipInsurance}
      />
    </div>
  );
};
