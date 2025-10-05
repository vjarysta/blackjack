import React from "react";
import { useGameStore } from "../store/useGameStore";

const Badge: React.FC<{ label: string }> = ({ label }) => (
  <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs uppercase tracking-wide text-slate-300">
    {label}
  </span>
);

export const RuleBadges: React.FC = () => {
  const { game } = useGameStore();
  const { rules } = game;
  return (
    <div className="flex flex-wrap gap-2">
      <Badge label={rules.dealerStandsOnSoft17 ? "S17" : "H17"} />
      <Badge label={`BJ ${rules.blackjackPayout}`} />
      <Badge label={rules.surrender === "none" ? "No Surrender" : `${rules.surrender} surrender`} />
      <Badge label={rules.doubleAfterSplit ? "DAS" : "No DAS"} />
      <Badge label={rules.dealerPeekOnTenOrAce ? "Peek" : "No Peek"} />
      <Badge label={`${rules.numberOfDecks} decks`} />
    </div>
  );
};
