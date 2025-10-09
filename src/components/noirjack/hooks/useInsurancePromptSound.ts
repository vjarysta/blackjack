import * as React from "react";
import type { GameState } from "../../../engine/types";
import type { AudioService } from "../../../services/AudioService";
import { deriveInsuranceOffer, selectPrimarySeat } from "../selectors";
import { usePrevious } from "./usePrevious";

interface InsurancePromptState {
  handId: string | null;
  amount: number;
  open: boolean;
}

export function useInsurancePromptSound(
  game: GameState,
  audio: AudioService
): InsurancePromptState {
  const seat = React.useMemo(() => selectPrimarySeat(game), [game]);
  const offer = React.useMemo(
    () => deriveInsuranceOffer(game, seat),
    [game, seat]
  );
  const open = Boolean(offer.handId && game.awaitingInsuranceResolution);
  const wasOpen = usePrevious(open);

  React.useEffect(() => {
    if (open && !wasOpen) {
      audio.play("insurancePrompt");
    }
  }, [audio, open, wasOpen]);

  return { handId: offer.handId, amount: offer.amount, open };
}
