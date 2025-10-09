import * as React from "react";
import type { GameState } from "../../../engine/types";
import type { AudioService } from "../../../services/AudioService";
import { usePrevious } from "./usePrevious";

export function useFlipSoundOnHoleReveal(
  game: GameState,
  audio: AudioService
): void {
  const previousHoleCard = usePrevious(game.dealer.holeCard);

  React.useEffect(() => {
    if (previousHoleCard && !game.dealer.holeCard) {
      audio.play("flip");
    }
  }, [audio, game.dealer.holeCard, previousHoleCard]);
}
