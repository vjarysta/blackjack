import React from "react";
import { SeatCard } from "./SeatCard";
import { DealerArea } from "./DealerArea";
import { ControlsBar } from "./ControlsBar";
import { RuleBadges } from "./RuleBadges";
import type { GameState } from "../engine/types";
import { formatCurrency } from "../utils/currency";

interface TableProps {
  game: GameState;
  actions: {
    sit: (seatIndex: number) => void;
    leave: (seatIndex: number) => void;
    setBet: (seatIndex: number, amount: number) => void;
    deal: () => void;
    playerHit: () => void;
    playerStand: () => void;
    playerDouble: () => void;
    playerSplit: () => void;
    playerSurrender: () => void;
    takeInsurance: (seatIndex: number, handId: string, amount: number) => void;
    declineInsurance: (seatIndex: number, handId: string) => void;
    finishInsurance: () => void;
    playDealer: () => void;
    nextRound: () => void;
  };
}

const penetrationPercentage = (game: GameState): string => {
  const totalCards = game.shoe.cards.length + game.shoe.discard.length;
  if (totalCards === 0) {
    return "0%";
  }
  const penetration = game.shoe.discard.length / totalCards;
  return `${Math.round(penetration * 100)}%`;
};

export const Table: React.FC<TableProps> = ({ game, actions }) => {
  const seats = game.seats;
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-emerald-700 bg-emerald-950/40 p-4">
        <div>
          <h1 className="text-2xl font-bold">Blackjack</h1>
          <p className="text-sm text-emerald-200">Bankroll: {formatCurrency(game.bankroll)}</p>
        </div>
        <div className="text-sm text-emerald-200">
          <p>Cards remaining: {game.shoe.cards.length}</p>
          <p>Discard pile: {game.shoe.discard.length}</p>
          <p>Penetration: {penetrationPercentage(game)}</p>
        </div>
        <div className="text-sm text-emerald-200">
          <p>Round: {game.roundCount}</p>
          <p>Phase: {game.phase}</p>
        </div>
        <RuleBadges rules={game.rules} />
      </header>

      <DealerArea game={game} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {seats.map((seat) => (
          <SeatCard
            key={seat.index}
            seat={seat}
            game={game}
            onSit={actions.sit}
            onLeave={actions.leave}
            onBetChange={actions.setBet}
            onHit={actions.playerHit}
            onStand={actions.playerStand}
            onDouble={actions.playerDouble}
            onSplit={actions.playerSplit}
            onSurrender={actions.playerSurrender}
            onInsurance={actions.takeInsurance}
            onDeclineInsurance={actions.declineInsurance}
          />
        ))}
      </div>

      <ControlsBar
        game={game}
        onDeal={actions.deal}
        onFinishInsurance={actions.finishInsurance}
        onNextRound={actions.nextRound}
        onPlayDealer={actions.playDealer}
      />
    </div>
  );
};
