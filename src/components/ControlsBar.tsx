import { Button } from "./ui/button";
import { type GameState } from "../engine/types";

interface ControlsBarProps {
  game: GameState;
  onDeal: () => void;
  onSkipInsurance: () => void;
  onContinueInsurance: () => void;
  onPlayDealer: () => void;
  onSettle: () => void;
}

export function ControlsBar({
  game,
  onDeal,
  onSkipInsurance,
  onContinueInsurance,
  onPlayDealer,
  onSettle
}: ControlsBarProps): JSX.Element {
  const hasValidBet = game.seats.some((seat) => seat.occupied && seat.baseBet >= game.rules.minBet);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <Button onClick={onDeal} disabled={game.phase !== "betting" || !hasValidBet}>
          Deal
        </Button>
        {game.phase === "insurance" ? (
          <>
            <Button variant="secondary" onClick={onSkipInsurance}>
              Skip Insurance
            </Button>
            <Button onClick={onContinueInsurance}>Continue</Button>
          </>
        ) : null}
        {game.phase === "dealerPlay" ? (
          <Button onClick={onPlayDealer}>Play Dealer</Button>
        ) : null}
        {game.phase === "settlement" ? (
          <Button onClick={onSettle}>Next Round</Button>
        ) : null}
      </div>
      <div className="text-sm text-muted-foreground">
        Round {game.roundCount} • Phase: {game.phase}
      </div>
    </div>
  );
}
