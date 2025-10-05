import React from "react";
import type { RuleConfig } from "../engine/types";
import { palette } from "../theme/palette";

interface RuleBadgesProps {
  rules: RuleConfig;
}

const Badge = ({ label }: { label: string }) => (
  <span
    className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]"
    style={{
      borderColor: "rgba(200, 162, 74, 0.5)",
      backgroundColor: "rgba(12, 46, 36, 0.7)",
      color: palette.text
    }}
  >
    {label}
  </span>
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
