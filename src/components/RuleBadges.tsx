import { type RuleConfig } from "../engine/types";

interface RuleBadgesProps {
  rules: RuleConfig;
}

export function RuleBadges({ rules }: RuleBadgesProps): JSX.Element {
  const badges: string[] = [];
  badges.push(rules.dealerStandsOnSoft17 ? "S17" : "H17");
  badges.push(`BJ ${rules.blackjackPayout}`);
  badges.push(rules.surrender === "none" ? "No Surrender" : `${rules.surrender} Surrender`);
  badges.push(rules.doubleAfterSplit ? "DAS" : "No DAS");
  badges.push(rules.dealerPeekOnTenOrAce ? "Peek" : "No Peek");

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <span
          key={badge}
          className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground"
        >
          {badge}
        </span>
      ))}
    </div>
  );
}
