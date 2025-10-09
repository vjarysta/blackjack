import * as React from "react";
import type { GameState } from "../../../engine/types";
import type { AudioService } from "../../../services/AudioService";
import { calculateTotalCardCount } from "../selectors";
import { usePrevious } from "./usePrevious";

export function useDealSoundOnNewCard(
  game: GameState,
  audio: AudioService
): void {
  const totalCardCount = React.useMemo(
    () => calculateTotalCardCount(game),
    [game]
  );
  const previousCount = usePrevious(totalCardCount);

  React.useEffect(() => {
    if (typeof previousCount === "number" && totalCardCount > previousCount) {
      audio.play("deal");
    }
  }, [audio, previousCount, totalCardCount]);
}
