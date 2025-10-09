import * as React from "react";
import type { GameState } from "../../../engine/types";
import { ResultToast } from "../ResultToast";
import { summarizeSettlement } from "../selectors";
import { usePrevious } from "./usePrevious";

export function useResultToastOnSettlement(game: GameState): void {
  const prevPhase = usePrevious(game.phase);

  React.useEffect(() => {
    if (game.phase === "settlement" && prevPhase !== "settlement") {
      const summary = summarizeSettlement(game);
      if (summary) {
        ResultToast.show(summary.kind, summary.amount, summary.details);
      }
    }
  }, [game, prevPhase]);
}
