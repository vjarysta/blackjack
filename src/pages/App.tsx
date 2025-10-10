import React from "react";
import { useGameStore } from "../store/useGameStore";
import { isSingleSeatMode, PRIMARY_SEAT_INDEX } from "../ui/config";
import { NoirJackTable } from "../components/noirjack/NoirJackTable";
import { audioService } from "../services/AudioService";
import { noirSoundProfile } from "../services/soundProfiles";

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

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const options: AddEventListenerOptions = { capture: true };
    const handlePointerDown = (): void => {
      audioService.init();
      window.removeEventListener("pointerdown", handlePointerDown, options);
    };
    window.addEventListener("pointerdown", handlePointerDown, options);
    return () => window.removeEventListener("pointerdown", handlePointerDown, options);
  }, []);

  React.useEffect(() => {
    audioService.useProfile(noirSoundProfile);
  }, []);

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

  const actions = {
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

  React.useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.body.classList.add("skin-noirjack");
    return () => {
      document.body.classList.remove("skin-noirjack");
    };
  }, []);

  return (
    <NoirJackTable
      game={game}
      coachMode={coachMode}
      actions={actions}
      onCoachModeChange={setCoachMode}
      error={error}
      onDismissError={clearError}
    />
  );
};
