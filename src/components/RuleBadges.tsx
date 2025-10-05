import { RuleConfig } from '../engine/types'

const badgeClass =
  'inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary'

export const RuleBadges = ({ rules }: { rules: RuleConfig }) => {
  const badges = [
    rules.dealerStandsOnSoft17 ? 'S17' : 'H17',
    rules.blackjackPayout,
    rules.surrender === 'none' ? 'No Surrender' : `${rules.surrender} Surrender`,
    rules.doubleAfterSplit ? 'DAS' : 'No DAS',
    rules.splitPairsEqualRankOnly ? 'Pair Splits' : 'Any Tens Split',
    rules.resplitAces ? 'Resplit Aces' : 'No Resplit Aces',
    rules.hitOnSplitAces ? 'Hit Split Aces' : 'One Card on Split Aces',
    rules.dealerPeekOnTenOrAce ? 'Dealer Peek' : 'No Peek',
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <span key={badge} className={badgeClass}>
          {badge}
        </span>
      ))}
    </div>
  )
}
