import React from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import type { GameState, Hand } from "../../engine/types";
import { canDouble, canHit, canSplit, canSurrender } from "../../engine/rules";
import { formatCurrency } from "../../utils/currency";
import { ANIM, REDUCED } from "../../utils/animConstants";
import { filterSeatsForMode } from "../../ui/config";
import { getRecommendation, toDealerRank, type Action, type PlayerContext } from "../../utils/basicStrategy";
import type { CoachMode } from "../../store/useCoachStore";
import type { CoachFeedback } from "../../utils/coach";
import { formatActionLabel } from "../../utils/coach";

interface RoundActionBarProps {
  game: GameState;
  onDeal: () => void;
  onFinishInsurance: () => void;
  onPlayDealer: () => void;
  onNextRound: () => void;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
  onSurrender: () => void;
  coachMode: CoachMode;
  onCoachFeedback: (feedback: CoachFeedback) => void;
  feedback: CoachFeedback | null;
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

export const RoundActionBar: React.FC<RoundActionBarProps> = ({
  game,
  onDeal,
  onFinishInsurance,
  onPlayDealer,
  onNextRound,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onSurrender,
  coachMode,
  onCoachFeedback,
  feedback
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

  const playerContext: PlayerContext | null = React.useMemo(() => {
    if (!actionContext || !activeHand || !dealerUpcard) {
      return null;
    }
    return {
      dealerUpcard: { rank: toDealerRank(dealerUpcard.rank) },
      cards: activeHand.cards.map((card) => ({ rank: card.rank })),
      isInitialTwoCards: activeHand.cards.length === 2 && !activeHand.hasActed,
      afterSplit: Boolean(activeHand.isSplitHand),
      legal: {
        hit: actionContext.hit,
        stand: actionContext.stand,
        double: actionContext.double,
        split: actionContext.split,
        surrender: actionContext.surrender
      }
    };
  }, [actionContext, activeHand, dealerUpcard]);

  const recommendation = React.useMemo(() => {
    if (!playerContext) {
      return null;
    }
    return getRecommendation(playerContext, game.rules);
  }, [game.rules, playerContext]);

  const recommendedAction: Action | null = React.useMemo(() => {
    if (!recommendation) {
      return null;
    }
    return recommendation.fallback ?? recommendation.best;
  }, [recommendation]);

  const showActions = game.phase !== "betting" || hasReadySeat(game);
  const fadeDuration = REDUCED ? 0 : ANIM.fade.duration;

  const handlePlayerAction = React.useCallback(
    (action: Action, callback: () => void) => {
      callback();
      if (coachMode !== "feedback" || !recommendation || !recommendedAction) {
        return;
      }
      const correct = action === recommendedAction;
      const message = correct
        ? `Good move — ${recommendation.reasoning}`
        : `Better: ${formatActionLabel(recommendedAction)} — ${recommendation.reasoning}`;
      onCoachFeedback({
        severity: correct ? "correct" : "better",
        message,
        action: recommendedAction
      });
    },
    [coachMode, onCoachFeedback, recommendation, recommendedAction]
  );

  const coachTitle =
    recommendation && recommendedAction
      ? `Best move (Basic Strategy): ${formatActionLabel(recommendedAction)}. ${recommendation.reasoning}`
      : undefined;

  const feedbackStyle =
    feedback?.severity === "correct"
      ? "border-emerald-400/60 bg-emerald-600/25 text-emerald-100"
      : "border-amber-400/60 bg-amber-500/20 text-amber-100";

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

      {actionContext && (
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-[10px] uppercase tracking-[0.4em] text-emerald-200 md:inline">
            Active Bet {formatCurrency(actionContext.hand.bet)}
          </span>
          <Button
            size="sm"
            onClick={() => handlePlayerAction("hit", onHit)}
            disabled={!actionContext.hit}
            data-coach={coachMode === "live" && recommendedAction === "hit" ? "best" : undefined}
            title={coachMode === "live" && recommendedAction === "hit" ? coachTitle : undefined}
          >
            Hit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePlayerAction("stand", onStand)}
            disabled={!actionContext.stand}
            data-coach={coachMode === "live" && recommendedAction === "stand" ? "best" : undefined}
            title={coachMode === "live" && recommendedAction === "stand" ? coachTitle : undefined}
          >
            Stand
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePlayerAction("double", onDouble)}
            disabled={!actionContext.double}
            data-coach={coachMode === "live" && recommendedAction === "double" ? "best" : undefined}
            title={coachMode === "live" && recommendedAction === "double" ? coachTitle : undefined}
          >
            Double
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePlayerAction("split", onSplit)}
            disabled={!actionContext.split}
            data-coach={coachMode === "live" && recommendedAction === "split" ? "best" : undefined}
            title={coachMode === "live" && recommendedAction === "split" ? coachTitle : undefined}
          >
            Split
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePlayerAction("surrender", onSurrender)}
            disabled={!actionContext.surrender}
            data-coach={coachMode === "live" && recommendedAction === "surrender" ? "best" : undefined}
            title={coachMode === "live" && recommendedAction === "surrender" ? coachTitle : undefined}
          >
            Surrender
          </Button>
          {feedback && coachMode === "feedback" ? (
            <div
              className={`ml-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] ${feedbackStyle}`}
            >
              {feedback.message}
            </div>
          ) : null}
        </div>
      )}
    </motion.div>
  );
};
