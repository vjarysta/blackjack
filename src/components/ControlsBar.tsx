import React from "react";
import { Button } from "./ui/button";
import type { GameState } from "../engine/types";

interface ControlsBarProps {
  game: GameState;
  onDeal: () => void;
  onFinishInsurance: () => void;
  onNextRound: () => void;
  onPlayDealer: () => void;
}

const hasReadySeat = (game: GameState): boolean => {
  const readySeats = game.seats.filter((seat) => seat.occupied && seat.baseBet >= game.rules.minBet);
  if (readySeats.length === 0) {
    return false;
  }
  const total = readySeats.reduce((sum, seat) => sum + seat.baseBet, 0);
  return total <= game.bankroll;
};

export const ControlsBar: React.FC<ControlsBarProps> = ({ game, onDeal, onFinishInsurance, onNextRound, onPlayDealer }) => {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-emerald-700 bg-emerald-950/40 p-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={onDeal} disabled={game.phase !== "betting" || !hasReadySeat(game)}>
          Deal
        </Button>
        <Button
          variant="outline"
          onClick={onFinishInsurance}
          disabled={game.phase !== "insurance"}
        >
          Finish Insurance
        </Button>
        <Button
          variant="outline"
          onClick={onPlayDealer}
          disabled={game.phase !== "dealerPlay"}
        >
          Play Dealer
        </Button>
        <Button variant="outline" onClick={onNextRound} disabled={game.phase !== "settlement"}>
          Next Round
        </Button>
      </div>
      <div className="text-xs text-emerald-200">
        <p className="font-semibold">Messages</p>
        <ul className="mt-1 space-y-1">
          {game.messageLog.map((message, index) => (
            <li key={`${message}-${index}`} className="rounded bg-emerald-900/40 px-2 py-1">
              {message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
