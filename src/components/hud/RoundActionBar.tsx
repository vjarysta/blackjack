import React from "react";
import { Button } from "../ui/button";
import type { GameState, Hand } from "../../engine/types";
import { canDouble, canHit, canSplit, canSurrender } from "../../engine/rules";
import { formatCurrency } from "../../utils/currency";

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
}

const hasReadySeat = (game: GameState): boolean => {
  const readySeats = game.seats.filter((seat) => seat.occupied && seat.baseBet >= game.rules.minBet);
  if (readySeats.length === 0) {
    return false;
  }
  const total = readySeats.reduce((sum, seat) => sum + seat.baseBet, 0);
  return total <= game.bankroll;
};

const getActiveHand = (game: GameState): Hand | null => {
  if (game.phase !== "playerActions") {
    return null;
  }
  if (game.activeSeatIndex === null || game.activeHandId === null) {
    return null;
  }
  const seat = game.seats[game.activeSeatIndex];
  return seat.hands.find((hand) => hand.id === game.activeHandId) ?? null;
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
  onSurrender
}) => {
  const activeHand = getActiveHand(game);

  const legalActions = React.useMemo(() => {
    if (!activeHand) {
      return null;
    }
    return {
      hit: canHit(activeHand),
      stand: !activeHand.isResolved,
      double: canDouble(activeHand, game.rules) && game.bankroll >= activeHand.bet,
      split: canSplit(activeHand, game.seats[activeHand.parentSeatIndex], game.rules) &&
        game.bankroll >= activeHand.bet,
      surrender: canSurrender(activeHand, game.rules)
    };
  }, [activeHand, game]);

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onDeal} disabled={game.phase !== "betting" || !hasReadySeat(game)}>
            Deal
          </Button>
          <Button variant="outline" onClick={onFinishInsurance} disabled={game.phase !== "insurance"}>
            Finish Insurance
          </Button>
          <Button variant="outline" onClick={onPlayDealer} disabled={game.phase !== "dealerPlay"}>
            Play Dealer
          </Button>
          <Button variant="outline" onClick={onNextRound} disabled={game.phase !== "settlement"}>
            Next Round
          </Button>
        </div>
        {activeHand && legalActions && (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={onHit} disabled={!legalActions.hit}>
              Hit
            </Button>
            <Button size="sm" variant="outline" onClick={onStand} disabled={!legalActions.stand}>
              Stand
            </Button>
            <Button size="sm" variant="outline" onClick={onDouble} disabled={!legalActions.double}>
              Double
            </Button>
            <Button size="sm" variant="outline" onClick={onSplit} disabled={!legalActions.split}>
              Split
            </Button>
            <Button size="sm" variant="outline" onClick={onSurrender} disabled={!legalActions.surrender}>
              Surrender
            </Button>
          </div>
        )}
      </div>
      <p className="text-xs uppercase tracking-[0.25em] text-emerald-200/80">
        Minimum bet {formatCurrency(game.rules.minBet)} · Maximum bet {formatCurrency(game.rules.maxBet)}
      </p>
    </div>
  );
};
