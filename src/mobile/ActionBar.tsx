import React from "react";
import type { GameState, Hand } from "../engine/types";
import { getLegalActions } from "../engine/rules";
import { Button } from "../components/ui/button";
import type { CoachMode } from "../store/useGameStore";
import { cn } from "../utils/cn";
import { PRIMARY_SEAT_INDEX } from "../ui/config";

interface ActionBarProps {
  game: GameState;
  activeHand: Hand | null;
  focusMatchesActive: boolean;
  coachMode: CoachMode;
  onDeal: () => void;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
  onSurrender: () => void;
  onFinishInsurance: () => void;
  onPlayDealer: () => void;
  onNextRound: () => void;
}

const hasReadyBet = (game: GameState): boolean => {
  const seat = game.seats[PRIMARY_SEAT_INDEX] ?? game.seats[0];
  if (!seat) {
    return false;
  }
  if (!seat.occupied) {
    return false;
  }
  if (seat.baseBet < game.rules.minBet) {
    return false;
  }
  if (seat.baseBet > game.rules.maxBet) {
    return false;
  }
  return seat.baseBet > 0 && seat.baseBet <= game.bankroll;
};

const actionLabel = (phase: GameState["phase"]): string | null => {
  switch (phase) {
    case "betting":
      return "Deal";
    case "insurance":
      return "Finish Insurance";
    case "dealerPlay":
      return "Play Dealer";
    case "settlement":
      return "Next Round";
    default:
      return null;
  }
};

export const ActionBar: React.FC<ActionBarProps> = ({
  game,
  activeHand,
  focusMatchesActive,
  coachMode,
  onDeal,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onSurrender,
  onFinishInsurance,
  onPlayDealer,
  onNextRound
}) => {
  const legal = React.useMemo(() => {
    if (!activeHand || game.phase !== "playerActions") {
      return { hit: false, stand: false, double: false, split: false, surrender: false };
    }
    const base = getLegalActions(game, activeHand);
    const bankrollOk = game.bankroll >= activeHand.bet;
    return {
      hit: base.canHit,
      stand: base.canStand,
      double: base.canDouble && bankrollOk,
      split: base.canSplit && bankrollOk,
      surrender: base.canSurrender
    };
  }, [activeHand, game]);

  const primaryDisabled = !focusMatchesActive || game.phase !== "playerActions";

  const utilityAction = actionLabel(game.phase);
  const handleUtility = () => {
    switch (game.phase) {
      case "betting":
        onDeal();
        break;
      case "insurance":
        onFinishInsurance();
        break;
      case "dealerPlay":
        onPlayDealer();
        break;
      case "settlement":
        onNextRound();
        break;
      default:
        break;
    }
  };

  const utilityDisabled = (() => {
    switch (game.phase) {
      case "betting":
        return !hasReadyBet(game);
      case "insurance":
        return false;
      case "dealerPlay":
        return false;
      case "settlement":
        return false;
      default:
        return true;
    }
  })();

  const actionButtons = [
    { label: "Hit", onClick: onHit, enabled: legal.hit && !primaryDisabled },
    { label: "Stand", onClick: onStand, enabled: legal.stand && !primaryDisabled }
  ];

  const secondaryButtons = [
    { label: "Double", onClick: onDouble, enabled: legal.double && !primaryDisabled },
    { label: "Split", onClick: onSplit, enabled: legal.split && !primaryDisabled },
    { label: "Surrender", onClick: onSurrender, enabled: legal.surrender && !primaryDisabled }
  ];

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {actionButtons.map((button) => (
          <Button
            key={button.label}
            size="lg"
            className={cn(
              "h-12 text-base font-semibold uppercase tracking-[0.3em]",
              !button.enabled && "opacity-60"
            )}
            onClick={button.onClick}
            disabled={!button.enabled}
          >
            {button.label}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {secondaryButtons.map((button) => (
          <Button
            key={button.label}
            variant="outline"
            className={cn(
              "h-11 text-[12px] font-semibold uppercase tracking-[0.28em]",
              !button.enabled && "opacity-60"
            )}
            onClick={button.onClick}
            disabled={!button.enabled}
          >
            {button.label}
          </Button>
        ))}
      </div>
      {utilityAction && (
        <Button
          variant="ghost"
          className="h-11 border border-[#c8a24a]/50 bg-[#154232]/70 text-[12px] font-semibold uppercase tracking-[0.3em] text-emerald-100"
          disabled={utilityDisabled}
          onClick={handleUtility}
        >
          {utilityAction}
        </Button>
      )}
      {coachMode !== "off" && (
        <p className="text-center text-[10px] uppercase tracking-[0.32em] text-emerald-300">
          Coach hints active
        </p>
      )}
    </div>
  );
};
