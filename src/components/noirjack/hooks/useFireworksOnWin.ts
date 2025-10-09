import * as React from "react";
import type { GameState } from "../../../engine/types";
import type { AudioService } from "../../../services/AudioService";
import { summarizeSettlement } from "../selectors";
import { usePrevious } from "./usePrevious";

const CELEBRATION_SOUND_COOLDOWN_MS = 320;

interface FireworksApi {
  start(duration: number): void;
  stop(): void;
  enabled: boolean;
  prefersReduced: boolean;
}

interface UseFireworksOnWinArgs extends FireworksApi {
  audio: AudioService;
}

const now = (): number =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

export function useFireworksOnWin(
  game: GameState,
  { start, stop, enabled, prefersReduced, audio }: UseFireworksOnWinArgs
): void {
  const prevPhase = usePrevious(game.phase);
  const lastPlayedRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (game.phase === "settlement" && prevPhase !== "settlement") {
      const summary = summarizeSettlement(game);
      if (!summary) {
        return;
      }
      if (enabled && (summary.kind === "win" || summary.kind === "blackjack")) {
        const duration = prefersReduced
          ? summary.kind === "blackjack"
            ? 2600
            : 2200
          : summary.kind === "blackjack"
          ? 3800
          : 3200;
        start(duration);
        const timestamp = now();
        if (timestamp - lastPlayedRef.current >= CELEBRATION_SOUND_COOLDOWN_MS) {
          lastPlayedRef.current = timestamp;
          audio.play("celebration");
        }
      }
    }
  }, [audio, enabled, game, prefersReduced, prevPhase, start]);

  React.useEffect(() => {
    if (game.phase !== "settlement" && prevPhase === "settlement") {
      stop();
    }
  }, [game.phase, prevPhase, stop]);
}
