import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { formatCurrency } from "../utils/currency";
import { getHandTotals, isBust } from "../engine/totals";
import type { GameState, Hand, Seat } from "../engine/types";
import { canDouble, canHit, canSplit, canSurrender } from "../engine/rules";
import { BetControl } from "./bet/BetControl";

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
  onInsurance: (seatIndex: number, handId: string, amount: number) => void;
  onDeclineInsurance: (seatIndex: number, handId: string) => void;
}

const renderCards = (hand: Hand): string => hand.cards.map((card) => `${card.rank}${card.suit}`).join(" ");

const HandTotalsView = ({ hand }: { hand: Hand }) => {
  const totals = getHandTotals(hand);
  if (totals.soft && totals.soft !== totals.hard) {
    return (
      <span>
        {totals.hard} / {totals.soft}
      </span>
    );
  }
  return <span>{totals.hard}</span>;
};

const InsuranceControls: React.FC<{
  seatIndex: number;
  hand: Hand;
  maxInsurance: number;
  bankroll: number;
  onInsurance: (seatIndex: number, handId: string, amount: number) => void;
  onDecline: (seatIndex: number, handId: string) => void;
}> = ({ seatIndex, hand, maxInsurance, bankroll, onInsurance, onDecline }) => {
  const [insuranceAmount, setInsuranceAmount] = React.useState(maxInsurance);
  React.useEffect(() => {
    setInsuranceAmount(maxInsurance);
  }, [maxInsurance]);

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          max={maxInsurance}
          step={1}
          value={insuranceAmount}
          onChange={(event) => setInsuranceAmount(Number(event.target.value))}
        />
        <span className="text-xs text-emerald-200">Max {formatCurrency(maxInsurance)}</span>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onInsurance(seatIndex, hand.id, Math.min(maxInsurance, Math.max(0, insuranceAmount)))}
          disabled={insuranceAmount > maxInsurance || insuranceAmount < 0 || insuranceAmount > bankroll}
        >
          Take Insurance
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDecline(seatIndex, hand.id)}>
          Skip
        </Button>
      </div>
    </div>
  );
};

export const SeatCard: React.FC<SeatCardProps> = ({
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
  onDeclineInsurance
}) => {
  const isBettingPhase = game.phase === "betting";
  const isInsurancePhase = game.phase === "insurance";
  const isActiveSeat = game.activeSeatIndex === seat.index;

  const renderHandControls = (hand: Hand) => {
    const isActiveHand = isActiveSeat && game.activeHandId === hand.id && game.phase === "playerActions";
    if (!isActiveHand) {
      return null;
    }
    const legal = {
      hit: canHit(hand),
      stand: !hand.isResolved,
      double: canDouble(hand, game.rules) && game.bankroll >= hand.bet,
      split: canSplit(hand, seat, game.rules) && game.bankroll >= hand.bet,
      surrender: canSurrender(hand, game.rules)
    };
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={onHit} disabled={!legal.hit}>
          Hit
        </Button>
        <Button size="sm" variant="outline" onClick={onStand} disabled={!legal.stand}>
          Stand
        </Button>
        <Button size="sm" variant="outline" onClick={onDouble} disabled={!legal.double}>
          Double
        </Button>
        <Button size="sm" variant="outline" onClick={onSplit} disabled={!legal.split}>
          Split
        </Button>
        <Button size="sm" variant="outline" onClick={onSurrender} disabled={!legal.surrender}>
          Surrender
        </Button>
      </div>
    );
  };

  const renderInsurance = (hand: Hand) => {
    if (!isInsurancePhase || hand.isResolved || hand.insuranceBet !== undefined) {
      if (hand.insuranceBet && hand.insuranceBet > 0) {
        return <p className="text-sm text-emerald-200">Insurance: {formatCurrency(hand.insuranceBet)}</p>;
      }
      if (hand.insuranceBet === 0) {
        return <p className="text-sm text-emerald-300">Insurance declined</p>;
      }
      return null;
    }
    const maxInsurance = hand.bet / 2;
    return (
      <InsuranceControls
        seatIndex={seat.index}
        hand={hand}
        maxInsurance={maxInsurance}
        bankroll={game.bankroll}
        onInsurance={onInsurance}
        onDecline={onDeclineInsurance}
      />
    );
  };

  const renderHand = (hand: Hand) => (
    <div key={hand.id} className="mt-3 rounded border border-emerald-700/50 bg-emerald-900/40 p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">Hand</span>
        <span>
          Total: <HandTotalsView hand={hand} />
        </span>
      </div>
      <div className="mt-2 text-lg">{renderCards(hand)}</div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-emerald-200">
        {hand.isBlackjack && <span className="rounded bg-emerald-500/20 px-2 py-0.5">Blackjack</span>}
        {hand.isDoubled && <span className="rounded bg-amber-500/20 px-2 py-0.5">Doubled</span>}
        {hand.isSurrendered && <span className="rounded bg-rose-500/20 px-2 py-0.5">Surrendered</span>}
        {isBust(hand) && <span className="rounded bg-rose-500/20 px-2 py-0.5">Bust</span>}
        {hand.isSplitHand && <span className="rounded bg-emerald-500/20 px-2 py-0.5">Split</span>}
      </div>
      {renderInsurance(hand)}
      {renderHandControls(hand)}
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Seat {seat.index + 1}</CardTitle>
        {seat.occupied && (
          <Button size="sm" variant="ghost" onClick={() => onLeave(seat.index)}>
            Leave
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!seat.occupied && (
          <Button className="w-full" onClick={() => onSit(seat.index)}>
            Sit here
          </Button>
        )}
        {seat.occupied && isBettingPhase && (
          <BetControl
            amount={seat.baseBet}
            min={game.rules.minBet}
            max={game.rules.maxBet}
            bankroll={game.bankroll}
            disabled={game.phase !== "betting"}
            onChange={(value) => onBetChange(seat.index, value)}
          />
        )}
        {seat.occupied && !isBettingPhase && seat.hands.map((hand) => renderHand(hand))}
        {seat.occupied && isBettingPhase && seat.baseBet >= game.rules.minBet && (
          <p className="mt-3 text-sm text-emerald-100">Ready with bet {formatCurrency(seat.baseBet)}</p>
        )}
      </CardContent>
    </Card>
  );
};
