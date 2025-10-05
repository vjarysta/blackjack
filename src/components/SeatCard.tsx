import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { formatCurrency } from "../utils/currency";
import { getHandTotals, isBust } from "../engine/totals";
import { canDouble, canHit, canSplit, canSurrender } from "../engine/rules";
import { type GameState, type Hand, type Seat } from "../engine/types";

interface SeatCardProps {
  seat: Seat;
  game: GameState;
  onSit: (seatIndex: number) => void;
  onLeave: (seatIndex: number) => void;
  onBetChange: (seatIndex: number, amount: number) => void;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
  onSurrender: () => void;
  onInsurance: (hand: Hand, amount: number) => void;
  isActiveSeat: boolean;
}

function renderCard(card: { rank: string; suit: string }): string {
  return `${card.rank}${card.suit}`;
}

function HandBadge({ label }: { label: string }): JSX.Element {
  return <span className="rounded bg-secondary px-2 py-1 text-xs font-semibold">{label}</span>;
}

export function SeatCard({
  seat,
  game,
  onSit,
  onLeave,
  onBetChange,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onSurrender,
  onInsurance,
  isActiveSeat
}: SeatCardProps): JSX.Element {
  const [betInput, setBetInput] = useState(seat.baseBet ? seat.baseBet.toString() : "");
  const [insuranceValues, setInsuranceValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setBetInput(seat.baseBet ? seat.baseBet.toString() : "");
  }, [seat.baseBet]);

  useEffect(() => {
    if (game.phase === "betting") {
      setInsuranceValues({});
    }
  }, [game.phase]);

  const activeHandId = isActiveSeat ? game.activeHandId : null;
  const bettingControls = seat.occupied && game.phase === "betting";

  const handViews = useMemo(() => {
    return seat.hands.map((hand, index) => {
      const totals = getHandTotals(hand);
      const totalLabel = totals.soft && totals.soft <= 21 ? `${totals.soft} / ${totals.hard}` : `${totals.hard}`;
      const isActiveHand = isActiveSeat && activeHandId === hand.id;
      const canShowActions = isActiveHand && game.phase === "playerActions";
      const splitAllowed = canShowActions && canSplit(hand, seat, game.rules);
      const doubleAllowed = canShowActions && canDouble(hand, game.rules);
      const hitAllowed = canShowActions && canHit(hand);
      const surrenderAllowed = canShowActions && canSurrender(hand, game.rules);
      const handBust = isBust(hand);
      const labels: string[] = [];
      if (hand.isBlackjack) labels.push("Blackjack");
      if (hand.isDoubled) labels.push("Doubled");
      if (hand.isSurrendered) labels.push("Surrendered");
      if (handBust) labels.push("Bust");
      return (
        <div
          key={hand.id}
          className={`space-y-2 rounded border px-3 py-2 ${isActiveHand ? "border-primary" : "border-border"}`}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Hand #{index + 1}</div>
            <div className="text-sm">Bet: {formatCurrency(hand.bet, game.rules.currency)}</div>
          </div>
          <div className="text-lg">{hand.cards.map(renderCard).join(" ")}</div>
          <div className="text-sm text-muted-foreground">Total: {totalLabel}</div>
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => (
              <HandBadge key={label} label={label} />
            ))}
          </div>
          {canShowActions ? (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" onClick={onHit} disabled={!hitAllowed}>
                Hit
              </Button>
              <Button size="sm" variant="secondary" onClick={onStand}>
                Stand
              </Button>
              <Button size="sm" onClick={onDouble} disabled={!doubleAllowed}>
                Double
              </Button>
              <Button size="sm" onClick={onSplit} disabled={!splitAllowed}>
                Split
              </Button>
              <Button size="sm" onClick={onSurrender} disabled={!surrenderAllowed}>
                Surrender
              </Button>
            </div>
          ) : null}
          {game.phase === "insurance" && game.dealer.upcard?.rank === "A" ? (
            <div className="space-y-2 border-t pt-2">
              <Label htmlFor={`insurance-${hand.id}`}>
                Insurance (max {formatCurrency(hand.bet / 2, game.rules.currency)})
              </Label>
              <div className="flex gap-2">
                <Input
                  id={`insurance-${hand.id}`}
                  type="number"
                  min={0}
                  step={0.5}
                  value={insuranceValues[hand.id] ?? ""}
                  disabled={hand.insuranceBet !== undefined}
                  onChange={(event) => {
                    setInsuranceValues((prev) => ({ ...prev, [hand.id]: event.target.value }));
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    const raw = insuranceValues[hand.id] ?? "0";
                    const amount = Number(raw);
                    onInsurance(hand, Number.isNaN(amount) ? 0 : amount);
                  }}
                  disabled={hand.insuranceBet !== undefined}
                >
                  Take
                </Button>
              </div>
              {hand.insuranceBet !== undefined ? (
                <div className="text-xs text-muted-foreground">
                  Insurance placed: {formatCurrency(hand.insuranceBet, game.rules.currency)}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      );
    });
  }, [
    seat,
    game.rules,
    game.phase,
    game.dealer.upcard?.rank,
    insuranceValues,
    isActiveSeat,
    activeHandId,
    onHit,
    onStand,
    onDouble,
    onSplit,
    onSurrender,
    onInsurance
  ]);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Seat {seat.index + 1}</CardTitle>
          {seat.occupied && game.phase === "betting" ? (
            <Button variant="ghost" size="sm" onClick={() => onLeave(seat.index)}>
              Leave
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!seat.occupied ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Empty seat</p>
            {game.phase === "betting" ? (
              <Button onClick={() => onSit(seat.index)}>Sit here</Button>
            ) : (
              <p className="text-xs text-muted-foreground">Seats locked during round</p>
            )}
          </div>
        ) : null}
        {bettingControls ? (
          <div className="space-y-2">
            <Label htmlFor={`bet-${seat.index}`}>Bet amount</Label>
            <Input
              id={`bet-${seat.index}`}
              type="number"
              min={game.rules.minBet}
              step={1}
              value={betInput}
              onChange={(event) => setBetInput(event.target.value)}
              onBlur={() => {
                const parsed = Number(betInput);
                onBetChange(seat.index, Number.isNaN(parsed) ? 0 : parsed);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Min {formatCurrency(game.rules.minBet, game.rules.currency)}
            </p>
          </div>
        ) : null}
        {seat.hands.length > 0 ? <div className="space-y-3">{handViews}</div> : null}
      </CardContent>
    </Card>
  );
}
