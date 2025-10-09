import * as React from "react";
import type { GameState, Hand } from "../../../engine/types";
import type { CoachMode } from "../../../store/useGameStore";
import {
  getRecommendation,
  type Action,
  type PlayerContext,
} from "../../../utils/basicStrategy";
import type { ActionContext } from "../selectors";

interface UseActionRecommendationArgs {
  game: GameState;
  hand: Hand | null;
  legal: ActionContext | null;
  coachMode: CoachMode;
  dealerUpcard?: GameState["dealer"]["upcard"];
  flashOverride?: Action | null;
}

interface UseActionRecommendationResult {
  recommendedAction: Action | null;
  highlightedAction: Action | null;
}

export function useActionRecommendation({
  game,
  hand,
  legal,
  coachMode,
  dealerUpcard,
  flashOverride,
}: UseActionRecommendationArgs): UseActionRecommendationResult {
  const recommendation = React.useMemo(() => {
    if (!legal || !hand || !dealerUpcard) {
      return null;
    }
    const rank = dealerUpcard.rank as PlayerContext["dealerUpcard"]["rank"];
    const context: PlayerContext = {
      dealerUpcard: {
        rank,
        value10:
          dealerUpcard.rank === "10" ||
          dealerUpcard.rank === "J" ||
          dealerUpcard.rank === "Q" ||
          dealerUpcard.rank === "K",
      },
      cards: hand.cards.map((card: Hand["cards"][number]) => ({ rank: card.rank })),
      isInitialTwoCards: hand.cards.length === 2 && !hand.hasActed,
      afterSplit: Boolean(hand.isSplitHand),
      legal: {
        hit: legal.hit,
        stand: legal.stand,
        double: legal.double,
        split: legal.split,
        surrender: legal.surrender,
      },
    };
    return getRecommendation(context, game.rules);
  }, [dealerUpcard, game.rules, hand, legal]);

  const recommendedAction = React.useMemo<Action | null>(() => {
    if (!recommendation || !legal) {
      return null;
    }
    const isLegal = (action: Action | undefined): boolean => {
      if (!action) {
        return false;
      }
      switch (action) {
        case "hit":
          return legal.hit;
        case "stand":
          return legal.stand;
        case "double":
          return legal.double;
        case "split":
          return legal.split;
        case "surrender":
          return legal.surrender;
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
  }, [legal, recommendation]);

  const highlightedAction = React.useMemo<Action | null>(() => {
    if (flashOverride) {
      return flashOverride;
    }
    if (coachMode === "live") {
      return recommendedAction;
    }
    return null;
  }, [coachMode, flashOverride, recommendedAction]);

  return { recommendedAction, highlightedAction };
}
