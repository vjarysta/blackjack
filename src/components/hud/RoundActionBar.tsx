import React from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import type { GameState, Hand } from "../../engine/types";
import { canDouble, canHit, canSplit, canSurrender } from "../../engine/rules";
import { formatCurrency } from "../../utils/currency";
import { ANIM, REDUCED } from "../../utils/animConstants";
import { filterSeatsForMode } from "../../ui/config";
import type { CoachMode } from "../../store/useGameStore";
import { getRecommendation, type Action, type PlayerContext } from "../../utils/basicStrategy";
import { cn } from "../../utils/cn";

export type CoachFeedback = {
  tone: "correct" | "better" | "info";
  message: string;
  highlightAction?: Action;
};

interface RoundActionBarProps {
  game: GameState;
  coachMode: CoachMode;
  feedback: CoachFeedback | null;
  onCoachFeedback: (feedback: CoachFeedback) => void;
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

const hasReadySeat = (game: GameState): boolean => {
  const seats = filterSeatsForMode(game.seats);
  const readySeats = seats.filter((seat) => seat.occupied && seat.baseBet >= game.rules.minBet);
  if (readySeats.length === 0) {
    return false;
  }
  const total = readySeats.reduce((sum, seat) => sum + seat.baseBet, 0);
  return total <= game.bankroll && total > 0;
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

const formatAction = (action: Action): string => {
  switch (action) {
    case "hit":
      return "Hit";
    case "stand":
      return "Stand";
    case "double":
      return "Double";
    case "split":
      return "Split";
    case "surrender":
      return "Surrender";
    case "insurance-skip":
      return "Skip Insurance";
    default:
      return action;
  }
};

const FEEDBACK_STYLES: Record<CoachFeedback["tone"], string> = {
  correct: "border-emerald-400/60 bg-emerald-900/70 text-emerald-100",
  better: "border-[#c8a24a]/60 bg-[#36240c]/80 text-[#f4dba5]",
  info: "border-emerald-300/50 bg-emerald-800/60 text-emerald-100"
};

export const RoundActionBar: React.FC<RoundActionBarProps> = ({
  game,
  coachMode,
  feedback,
  onCoachFeedback,
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
  const activeHand = findActiveHand(game);
  const parentSeat = activeHand ? game.seats[activeHand.parentSeatIndex] : null;

  const actionContext = React.useMemo(() => {
    if (!activeHand || !parentSeat || game.phase !== "playerActions") {
      return null;
    }
    return {
      hand: activeHand,
      hit: canHit(activeHand),
      stand: !activeHand.isResolved,
      double: canDouble(activeHand, game.rules) && game.bankroll >= activeHand.bet,
      split: canSplit(activeHand, parentSeat, game.rules) && game.bankroll >= activeHand.bet,
      surrender: canSurrender(activeHand, game.rules)
    };
  }, [activeHand, game.bankroll, game.phase, game.rules, parentSeat]);

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
      isInitialTwoCards:
        actionContext.hand.cards.length === 2 && !Boolean(actionContext.hand.hasActed),
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
    const fallbackAction = recommendation.fallback;
    if (fallbackAction && isLegal(fallbackAction)) {
      return fallbackAction;
    }
    return null;
  }, [actionContext, recommendation]);

  const liveTooltip = React.useMemo(() => {
    if (!recommendation || !recommendedAction) {
      return undefined;
    }
    return `Best move (Basic Strategy): ${formatAction(recommendedAction)}. ${recommendation.reasoning}`;
  }, [recommendation, recommendedAction]);

  const [flashAction, setFlashAction] = React.useState<Action | null>(null);
  const flashTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (feedback?.tone === "better" && feedback.highlightAction) {
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
      setFlashAction(feedback.highlightAction);
      flashTimerRef.current = window.setTimeout(() => {
        setFlashAction(null);
        flashTimerRef.current = null;
      }, 1000);
    }
  }, [feedback]);

  React.useEffect(
    () => () => {
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
    },
    []
  );

  const handleAction = React.useCallback(
    (action: Action, callback: () => void) => {
      if (coachMode === "feedback" && recommendation && recommendedAction) {
        if (action === recommendedAction) {
          onCoachFeedback({
            tone: "correct",
            message: `Good move — ${recommendation.reasoning}`,
            highlightAction: recommendedAction
          });
        } else {
          onCoachFeedback({
            tone: "better",
            message: `Better: ${formatAction(recommendedAction)} — ${recommendation.reasoning}`,
            highlightAction: recommendedAction
          });
        }
      }
      callback();
    },
    [coachMode, onCoachFeedback, recommendation, recommendedAction]
  );

  const triggerHit = React.useCallback(() => handleAction("hit", onHit), [handleAction, onHit]);
  const triggerStand = React.useCallback(() => handleAction("stand", onStand), [handleAction, onStand]);
  const triggerDouble = React.useCallback(() => handleAction("double", onDouble), [handleAction, onDouble]);
  const triggerSplit = React.useCallback(() => handleAction("split", onSplit), [handleAction, onSplit]);
  const triggerSurrender = React.useCallback(
    () => handleAction("surrender", onSurrender),
    [handleAction, onSurrender]
  );

  const shouldHighlight = React.useCallback(
    (action: Action) => {
      if (flashAction === action) {
        return true;
      }
      if (coachMode === "live" && recommendedAction === action) {
        return true;
      }
      return false;
    },
    [coachMode, flashAction, recommendedAction]
  );

  const highlightAttr = (action: Action) => (shouldHighlight(action) ? "best" : undefined);

  const tooltipForAction = (action: Action) => {
    if (flashAction === action && feedback) {
      return feedback.message;
    }
    if (coachMode === "live" && recommendedAction === action) {
      return liveTooltip;
    }
    return undefined;
  };

  const showActions = game.phase !== "betting" || hasReadySeat(game);
  const fadeDuration = REDUCED ? 0 : ANIM.fade.duration;

  return (
    <motion.div
      data-testid="round-action-bar"
      className="flex w-full items-center gap-3 overflow-x-auto rounded-2xl border border-[#c8a24a]/40 bg-[#0d2c22]/90 px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur"
      initial={false}
      animate={{ opacity: showActions ? 1 : 0, y: showActions ? 0 : 10 }}
      transition={{ ...ANIM.fade, duration: fadeDuration }}
      style={{ pointerEvents: showActions ? "auto" : "none" }}
    >
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onDeal} disabled={game.phase !== "betting" || !hasReadySeat(game)}>
          Deal
        </Button>
        <Button size="sm" variant="outline" onClick={onFinishInsurance} disabled={game.phase !== "insurance"}>
          Finish Insurance
        </Button>
        <Button size="sm" variant="outline" onClick={onPlayDealer} disabled={game.phase !== "dealerPlay"}>
          Play Dealer
        </Button>
        <Button size="sm" variant="outline" onClick={onNextRound} disabled={game.phase !== "settlement"}>
          Next Round
        </Button>
      </div>

      <div className="ml-auto flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        {feedback && (
          <div
            role="status"
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]",
              FEEDBACK_STYLES[feedback.tone]
            )}
          >
            {feedback.message}
          </div>
        )}
        {actionContext && (
          <div className="flex items-center gap-2">
            <span className="hidden text-[10px] uppercase tracking-[0.4em] text-emerald-200 md:inline">
              Active Bet {formatCurrency(actionContext.hand.bet)}
            </span>
            <Button
              size="sm"
              onClick={triggerHit}
              disabled={!actionContext.hit}
              data-coach={highlightAttr("hit")}
              title={tooltipForAction("hit")}
            >
              Hit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={triggerStand}
              disabled={!actionContext.stand}
              data-coach={highlightAttr("stand")}
              title={tooltipForAction("stand")}
            >
              Stand
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={triggerDouble}
              disabled={!actionContext.double}
              data-coach={highlightAttr("double")}
              title={tooltipForAction("double")}
            >
              Double
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={triggerSplit}
              disabled={!actionContext.split}
              data-coach={highlightAttr("split")}
              title={tooltipForAction("split")}
            >
              Split
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={triggerSurrender}
              disabled={!actionContext.surrender}
              data-coach={highlightAttr("surrender")}
              title={tooltipForAction("surrender")}
            >
              Surrender
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
