import React from "react";
import { Table } from "../components/Table";
import { useGameStore } from "../store/useGameStore";
import { Button } from "../components/ui/button";

export const App: React.FC = () => {
  const {
    game,
    error,
    clearError,
    sit,
    leave,
    addChip,
    removeChipValue,
    removeTopChip,
    deal,
    playerHit,
    playerStand,
    playerDouble,
    playerSplit,
    playerSurrender,
    takeInsurance,
    declineInsurance,
    finishInsurance,
    playDealer,
    nextRound
  } = useGameStore();

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 p-6 text-emerald-50">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col gap-4">
        {error && (
          <div className="flex items-center justify-between rounded-md border border-rose-600 bg-rose-900/60 px-4 py-2 text-sm">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        )}
        <Table
            game={game}
          actions={{
            sit,
            leave,
            addChip,
            removeChipValue,
            removeTopChip,
            deal,
            playerHit,
            playerStand,
            playerDouble,
            playerSplit,
            playerSurrender,
            takeInsurance,
            declineInsurance,
            finishInsurance,
            playDealer,
            nextRound
          }}
        />
      </div>
    </main>
  );
};
