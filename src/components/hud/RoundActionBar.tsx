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
  return total <= game.bankroll && total > 0;
};

const findActiveHand = (game: GameState): Hand | null => {
  if (!game.activeHandId) {
    return null;
  }
  for (const seat of game.seats) {
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

  return (
    <div
      data-testid="round-action-bar"
      className="flex w-full items-center gap-3 overflow-x-auto rounded-2xl border border-[#c8a24a]/40 bg-[#0d2c22]/90 px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur"
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
          <Button size="sm" onClick={onHit} disabled={!actionContext.hit}>
            Hit
          </Button>
          <Button size="sm" variant="outline" onClick={onStand} disabled={!actionContext.stand}>
            Stand
          </Button>
          <Button size="sm" variant="outline" onClick={onDouble} disabled={!actionContext.double}>
            Double
          </Button>
          <Button size="sm" variant="outline" onClick={onSplit} disabled={!actionContext.split}>
            Split
          </Button>
          <Button size="sm" variant="outline" onClick={onSurrender} disabled={!actionContext.surrender}>
            Surrender
          </Button>
        </div>
      )}
    </div>
  );
};
