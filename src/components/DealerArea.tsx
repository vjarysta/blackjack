import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { GameState } from "../engine/types";
import { getHandTotals, isBust } from "../engine/totals";

const formatCard = (rank: string, suit: string): string => `${rank}${suit}`;

interface DealerAreaProps {
  game: GameState;
}

export const DealerArea: React.FC<DealerAreaProps> = ({ game }) => {
  const revealHole = game.phase === "dealerPlay" || game.phase === "settlement" || game.dealer.hand.isBlackjack;
  const cards = game.dealer.hand.cards.map((card, index) => {
    if (index === 1 && !revealHole) {
      return "🂠";
    }
    return formatCard(card.rank, card.suit);
  });
  const totals = getHandTotals(game.dealer.hand);

  return (
    <Card className="border-emerald-600/80 bg-emerald-950/60">
      <CardHeader>
        <CardTitle className="text-xl">Dealer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-lg">{cards.join(" ") || "Waiting"}</div>
        <div className="mt-2 text-sm text-emerald-200">
          {revealHole ? (
            <span>
              Total: {totals.soft && totals.soft !== totals.hard ? `${totals.hard} / ${totals.soft}` : totals.hard}
            </span>
          ) : (
            <span>Hole card hidden</span>
          )}
        </div>
        {game.dealer.hand.isBlackjack && <p className="mt-2 text-emerald-300">Dealer blackjack</p>}
        {isBust(game.dealer.hand) && revealHole && <p className="mt-2 text-rose-300">Dealer busts</p>}
      </CardContent>
    </Card>
  );
};
