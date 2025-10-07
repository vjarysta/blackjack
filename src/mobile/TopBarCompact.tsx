import React from "react";
import type { GameState } from "../engine/types";
import { formatCurrency } from "../utils/currency";
import { CoachToggle } from "../components/CoachToggle";
import type { CoachMode } from "../store/useGameStore";

interface TopBarCompactProps {
  game: GameState;
  coachMode: CoachMode;
  onCoachModeChange: (mode: CoachMode) => void;
  rightSlot?: React.ReactNode;
}

const buildRuleBadges = (game: GameState): string[] => {
  const items: string[] = [];
  items.push(game.rules.dealerStandsOnSoft17 ? "S17" : "H17");
  items.push(game.rules.blackjackPayout === "3:2" ? "3:2" : "6:5");
  items.push(game.rules.doubleAfterSplit ? "DAS" : "No DAS");
  items.push(game.rules.allowInsurance ? "Insurance" : "No Insurance");
  return items;
};

export const TopBarCompact: React.FC<TopBarCompactProps> = ({
  game,
  coachMode,
  onCoachModeChange,
  rightSlot
}) => {
  const ruleBadges = buildRuleBadges(game);
  const cardsRemaining = game.shoe.cards.length;

  return (
    <header className="sticky top-0 z-20 flex w-full flex-col gap-3 border-b border-emerald-800/60 bg-[#061d16]/80 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-emerald-300">
            Casino Blackjack
          </span>
          <h1 className="text-xl font-semibold uppercase tracking-[0.4em] text-emerald-50">Blackjack</h1>
        </div>
        <div className="flex items-center gap-2">
          <CoachToggle mode={coachMode} onChange={onCoachModeChange} />
          {rightSlot}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-200">
        {ruleBadges.map((badge) => (
          <span
            key={badge}
            className="rounded-full border border-[#c8a24a]/40 bg-[#0d2f24]/80 px-2 py-1"
          >
            {badge}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 text-[11px] uppercase tracking-[0.28em] text-emerald-200 sm:grid-cols-4">
        <div>
          <p className="text-emerald-400/80">Bankroll</p>
          <p className="text-base font-semibold text-emerald-50">{formatCurrency(game.bankroll)}</p>
        </div>
        <div>
          <p className="text-emerald-400/80">Round</p>
          <p className="text-base font-semibold text-emerald-50">{game.roundCount}</p>
        </div>
        <div>
          <p className="text-emerald-400/80">Phase</p>
          <p className="text-base font-semibold text-emerald-50">{game.phase}</p>
        </div>
        <div>
          <p className="text-emerald-400/80">Cards</p>
          <p className="text-base font-semibold text-emerald-50">{cardsRemaining}</p>
        </div>
      </div>
    </header>
  );
};
