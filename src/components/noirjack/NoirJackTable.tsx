import React from "react";
import { Info, Settings2, Sparkles } from "lucide-react";
import type { GameState, Hand } from "../../engine/types";
import { PRIMARY_SEAT_INDEX, filterSeatsForMode } from "../../ui/config";
import type { CoachMode } from "../../store/useGameStore";
import type { ChipDenomination } from "../../theme/palette";
import { formatCurrency } from "../../utils/currency";
import { canDouble, canHit, canSplit, canSurrender } from "../../engine/rules";
import { getRecommendation, type Action, type PlayerContext } from "../../utils/basicStrategy";
import { NoirCardFan } from "./NoirCardFan";
import { Chip } from "../hud/Chip";
import { cn } from "../../utils/cn";
import { bestTotal } from "../../engine/totals";
import { audioService } from "../../services/AudioService";
import { NoirSoundControls } from "./NoirSoundControls";

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

const hasReadySeat = (game: GameState): boolean => {
  const seat = game.seats[PRIMARY_SEAT_INDEX];
  if (!seat?.occupied) {
    return false;
  }
  if (seat.baseBet < game.rules.minBet || seat.baseBet > game.rules.maxBet) {
    return false;
  }
  return seat.baseBet > 0 && seat.baseBet <= game.bankroll;
};

const findActiveHand = (game: GameState): Hand | null => {
  if (!game.activeHandId) {
    return null;
  }
  for (const seat of filterSeatsForMode(game.seats)) {
    const hand = seat.hands.find((candidate) => candidate.id === game.activeHandId);
    if (hand) {
      return hand;
    }
  }
  return null;
};

const parseResultMessage = (messages: string[]): { tone: ResultTone; message: string } | null => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message.startsWith("Seat 1")) {
      continue;
    }
    if (message.includes("wins")) {
      const amountMatch = message.match(/€([0-9.,]+)/);
      const amount = amountMatch ? Number.parseFloat(amountMatch[1].replace(",", "")) : null;
      return {
        tone: "win",
        message: amount ? `Win +€${amount.toFixed(2)}` : "Win"
      };
    }
    if (message.includes("push")) {
      return { tone: "push", message: "Push" };
    }
    if (message.includes("loses")) {
      const amountMatch = message.match(/€([0-9.,]+)/);
      const amount = amountMatch ? Number.parseFloat(amountMatch[1].replace(",", "")) : null;
      return {
        tone: "lose",
        message: amount ? `Lose -€${amount.toFixed(2)}` : "Lose"
      };
    }
  }
  return null;
};

const buildCoachMessage = (action: Action, correct: boolean): string => {
  const label = action.charAt(0).toUpperCase() + action.slice(1);
  return correct ? `Nice! ${label} was the right move.` : `Try ${label} next time.`;
};

type ResultTone = "win" | "lose" | "push";

const usePrevious = <T,>(value: T): T | undefined => {
  const ref = React.useRef<T>();
  React.useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

const usePrefersReducedMotion = (): boolean => {
  const [prefers, setPrefers] = React.useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  });

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = () => setPrefers(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return prefers;
};

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = React.useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }
    const media = window.matchMedia(query);
    const handler = () => setMatches(media.matches);
    handler();
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [query]);

  return matches;
};

const useHaptics = (disabled: boolean): (() => void) => {
  return React.useCallback(() => {
    if (disabled || typeof window === "undefined" || typeof navigator === "undefined") {
      return;
    }
    if (navigator.vibrate) {
      navigator.vibrate(12);
    }
  }, [disabled]);
};

interface ActionAvailability {
  hit: boolean;
  stand: boolean;
  double: boolean;
  split: boolean;
  surrender: boolean;
  deal: boolean;
  finishInsurance: boolean;
  playDealer: boolean;
  nextRound: boolean;
}

const CoachModeSelector: React.FC<{ mode: CoachMode; onChange: (mode: CoachMode) => void }> = ({ mode, onChange }) => {
  const labels: Record<CoachMode, string> = {
    off: "Off",
    feedback: "Feedback",
    live: "Live"
  };

  const next = React.useCallback(() => {
    const order: CoachMode[] = ["off", "feedback", "live"];
    const index = order.indexOf(mode);
    const nextMode = order[(index + 1) % order.length];
    onChange(nextMode);
  }, [mode, onChange]);

  return (
    <button
      type="button"
      className="nj-btn nj-btn--ghost nj-coach-toggle"
      onClick={next}
      aria-label={`Toggle coach mode (currently ${labels[mode]})`}
    >
      <Sparkles size={16} aria-hidden="true" />
      <span className="nj-coach-toggle__label">Coach</span>
      <span className="nj-coach-toggle__value">{labels[mode]}</span>
    </button>
  );
};

export const NoirJackTable: React.FC<NoirJackTableProps> = ({
  game,
  coachMode,
  actions,
  onCoachModeChange,
  error,
  onDismissError,
  modeToggle
}) => {
  const [activeChip, setActiveChip] = React.useState<ChipDenomination>(25);
  const [coachMessage, setCoachMessage] = React.useState<{ tone: "correct" | "better"; text: string } | null>(null);
  const [flashAction, setFlashAction] = React.useState<Action | null>(null);
  const messageTimer = React.useRef<number | null>(null);
  const highlightTimer = React.useRef<number | null>(null);
  const [result, setResult] = React.useState<{ tone: ResultTone; message: string } | null>(null);
  const resultTimer = React.useRef<number | null>(null);
  const [chipMotion, setChipMotion] = React.useState<{ value: ChipDenomination; type: "add" | "remove"; stamp: number } | null>(
    null
  );
  const prefersReducedMotion = usePrefersReducedMotion();
  const vibrate = useHaptics(prefersReducedMotion);
  const isMobile = useMediaQuery("(max-width: 480px)");
  const chipSheetId = React.useId();
  const [chipsOpen, setChipsOpen] = React.useState(false);
  const messageCountRef = React.useRef<number>(game.messageLog.length);

  React.useEffect(() => {
    if (messageTimer.current) {
      window.clearTimeout(messageTimer.current);
      messageTimer.current = null;
    }
    if (coachMessage) {
      messageTimer.current = window.setTimeout(() => {
        setCoachMessage(null);
        messageTimer.current = null;
      }, 2500);
    }
    return () => {
      if (messageTimer.current) {
        window.clearTimeout(messageTimer.current);
      }
    };
  }, [coachMessage]);

  React.useEffect(() => {
    return () => {
      if (resultTimer.current) {
        window.clearTimeout(resultTimer.current);
      }
      if (highlightTimer.current) {
        window.clearTimeout(highlightTimer.current);
      }
      if (messageTimer.current) {
        window.clearTimeout(messageTimer.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!isMobile) {
      setChipsOpen(false);
    }
  }, [isMobile]);

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

  const seat = game.seats[PRIMARY_SEAT_INDEX] ?? null;
  const activeHand = findActiveHand(game);

  const actionContext = React.useMemo(() => {
    if (!activeHand || !seat || game.phase !== "playerActions") {
      return null;
    }
    return {
      hand: activeHand,
      hit: canHit(activeHand),
      stand: !activeHand.isResolved,
      double: canDouble(activeHand, game.rules) && game.bankroll >= activeHand.bet,
      split: canSplit(activeHand, seat, game.rules) && game.bankroll >= activeHand.bet,
      surrender: canSurrender(activeHand, game.rules)
    };
  }, [activeHand, game.bankroll, game.phase, game.rules, seat]);

  const dealerUpcard = game.dealer.upcard;

  const recommendation = React.useMemo(() => {
    if (!actionContext || !dealerUpcard) {
      return null;
    }
    const rank = dealerUpcard.rank as PlayerContext["dealerUpcard"]["rank"];
    const context: PlayerContext = {
      dealerUpcard: {
        rank,
        value10: dealerUpcard.rank === "10" || dealerUpcard.rank === "J" || dealerUpcard.rank === "Q" || dealerUpcard.rank === "K"
      },
      cards: actionContext.hand.cards.map((card) => ({ rank: card.rank })),
      isInitialTwoCards: actionContext.hand.cards.length === 2 && !actionContext.hand.hasActed,
      afterSplit: Boolean(actionContext.hand.isSplitHand),
      legal: {
        hit: actionContext.hit,
        stand: actionContext.stand,
        double: actionContext.double,
        split: actionContext.split,
        surrender: actionContext.surrender
      }
    };
    return getRecommendation(context, game.rules);
  }, [actionContext, dealerUpcard, game.rules]);

  const recommendedAction = React.useMemo<Action | null>(() => {
    if (!recommendation || !actionContext) {
      return null;
    }
    const isLegal = (action: Action | undefined): boolean => {
      if (!action) {
        return false;
      }
      switch (action) {
        case "hit":
          return actionContext.hit;
        case "stand":
          return actionContext.stand;
        case "double":
          return actionContext.double;
        case "split":
          return actionContext.split;
        case "surrender":
          return actionContext.surrender;
        default:
          return false;
      }
    };
    if (isLegal(recommendation.best)) {
      return recommendation.best;
    }
    if (recommendation.fallback && isLegal(recommendation.fallback)) {
      return recommendation.fallback;
    }
    return null;
  }, [actionContext, recommendation]);

  const highlightedAction = React.useMemo<Action | null>(() => {
    if (flashAction) {
      return flashAction;
    }
    if (coachMode === "live") {
      return recommendedAction;
    }
    return null;
  }, [coachMode, flashAction, recommendedAction]);

  const playActionTap = React.useCallback((action: Action) => {
    if (action === "hit" || action === "stand") {
      audioService.play("button");
    }
  }, []);

  const triggerFeedback = React.useCallback(
    (action: Action, callback: () => void) => {
      if (coachMode === "feedback" && recommendedAction) {
        const correct = action === recommendedAction;
        setCoachMessage({ tone: correct ? "correct" : "better", text: buildCoachMessage(recommendedAction, correct) });
        if (!correct) {
          setFlashAction(recommendedAction);
          if (highlightTimer.current) {
            window.clearTimeout(highlightTimer.current);
          }
          highlightTimer.current = window.setTimeout(() => {
            setFlashAction(null);
            highlightTimer.current = null;
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
  const handleDouble = React.useCallback(
    () => triggerFeedback("double", actions.playerDouble),
    [actions.playerDouble, triggerFeedback]
  );
  const handleSplit = React.useCallback(() => triggerFeedback("split", actions.playerSplit), [actions.playerSplit, triggerFeedback]);
  const handleSurrender = React.useCallback(
    () => triggerFeedback("surrender", actions.playerSurrender),
    [actions.playerSurrender, triggerFeedback]
  );

  const availability: ActionAvailability = React.useMemo(
    () => ({
      hit: Boolean(actionContext?.hit),
      stand: Boolean(actionContext?.stand),
      double: Boolean(actionContext?.double),
      split: Boolean(actionContext?.split),
      surrender: Boolean(actionContext?.surrender),
      deal: game.phase === "betting" && hasReadySeat(game),
      finishInsurance: game.phase === "insurance",
      playDealer: game.phase === "dealerPlay",
      nextRound: game.phase === "settlement"
    }),
    [actionContext, game]
  );

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

  const closeChipSheet = React.useCallback(() => setChipsOpen(false), []);

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

  const [insuranceHandId, insuranceAmount] = React.useMemo(() => {
    if (game.phase !== "insurance" || !seat) {
      return [null, 0] as const;
    }
    const hand = seat.hands.find((candidate) => candidate.insuranceBet === undefined && !candidate.isResolved);
    if (!hand) {
      return [null, 0] as const;
    }
    return [hand.id, Math.min(hand.bet / 2, game.bankroll)];
  }, [game.bankroll, game.phase, seat]);

  const showInsuranceSheet = Boolean(insuranceHandId && game.awaitingInsuranceResolution);

  const wasInsuranceOpen = usePrevious(showInsuranceSheet);

  React.useEffect(() => {
    if (showInsuranceSheet && !wasInsuranceOpen) {
      audioService.play("insurancePrompt");
    }
  }, [showInsuranceSheet, wasInsuranceOpen]);

  const takeInsurance = React.useCallback(() => {
    if (!insuranceHandId) {
      return;
    }
    audioService.play("button");
    vibrate();
    actions.takeInsurance(PRIMARY_SEAT_INDEX, insuranceHandId, insuranceAmount);
  }, [actions, insuranceAmount, insuranceHandId, vibrate]);

  const skipInsurance = React.useCallback(() => {
    if (!insuranceHandId) {
      return;
    }
    audioService.play("button");
    vibrate();
    actions.declineInsurance(PRIMARY_SEAT_INDEX, insuranceHandId);
  }, [actions, insuranceHandId, vibrate]);

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

  const prevPhase = usePrevious(game.phase);

  React.useEffect(() => {
    if (game.phase === "settlement" && prevPhase !== "settlement") {
      const parsed = parseResultMessage(game.messageLog);
      if (parsed) {
        setResult(parsed);
        if (resultTimer.current) {
          window.clearTimeout(resultTimer.current);
        }
        resultTimer.current = window.setTimeout(() => {
          setResult(null);
          resultTimer.current = null;
        }, 1800);
      }
    }
    if (game.phase !== "settlement" && prevPhase === "settlement") {
      setResult(null);
    }
  }, [game.messageLog, game.phase, prevPhase]);

  const dealerCards = game.dealer.hand.cards;
  const faceDownIndexes = React.useMemo(() => {
    if (game.phase === "settlement" || game.phase === "dealerPlay") {
      return [];
    }
    if (game.dealer.holeCard) {
      return [1];
    }
    return [];
  }, [game.dealer.holeCard, game.phase]);

  const totalCardCount = React.useMemo(() => {
    const dealerCount = dealerCards.length + (game.dealer.holeCard ? 1 : 0);
    const playerCount = game.seats.reduce((sum, seatItem) => {
      const seatCards = seatItem.hands.reduce((inner, hand) => inner + hand.cards.length, 0);
      return sum + seatCards;
    }, 0);
    return dealerCount + playerCount;
  }, [dealerCards, game.dealer.holeCard, game.seats]);
  const previousCardCount = usePrevious(totalCardCount);

  React.useEffect(() => {
    if (typeof previousCardCount === "number" && totalCardCount > previousCardCount) {
      audioService.play("deal");
    }
  }, [previousCardCount, totalCardCount]);

  const playerHands = seat?.hands ?? [];
  const rawActiveIndex = playerHands.findIndex((hand) => hand.id === game.activeHandId);
  const resolvedActiveIndex = rawActiveIndex >= 0 ? rawActiveIndex : playerHands.length > 0 ? 0 : -1;
  const focusedHand = activeHand ?? (resolvedActiveIndex >= 0 ? playerHands[resolvedActiveIndex] : null);

  const dealerStatus = React.useMemo(() => {
    if (faceDownIndexes.length > 0 && game.dealer.upcard) {
      return `Showing ${game.dealer.upcard.rank}`;
    }
    if (dealerCards.length > 0) {
      return `Total ${bestTotal(game.dealer.hand)}`;
    }
    return "Waiting";
  }, [dealerCards, faceDownIndexes, game.dealer.hand, game.dealer.upcard]);

  const previousHoleCard = usePrevious(game.dealer.holeCard);

  React.useEffect(() => {
    if (previousHoleCard && !game.dealer.holeCard) {
      audioService.play("flip");
    }
  }, [game.dealer.holeCard, previousHoleCard]);

  const playerTotal = focusedHand ? bestTotal(focusedHand) : null;
  const playerBet = focusedHand?.bet ?? seat?.baseBet ?? 0;

  const errorBanner = error ? (
    <div className="nj-glass nj-error" role="alert">
      <span>{error}</span>
      <button type="button" className="nj-btn nj-btn--ghost" onClick={onDismissError}>
        Dismiss
      </button>
    </div>
  ) : null;

  const stats = [
    { label: "Bankroll", value: formatCurrency(game.bankroll) },
    { label: "Round", value: game.roundCount },
    { label: "Phase", value: game.phase },
    { label: "Cards", value: game.shoe.cards.length },
    { label: "Discard", value: game.shoe.discard.length },
    { label: "Min", value: formatCurrency(game.rules.minBet) },
    { label: "Max", value: formatCurrency(game.rules.maxBet) }
  ];

  React.useEffect(() => {
    if (game.messageLog.length <= messageCountRef.current) {
      messageCountRef.current = game.messageLog.length;
      return;
    }
    const newMessages = game.messageLog.slice(messageCountRef.current);
    messageCountRef.current = game.messageLog.length;
    newMessages.forEach((message) => {
      const normalized = message.toLowerCase();
      if (normalized.includes("shoe reshuffled")) {
        audioService.play("shuffle");
        return;
      }
      if (normalized.includes("doubles and draws")) {
        audioService.play("double");
        return;
      }
      if (/splits\s/.test(normalized)) {
        audioService.play("split");
        return;
      }
      if (normalized.includes("surrenders")) {
        audioService.play("surrender");
        return;
      }
      if (normalized.includes("blackjack wins") || normalized.startsWith("dealer has blackjack")) {
        audioService.play("blackjack");
        return;
      }
      if (normalized.includes("busts and loses")) {
        audioService.play("lose");
        return;
      }
      if (normalized.endsWith("busts")) {
        audioService.play("bust");
        return;
      }
      if (normalized.includes("wins")) {
        audioService.play("win");
        return;
      }
      if (normalized.includes("pushes")) {
        audioService.play("push");
        return;
      }
      if (normalized.includes("loses")) {
        audioService.play("lose");
      }
    });
  }, [game.messageLog]);

  const actionHighlight = (action: Action): "best" | undefined =>
    highlightedAction === action ? "best" : undefined;

  const roundControls = [
    availability.deal
      ? {
          label: "Deal",
          onClick: handleDeal,
          disabled: !availability.deal
        }
      : null,
    availability.finishInsurance
      ? {
          label: "Finish insurance",
          onClick: handleFinishInsurance,
          disabled: !availability.finishInsurance
        }
      : null,
    availability.playDealer
      ? {
          label: "Play dealer",
          onClick: handlePlayDealer,
          disabled: !availability.playDealer
        }
      : null,
    availability.nextRound
      ? {
          label: "Next round",
          onClick: handleNextRound,
          disabled: !availability.nextRound
        }
      : null
  ].filter((control): control is { label: string; onClick: () => void; disabled: boolean } => control !== null);

  const renderChipTray = (options?: { closable?: boolean }): React.ReactNode => (
    <>
      <div className="nj-controls__tray-header">
        <span>Chips</span>
        <div className="nj-controls__tray-meta">
          <span>{formatCurrency(seat?.baseBet ?? 0)}</span>
          {options?.closable ? (
            <button type="button" className="nj-chip-sheet__close" onClick={closeChipSheet}>
              Close
            </button>
          ) : null}
        </div>
      </div>
      <div className="nj-chip-row">
        {CHIP_VALUES.map((value) => (
          <Chip
            key={value}
            value={value}
            size={56}
            selected={activeChip === value}
            onClick={() => handleSelectChip(value)}
            onContextMenu={(event) => {
              event.preventDefault();
              handleChipRemoval(value);
            }}
            aria-label={`Select ${value} chip`}
            data-chip-motion={chipMotion?.value === value ? `${chipMotion.type}-${chipMotion.stamp}` : undefined}
            className="nj-chip"
          />
        ))}
      </div>
      <div className="nj-tray-actions">
        <button type="button" className="nj-btn" onClick={handleAddActiveChip} disabled={game.phase !== "betting"}>
          Add {activeChip}
        </button>
        <button
          type="button"
          className="nj-btn nj-btn--ghost"
          onClick={handleRemoveActiveChip}
          disabled={game.phase !== "betting" || (seat?.baseBet ?? 0) <= 0}
        >
          Remove
        </button>
        <button
          type="button"
          className="nj-btn nj-btn--ghost"
          onClick={handleUndoChip}
          disabled={game.phase !== "betting" || (seat?.baseBet ?? 0) <= 0}
        >
          Undo last
        </button>
      </div>
    </>
  );

  return (
    <div className="noirjack-app">
      <div className="noirjack-felt" />
      <div className="noirjack-content">
        <header className="nj-topbar">
          <div className="nj-topbar__brand">
            <span className="nj-logo" aria-hidden="true">
              NOIRJACK
            </span>
            <span className="sr-only">NoirJack Blackjack table</span>
            <div className="nj-topbar__controls">
              <button type="button" className="nj-btn nj-btn--ghost" aria-label="Table information">
                <Info size={18} aria-hidden="true" />
              </button>
              <CoachModeSelector mode={coachMode} onChange={onCoachModeChange} />
              <NoirSoundControls />
              <button type="button" className="nj-btn nj-btn--ghost" aria-label="Table settings">
                <Settings2 size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="nj-topbar__mode">{modeToggle}</div>
          <div className="nj-topbar__stats nj-glass">
            {stats.map((item) => (
              <div key={item.label} className="nj-stat">
                <span className="nj-stat__label">{item.label}</span>
                <span className="nj-stat__value">{item.value}</span>
              </div>
            ))}
          </div>
          {errorBanner}
        </header>

        <div className="nj-play-area">
          <section className="nj-section nj-section--dealer">
            <div className="nj-glass nj-panel">
              <div className="nj-panel__header">
                <span className="nj-panel__title">Dealer</span>
                <span className="nj-panel__subtitle">{dealerStatus}</span>
              </div>
              <div className="nj-panel__cards">
                <NoirCardFan cards={dealerCards} faceDownIndexes={faceDownIndexes} />
              </div>
              {game.phase === "insurance" && (
                <div className="nj-panel__footer">Insurance available</div>
              )}
            </div>
          </section>

          <section className="nj-section nj-section--player">
            <div className="nj-glass nj-panel">
              <div className="nj-panel__header">
                <span className="nj-panel__title">Player</span>
                <div className="nj-panel__meta">
                  <div>
                    <span className="nj-stat__label">Total</span>
                    <span className="nj-panel__value">{playerTotal ?? "--"}</span>
                  </div>
                  <div>
                    <span className="nj-stat__label">Bet</span>
                    <span className="nj-panel__value">{formatCurrency(playerBet)}</span>
                  </div>
                </div>
              </div>
              <div className="nj-hand-carousel">
                <div className="nj-panel__cards">
                  <NoirCardFan cards={focusedHand?.cards ?? []} />
                </div>
                {playerHands.length > 1 && (
                  <div className="nj-hand-tabs" role="tablist" aria-label="Split hands">
                    {playerHands.map((hand, index) => (
                      <div
                        key={hand.id}
                        className={cn("nj-hand-tab", index === resolvedActiveIndex && "nj-hand-tab--active")}
                        role="tab"
                        aria-selected={index === resolvedActiveIndex}
                      >
                        <span>Hand {index + 1}</span>
                        <span>{bestTotal(hand)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {coachMessage && (
                <div
                  className={cn(
                    "nj-coach-banner",
                    coachMessage.tone === "correct" ? "nj-coach-banner--good" : "nj-coach-banner--warn"
                  )}
                >
                  {coachMessage.text}
                </div>
              )}
            </div>
          </section>
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
                {chipsOpen && (
                  <div className="nj-chip-sheet" id={chipSheetId} role="dialog" aria-modal="true" aria-label="Select chips">
                    <button
                      type="button"
                      className="nj-chip-sheet__backdrop"
                      aria-label="Close chips menu"
                      onClick={closeChipSheet}
                    />
                    <div className="nj-controls__tray nj-glass nj-chip-sheet__panel">
                      {renderChipTray({ closable: true })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="nj-controls__tray nj-glass">{renderChipTray()}</div>
            )}
          </div>
          <div className="nj-controls__actions nj-glass">
            <div className="nj-actions-primary">
              <button
                type="button"
                className="nj-btn nj-btn-primary"
                onClick={handleHit}
                disabled={game.phase !== "playerActions" || !availability.hit}
                data-coach={game.phase === "playerActions" ? actionHighlight("hit") : undefined}
              >
                Hit
              </button>
              <button
                type="button"
                className="nj-btn nj-btn-primary"
                onClick={handleStand}
                disabled={game.phase !== "playerActions" || !availability.stand}
                data-coach={game.phase === "playerActions" ? actionHighlight("stand") : undefined}
              >
                Stand
              </button>
            </div>
            <div className="nj-actions-secondary">
              <button
                type="button"
                className="nj-btn"
                onClick={handleDouble}
                disabled={game.phase !== "playerActions" || !availability.double}
                data-coach={game.phase === "playerActions" ? actionHighlight("double") : undefined}
              >
                Double
              </button>
              <button
                type="button"
                className="nj-btn"
                onClick={handleSplit}
                disabled={game.phase !== "playerActions" || !availability.split}
                data-coach={game.phase === "playerActions" ? actionHighlight("split") : undefined}
              >
                Split
              </button>
              <button
                type="button"
                className="nj-btn"
                onClick={handleSurrender}
                disabled={game.phase !== "playerActions" || !availability.surrender}
                data-coach={game.phase === "playerActions" ? actionHighlight("surrender") : undefined}
              >
                Surrender
              </button>
            </div>
            {roundControls.length > 0 && (
              <div className="nj-actions-round">
                {roundControls.map((control) => (
                  <button
                    key={control.label}
                    type="button"
                    className={cn("nj-btn", control.label === "Deal" ? "nj-btn-primary" : "nj-btn--ghost")}
                    onClick={control.onClick}
                    disabled={control.disabled}
                  >
                    {control.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showInsuranceSheet && (
        <div className="nj-insurance" role="dialog" aria-modal="true" aria-label="Insurance decision">
          <div className="nj-insurance__sheet nj-glass">
            <h2>Insurance?</h2>
            <p>Take insurance for €{insuranceAmount.toFixed(2)}?</p>
            <div className="nj-insurance__actions">
              <button type="button" className="nj-btn nj-btn-primary" onClick={takeInsurance}>
                Take insurance
              </button>
              <button type="button" className="nj-btn nj-btn--ghost" onClick={skipInsurance}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className={cn("nj-result", `nj-result--${result.tone}`)} role="status" aria-live="polite">
          <span className="nj-result__label">{result.message}</span>
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        {result ? `Player ${result.message}` : ""}
      </div>
    </div>
  );
};
