import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useGameStore } from "../store/useGameStore";
import { type Hand, type Seat } from "../engine/types";
import { allowedActions } from "../engine/rules";
import { getHandTotals, isBust } from "../engine/totals";
import { formatCurrency } from "../utils/currency";

interface SeatCardProps {
  seat: Seat;
}

function renderHandLabel(hand: Hand): string {
  return hand.cards.map((card) => `${card.rank}${card.suit}`).join(" ");
}

function getTotalsText(hand: Hand): string {
  const totals = getHandTotals(hand);
  if (isBust(hand)) {
    return "Bust";
  }
  if (totals.soft !== undefined && totals.soft !== totals.hard) {
    return `${totals.soft} (soft)`;
  }
  return `${totals.hard}`;
}

export const SeatCard: React.FC<SeatCardProps> = ({ seat }) => {
  const { game, sit, leave, setBet, takeInsurance, hit, stand, double, split, surrender } = useGameStore();
  const [betInput, setBetInput] = React.useState<number>(seat.baseBet || game.rules.minBet);
  const [insuranceInputs, setInsuranceInputs] = React.useState<Record<string, number>>({});
  const isBettingPhase = game.phase === "betting";
  const isInsurancePhase = game.phase === "insurance";
  const isPlayerPhase = game.phase === "playerActions";
  const isSettlement = game.phase === "settlement";
  const activeSeat = game.activeSeatIndex;
  const activeHandId = game.activeHandId;
  const bankroll = game.bankroll;

  React.useEffect(() => {
    setBetInput(seat.baseBet || game.rules.minBet);
  }, [seat.baseBet, game.rules.minBet]);

  React.useEffect(() => {
    setInsuranceInputs((prev) => {
      const next: Record<string, number> = {};
      seat.hands.forEach((hand) => {
        const defaultValue = Math.min(hand.bet / 2, bankroll);
        next[hand.id] = prev[hand.id] ?? defaultValue;
      });
      return next;
    });
  }, [seat.hands, bankroll]);

  const handleBetChange = (value: number) => {
    setBetInput(value);
    setBet(seat.index, value);
  };

  const renderControls = () => {
    if (!seat.occupied) {
      return (
        <Button variant="outline" onClick={() => sit(seat.index)}>
          Sit here
        </Button>
      );
    }

    if (isBettingPhase) {
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={`bet-${seat.index}`}>
            Bet amount
          </label>
          <input
            id={`bet-${seat.index}`}
            type="number"
            min={game.rules.minBet}
            step={1}
            value={betInput}
            max={Math.min(Math.floor(bankroll), game.rules.maxBet)}
            onChange={(event) => handleBetChange(Number(event.target.value))}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>Min: {formatCurrency(game.rules.minBet, game.rules.currency)}</span>
            <span>Bankroll: {formatCurrency(bankroll, game.rules.currency)}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => leave(seat.index)}>
            Leave seat
          </Button>
        </div>
      );
    }

    if (isInsurancePhase && game.dealer.upcard?.rank === "A") {
      return seat.hands.map((hand) => {
        const maxInsurance = Math.min(hand.bet / 2, bankroll);
        const currentValue = insuranceInputs[hand.id] ?? maxInsurance;
        const alreadyTaken = hand.insuranceBet !== undefined;
        return (
          <div key={hand.id} className="space-y-2 rounded-md border border-slate-700 p-2">
            <div className="text-xs uppercase tracking-wide text-slate-400">Insurance</div>
            {alreadyTaken ? (
              <div className="text-sm text-emerald-400">
                Taken: {formatCurrency(hand.insuranceBet ?? 0, game.rules.currency)}
              </div>
            ) : (
              <>
                <input
                  type="number"
                  min={0}
                  max={maxInsurance}
                  step={1}
                  value={currentValue}
                  onChange={(event) =>
                    setInsuranceInputs((prev) => ({ ...prev, [hand.id]: Number(event.target.value) }))
                  }
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                />
                <Button
                  size="sm"
                  onClick={() =>
                    takeInsurance(seat.index, hand.id, Math.min(currentValue, maxInsurance))
                  }
                  disabled={currentValue <= 0 || currentValue > bankroll || currentValue > maxInsurance}
                >
                  Confirm {formatCurrency(currentValue, game.rules.currency)}
                </Button>
              </>
            )}
          </div>
        );
      });
    }

    if (seat.hands.length === 0) {
      return <div className="text-sm text-slate-400">Waiting for next round…</div>;
    }

    return seat.hands.map((hand) => {
      const isActive = activeSeat === seat.index && activeHandId === hand.id;
      const actions = allowedActions(game, game.rules, hand);
      return (
        <div key={hand.id} className="space-y-2 rounded-md border border-slate-700 p-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
            <span>{isActive ? "Active" : "Hand"}</span>
            <span>{formatCurrency(hand.bet, game.rules.currency)}</span>
          </div>
          <div className="text-sm">
            <div>{renderHandLabel(hand)}</div>
            <div className="text-xs text-slate-400">Total: {getTotalsText(hand)}</div>
            {hand.isBlackjack && <div className="text-xs text-emerald-400">Blackjack!</div>}
            {hand.isDoubled && <div className="text-xs text-amber-400">Doubled</div>}
            {hand.isSurrendered && <div className="text-xs text-slate-300">Surrendered</div>}
            {isBust(hand) && <div className="text-xs text-rose-400">Bust</div>}
          </div>
          {isActive && isPlayerPhase && !hand.isSurrendered && !isBust(hand) && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={hit} disabled={!actions.hit}>
                Hit
              </Button>
              <Button size="sm" variant="outline" onClick={stand} disabled={!actions.stand}>
                Stand
              </Button>
              <Button size="sm" variant="outline" onClick={double} disabled={!actions.double}>
                Double
              </Button>
              <Button size="sm" variant="outline" onClick={split} disabled={!actions.split}>
                Split
              </Button>
              <Button size="sm" variant="outline" onClick={surrender} disabled={!actions.surrender}>
                Surrender
              </Button>
            </div>
          )}
          {isSettlement && (
            <div className="text-xs text-slate-400">Resolved.</div>
          )}
        </div>
      );
    });
  };

  return (
    <Card className="bg-slate-900/70">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Seat {seat.index + 1}</span>
          {seat.occupied ? (
            <span className="text-xs text-slate-400">
              Bet {formatCurrency(seat.baseBet, game.rules.currency)}
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">{renderControls()}</CardContent>
    </Card>
  );
};
