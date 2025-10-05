import React from "react";
import type { RuleConfig } from "../engine/types";

interface RuleBadgesProps {
  rules: RuleConfig;
}

const Badge = ({ label }: { label: string }) => (
  <span className="rounded-full bg-emerald-800 px-3 py-1 text-xs font-semibold text-emerald-100">{label}</span>
);

export const RuleBadges: React.FC<RuleBadgesProps> = ({ rules }) => {
  const badges = [
    rules.dealerStandsOnSoft17 ? "S17" : "H17",
    rules.blackjackPayout,
    rules.doubleAfterSplit ? "DAS" : "No DAS",
    rules.surrender === "late" ? "Late Surrender" : rules.surrender === "early" ? "Early Surrender" : "No Surrender",
    rules.allowInsurance ? "Insurance" : "No Insurance",
    rules.dealerPeekOnTenOrAce ? "Peek" : "No Peek"
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <Badge key={badge} label={badge} />
      ))}
    </div>
  );
};
