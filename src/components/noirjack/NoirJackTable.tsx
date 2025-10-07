import React from "react";
import type { GameState, Hand } from "../../engine/types";
import { PRIMARY_SEAT_INDEX, filterSeatsForMode } from "../../ui/config";
import type { CoachMode } from "../../store/useGameStore";
import type { ChipDenomination } from "../../theme/palette";
import { canDouble, canHit, canSplit, canSurrender } from "../../engine/rules";
import { getRecommendation, type Action, type PlayerContext } from "../../utils/basicStrategy";
import { TopBar } from "./TopBar";
import { DealerZone } from "./DealerZone";
import { PlayerZone } from "./PlayerZone";
import { ControlsZone, type ActionAvailability } from "./Controls";
import { InsuranceSheet } from "./InsuranceSheet";
import { ResultBanner, type ResultTone } from "./ResultBanner";
import { usePrefersReducedMotion } from "./hooks";
import { formatCurrency } from "../../utils/currency";

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
  return correct ? `Nice! ${label} was right.` : `Try ${label} next time.`;
};

const usePrevious = <T,>(value: T): T | undefined => {
  const ref = React.useRef<T>();
  React.useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

const penetrationPercentage = (game: GameState): string => {
  const totalCards = game.shoe.cards.length + game.shoe.discard.length;
  if (totalCards === 0) {
    return "0%";
  }
  const penetration = game.shoe.discard.length / totalCards;
  return `${Math.round(penetration * 100)}%`;
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
  const [result, setResult] = React.useState<{ tone: ResultTone; message: string } | null>(null);
  const [srAnnouncement, setSrAnnouncement] = React.useState<string>("");
  const messageTimer = React.useRef<number | null>(null);
  const highlightTimer = React.useRef<number | null>(null);
  const resultTimer = React.useRef<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  React.useEffect(() => {
    if (messageTimer.current) {
      window.clearTimeout(messageTimer.current);
      messageTimer.current = null;
    }
    if (coachMessage) {
      messageTimer.current = window.setTimeout(() => {
        setCoachMessage(null);
        messageTimer.current = null;
      }, 2600);
    }
    return () => {
      if (messageTimer.current) {
        window.clearTimeout(messageTimer.current);
      }
    };
  }, [coachMessage]);

  React.useEffect(() => {
    return () => {
      if (highlightTimer.current) {
        window.clearTimeout(highlightTimer.current);
      }
      if (resultTimer.current) {
        window.clearTimeout(resultTimer.current);
      }
    };
  }, []);

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

  const vibrate = React.useCallback(() => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(prefersReducedMotion ? 0 : 12);
    }
  }, [prefersReducedMotion]);

  const triggerFeedback = React.useCallback(
    (action: Action, callback: () => void) => {
      vibrate();
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
      callback();
    },
    [coachMode, recommendedAction, vibrate]
  );

  const handleHit = React.useCallback(() => triggerFeedback("hit", actions.playerHit), [actions.playerHit, triggerFeedback]);
  const handleStand = React.useCallback(() => triggerFeedback("stand", actions.playerStand), [actions.playerStand, triggerFeedback]);
  const handleDouble = React.useCallback(() => triggerFeedback("double", actions.playerDouble), [actions.playerDouble, triggerFeedback]);
  const handleSplit = React.useCallback(() => triggerFeedback("split", actions.playerSplit), [actions.playerSplit, triggerFeedback]);
  const handleSurrender = React.useCallback(
    () => triggerFeedback("surrender", actions.playerSurrender),
    [actions.playerSurrender, triggerFeedback]
  );

  const availability = React.useMemo<ActionAvailability>(() => ({
    hit: Boolean(actionContext?.hit),
    stand: Boolean(actionContext?.stand),
    double: Boolean(actionContext?.double),
    split: Boolean(actionContext?.split),
    surrender: Boolean(actionContext?.surrender),
    deal: game.phase === "betting" && hasReadySeat(game),
    finishInsurance: game.phase === "insurance",
    playDealer: game.phase === "dealerPlay",
    nextRound: game.phase === "settlement"
  }), [actionContext, game]);

  const handleAddChip = React.useCallback(
    (value: ChipDenomination) => {
      if (game.phase !== "betting" || !seat) {
        return;
      }
      const nextBet = seat.baseBet + value;
      if (nextBet > game.rules.maxBet || nextBet > game.bankroll) {
        return;
      }
      actions.addChip(PRIMARY_SEAT_INDEX, value);
    },
    [actions, game.bankroll, game.phase, game.rules.maxBet, seat]
  );

  const handleRemoveChipValue = React.useCallback(
    (value: ChipDenomination) => {
      if (game.phase !== "betting" || !seat || seat.baseBet <= 0) {
        return;
      }
      actions.removeChipValue(PRIMARY_SEAT_INDEX, value);
    },
    [actions, game.phase, seat]
  );

  const handleRemoveTopChip = React.useCallback(() => {
    if (game.phase !== "betting" || !seat || seat.baseBet <= 0) {
      return;
    }
    actions.removeTopChip(PRIMARY_SEAT_INDEX);
  }, [actions, game.phase, seat]);

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

  const takeInsurance = React.useCallback(() => {
    if (!insuranceHandId) {
      return;
    }
    actions.takeInsurance(PRIMARY_SEAT_INDEX, insuranceHandId, insuranceAmount);
  }, [actions, insuranceAmount, insuranceHandId]);

  const skipInsurance = React.useCallback(() => {
    if (!insuranceHandId) {
      return;
    }
    actions.declineInsurance(PRIMARY_SEAT_INDEX, insuranceHandId);
  }, [actions, insuranceHandId]);

  const prevPhase = usePrevious(game.phase);
  const prevBankroll = usePrevious(game.bankroll);
  const [bankrollPulse, setBankrollPulse] = React.useState<"win" | "lose" | null>(null);

  React.useEffect(() => {
    if (game.phase === "settlement" && prevPhase !== "settlement") {
      const parsed = parseResultMessage(game.messageLog);
      if (parsed) {
        setResult(parsed);
        setSrAnnouncement(parsed.message);
        if (resultTimer.current) {
          window.clearTimeout(resultTimer.current);
        }
        resultTimer.current = window.setTimeout(() => {
          setResult(null);
          resultTimer.current = null;
        }, prefersReducedMotion ? 0 : 1800);
      }
    }
    if (game.phase !== "settlement" && prevPhase === "settlement") {
      setResult(null);
    }
  }, [game.messageLog, game.phase, prevPhase, prefersReducedMotion]);

  React.useEffect(() => {
    if (!result) {
      setSrAnnouncement("");
    }
  }, [result]);

  React.useEffect(() => {
    if (prevBankroll === undefined || prevBankroll === game.bankroll) {
      return;
    }
    const pulse: "win" | "lose" = game.bankroll > prevBankroll ? "win" : "lose";
    setBankrollPulse(pulse);
    const timeout = window.setTimeout(() => setBankrollPulse(null), prefersReducedMotion ? 0 : pulse === "win" ? 900 : 600);
    return () => window.clearTimeout(timeout);
  }, [game.bankroll, prevBankroll, prefersReducedMotion]);

  React.useEffect(() => {
    if (game.phase !== "settlement") {
      setCoachMessage((current) => (coachMode === "feedback" ? current : null));
      setFlashAction(null);
    }
  }, [coachMode, game.phase]);

  const visibleSeats = React.useMemo(() => filterSeatsForMode(game.seats), [game.seats]);
  const totalPendingBets = visibleSeats.reduce((sum, seatCandidate) => sum + seatCandidate.baseBet, 0);

  const insuranceMessage = game.phase === "insurance" ? "Insurance available" : null;

  return (
    <main className="noirjack-theme">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-16">
        <TopBar
          bankroll={game.bankroll}
          pendingBet={seat?.baseBet ?? 0}
          round={game.roundCount}
          phase={game.phase}
          cardsRemaining={game.shoe.cards.length}
          discardCount={game.shoe.discard.length}
          penetration={penetrationPercentage(game)}
          rules={game.rules}
          coachMode={coachMode}
          onCoachModeChange={onCoachModeChange}
          modeToggle={modeToggle}
          bankrollPulse={bankrollPulse}
        />
        {error ? (
          <div className="nj-glass border border-[rgba(220,38,38,0.4)] bg-[rgba(45,12,12,0.6)] px-4 py-3 text-sm text-[var(--nj-text)]">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button type="button" className="nj-btn px-3 py-1 text-[0.68rem] uppercase tracking-[0.28em]" onClick={onDismissError}>
                Dismiss
              </button>
            </div>
          </div>
        ) : null}
        <DealerZone dealer={game.dealer} phase={game.phase} insuranceMessage={insuranceMessage} />
        <PlayerZone seat={seat} activeHandId={game.activeHandId} />
        <div className="text-[0.62rem] uppercase tracking-[0.32em] text-[var(--nj-text-muted)]">
          Pending bets {formatCurrency(totalPendingBets)}
        </div>
        <ControlsZone
          activeChip={activeChip}
          onSelectChip={setActiveChip}
          onAddChip={handleAddChip}
          onRemoveChip={handleRemoveChipValue}
          onRemoveTopChip={handleRemoveTopChip}
          chipDisabled={game.phase !== "betting"}
          availability={availability}
          onDeal={actions.deal}
          onFinishInsurance={actions.finishInsurance}
          onPlayDealer={actions.playDealer}
          onNextRound={actions.nextRound}
          onHit={handleHit}
          onStand={handleStand}
          onDouble={handleDouble}
          onSplit={handleSplit}
          onSurrender={handleSurrender}
          highlightedAction={highlightedAction}
          coachMode={coachMode}
          coachMessage={coachMessage}
          bankroll={game.bankroll}
          bet={seat?.baseBet ?? 0}
        />
      </div>
      {showInsuranceSheet ? (
        <InsuranceSheet open amount={insuranceAmount} onTake={takeInsurance} onSkip={skipInsurance} />
      ) : null}
      {result ? <ResultBanner tone={result.tone} message={result.message} /> : null}
      <div className="sr-announcer" aria-live="polite">
        {srAnnouncement}
      </div>
    </main>
  );
};
