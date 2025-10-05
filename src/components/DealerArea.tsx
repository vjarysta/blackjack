import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useGameStore } from "../store/useGameStore";
import { getHandTotals, isBust } from "../engine/totals";

function renderCards(hidden: boolean, cards: string[]): string {
  if (!hidden) {
    return cards.join(" ");
  }
  if (cards.length === 0) {
    return "";
  }
  return `${cards[0]} [hidden]`;
}

export const DealerArea: React.FC = () => {
  const { game } = useGameStore();
  const dealerCards = game.dealer.hand.cards.map((card) => `${card.rank}${card.suit}`);
  const shouldHideHole = game.phase === "playerActions" || game.phase === "insurance";
  const totals = getHandTotals(game.dealer.hand);
  const totalText = isBust(game.dealer.hand)
    ? "Bust"
    : totals.soft && totals.soft !== totals.hard
    ? `${totals.soft} (soft)`
    : `${totals.hard}`;

  return (
    <Card className="bg-slate-900/70">
      <CardHeader>
        <CardTitle className="text-base">Dealer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="text-lg font-semibold">
          {renderCards(shouldHideHole, dealerCards)}
        </div>
        {!shouldHideHole && <div className="text-xs text-slate-400">Total: {totalText}</div>}
        {game.phase === "insurance" && game.dealer.upcard?.rank === "A" && (
          <div className="text-xs text-amber-300">Insurance offered</div>
        )}
        {game.phase === "dealerPlay" && <div className="text-xs text-slate-300">Dealer drawing…</div>}
        {game.phase === "settlement" && <div className="text-xs text-slate-400">Round complete</div>}
      </CardContent>
    </Card>
  );
};
