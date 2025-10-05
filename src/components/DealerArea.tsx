import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { getHandTotals } from "../engine/totals";
import { type GameState } from "../engine/types";

interface DealerAreaProps {
  game: GameState;
}

export function DealerArea({ game }: DealerAreaProps): JSX.Element {
  const showHole = game.phase === "dealerPlay" || game.phase === "settlement";
  const cards = game.dealer.hand.cards;
  const renderedCards = cards
    .map((card, index) => {
      if (index === 1 && !showHole && game.phase !== "settlement" && game.phase !== "dealerPlay") {
        return "🂠";
      }
      return `${card.rank}${card.suit}`;
    })
    .join(" ");
  const totals = showHole ? getHandTotals(game.dealer.hand) : undefined;
  const totalLabel = totals
    ? totals.soft && totals.soft <= 21
      ? `${totals.soft} / ${totals.hard}`
      : `${totals.hard}`
    : "--";

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Dealer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-lg">{renderedCards || "Waiting"}</div>
        <div className="text-sm text-muted-foreground">Total: {totalLabel}</div>
        {game.dealer.hand.isBlackjack && (
          <div className="text-sm font-semibold text-primary">Blackjack</div>
        )}
        {game.pendingReshuffle ? (
          <div className="text-xs text-muted-foreground">
            Cut card reached — shoe will be reshuffled next round.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
