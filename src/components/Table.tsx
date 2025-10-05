import React from "react";
import type { GameState } from "../engine/types";
import { formatCurrency } from "../utils/currency";
import { RuleBadges } from "./RuleBadges";
import { TableLayout } from "./table/TableLayout";
import { ChipTray } from "./table/ChipTray";
import type { ChipDenomination } from "../theme/palette";
import { Button } from "./ui/button";

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

const hasReadySeat = (game: GameState): boolean => {
  const readySeats = game.seats.filter((seat) => seat.occupied && seat.baseBet >= game.rules.minBet);
  if (readySeats.length === 0) {
    return false;
  }
  const total = readySeats.reduce((sum, seat) => sum + seat.baseBet, 0);
  return total <= game.bankroll;
};

export const Table: React.FC<TableProps> = ({ game, actions }) => {
  const [activeChip, setActiveChip] = React.useState<ChipDenomination>(25);

  const handleSelectChip = (value: ChipDenomination) => {
    setActiveChip(value);
  };

  const totalPendingBets = game.seats.reduce((sum, seat) => sum + seat.baseBet, 0);

  return (
    <div className="flex flex-col gap-6 text-emerald-50">
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

      <TableLayout
        game={game}
        activeChip={activeChip}
        onSetBet={actions.setBet}
        onSit={actions.sit}
        onLeave={actions.leave}
        onInsurance={actions.takeInsurance}
        onDeclineInsurance={actions.declineInsurance}
        onHit={actions.playerHit}
        onStand={actions.playerStand}
        onDouble={actions.playerDouble}
        onSplit={actions.playerSplit}
        onSurrender={actions.playerSurrender}
      />

      <div className="flex justify-center">
        <ChipTray activeChip={activeChip} onSelect={handleSelectChip} disabled={game.phase !== "betting"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border border-[#c8a24a]/30 bg-[#0b2d22]/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">Round Controls</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={actions.deal} disabled={game.phase !== "betting" || !hasReadySeat(game)}>
              Deal
            </Button>
            <Button variant="outline" onClick={actions.finishInsurance} disabled={game.phase !== "insurance"}>
              Finish Insurance
            </Button>
            <Button variant="outline" onClick={actions.playDealer} disabled={game.phase !== "dealerPlay"}>
              Play Dealer
            </Button>
            <Button variant="outline" onClick={actions.nextRound} disabled={game.phase !== "settlement"}>
              Next Round
            </Button>
          </div>
          <p className="mt-4 text-xs text-emerald-200">
            Minimum bet {formatCurrency(game.rules.minBet)} · Maximum bet {formatCurrency(game.rules.maxBet)}
          </p>
        </div>
        <div className="rounded-3xl border border-[#c8a24a]/30 bg-[#0b2d22]/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">Messages</h2>
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-2 text-sm text-emerald-100">
            {game.messageLog.length === 0 && <p className="text-emerald-300/70">Table is quiet.</p>}
            {game.messageLog.map((message, index) => (
              <div key={`${message}-${index}`} className="rounded-lg bg-[#11382b]/70 px-3 py-2">
                {message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
