import React from "react";
import type { GameState } from "../engine/types";
import { formatCurrency } from "../utils/currency";
import { RuleBadges } from "./RuleBadges";
import { TableLayout } from "./table/TableLayout";
import type { ChipDenomination } from "../theme/palette";

interface TableProps {
  game: GameState;
  actions: {
    sit: (seatIndex: number) => void;
    leave: (seatIndex: number) => void;
    setBet: (seatIndex: number, amount: number) => void;
    addChip: (seatIndex: number, value: number) => void;
    removeChipValue: (seatIndex: number, value: number) => void;
    removeTopChip: (seatIndex: number) => void;
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
  const [activeChip, setActiveChip] = React.useState<ChipDenomination>(25);

  const handleSelectChip = (value: ChipDenomination) => {
    setActiveChip(value);
  };

  const totalPendingBets = game.seats.reduce((sum, seat) => sum + seat.baseBet, 0);

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-6 text-emerald-50">
      <header className="rounded-3xl border border-[#c8a24a]/40 bg-[#0c2c22]/80 px-6 py-5 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-emerald-200">Casino Table</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-widest text-emerald-50">Blackjack</h1>
            <p className="mt-3 text-sm text-emerald-200">
              Bankroll <span className="font-semibold text-emerald-50">{formatCurrency(game.bankroll)}</span>
            </p>
            <p className="text-sm text-emerald-200">Pending bets {formatCurrency(totalPendingBets)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-emerald-100 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Round</p>
              <p className="mt-1 text-lg font-semibold text-emerald-50">{game.roundCount}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Phase</p>
              <p className="mt-1 text-lg font-semibold text-emerald-50">{game.phase}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Cards</p>
              <p className="mt-1 text-lg font-semibold text-emerald-50">{game.shoe.cards.length}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Discard</p>
              <p className="mt-1 text-lg font-semibold text-emerald-50">{game.shoe.discard.length}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Penetration</p>
              <p className="mt-1 text-lg font-semibold text-emerald-50">{penetrationPercentage(game)}</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <RuleBadges rules={game.rules} />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <TableLayout
          game={game}
          activeChip={activeChip}
          onSelectChip={handleSelectChip}
          onSit={actions.sit}
          onLeave={actions.leave}
          onAddChip={actions.addChip}
          onRemoveChipValue={actions.removeChipValue}
          onRemoveTopChip={actions.removeTopChip}
          onInsurance={actions.takeInsurance}
          onDeclineInsurance={actions.declineInsurance}
          onDeal={actions.deal}
          onFinishInsurance={actions.finishInsurance}
          onPlayDealer={actions.playDealer}
          onNextRound={actions.nextRound}
          onHit={actions.playerHit}
          onStand={actions.playerStand}
          onDouble={actions.playerDouble}
          onSplit={actions.playerSplit}
          onSurrender={actions.playerSurrender}
        />
      </div>
    </div>
  );
};
