import React from "react";
import { Button } from "./ui/button";
import { useGameStore } from "../store/useGameStore";
import { formatCurrency } from "../utils/currency";

export const ControlsBar: React.FC = () => {
  const { game, deal, skipInsurance, nextRound } = useGameStore();
  const hasBet = game.seats.some((seat) => seat.occupied && seat.baseBet >= game.rules.minBet);
  const dealDisabled = !hasBet || game.phase !== "betting";
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-sm">
      <div className="flex flex-col gap-1">
        <div>
          Bankroll: <span className="font-semibold">{formatCurrency(game.bankroll, game.rules.currency)}</span>
        </div>
        <div className="text-xs text-slate-400">
          Shoe remaining: {game.shoe.cards.length} cards · Discard: {game.shoe.discard.length}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={deal} disabled={dealDisabled}>
          Deal
        </Button>
        {game.phase === "insurance" && (
          <Button variant="outline" onClick={skipInsurance}>
            Continue
          </Button>
        )}
        {game.phase === "settlement" && (
          <Button variant="outline" onClick={nextRound}>
            Next round
          </Button>
        )}
      </div>
    </div>
  );
};
