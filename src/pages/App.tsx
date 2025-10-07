import React from "react";
import { Table } from "../components/Table";
import { useGameStore } from "../store/useGameStore";
import { Button } from "../components/ui/button";
import { isSingleSeatMode, PRIMARY_SEAT_INDEX } from "../ui/config";
import { useInterfaceMode } from "../ui/interfaceMode";
import { InterfaceModeToggle } from "../ui/InterfaceModeToggle";
import { MobileTable } from "../mobile/MobileTable";

export const App: React.FC = () => {
  const {
    game,
    error,
    clearError,
    coachMode,
    setCoachMode,
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
  const [interfaceMode, setInterfaceMode] = useInterfaceMode();

  React.useEffect(() => {
    if (!isSingleSeatMode) {
      return;
    }
    game.seats.forEach((seat) => {
      if (seat.index !== PRIMARY_SEAT_INDEX && (seat.occupied || seat.baseBet > 0 || (seat.chips?.length ?? 0) > 0)) {
        leave(seat.index);
      }
    });
    const primarySeat = game.seats[PRIMARY_SEAT_INDEX];
    if (primarySeat && !primarySeat.occupied) {
      sit(PRIMARY_SEAT_INDEX);
    }
  }, [game.seats, leave, sit]);

  const actionBundle = {
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
  };

  const classicView = (
    <Table
      game={game}
      coachMode={coachMode}
      actions={actionBundle}
      onCoachModeChange={setCoachMode}
    />
  );

  const mobileView = (
    <MobileTable
      game={game}
      coachMode={coachMode}
      actions={actionBundle}
      onCoachModeChange={setCoachMode}
    />
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 p-4 text-emerald-50 sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1400px] flex-col gap-4">
        <div className="flex justify-end">
          <InterfaceModeToggle mode={interfaceMode} onChange={setInterfaceMode} />
        </div>
        {error && (
          <div className="flex items-center justify-between rounded-md border border-rose-600 bg-rose-900/60 px-4 py-2 text-sm">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        )}
        {interfaceMode === "mobile" ? mobileView : classicView}
      </div>
    </main>
  );
};
