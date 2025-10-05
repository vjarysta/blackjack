import { getHandTotals } from '../engine/totals'
import { GameState } from '../engine/types'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface DealerAreaProps {
  game: GameState
}

const cardLabel = (rank: string, suit: string): string => `${rank}${suit}`

const shouldRevealHole = (game: GameState): boolean => {
  if (game.phase === 'dealerPlay' || game.phase === 'settlement') {
    return true
  }
  if (game.dealer.hand.isBlackjack) {
    return true
  }
  return false
}

export const DealerArea = ({ game }: DealerAreaProps) => {
  const revealHole = shouldRevealHole(game)
  const cards = game.dealer.hand.cards
  const visibleCards = cards.map((card, index) => {
    if (index === 1 && !revealHole) {
      return '??'
    }
    return cardLabel(card.rank, card.suit)
  })
  const totals = getHandTotals(game.dealer.hand)
  const totalLabel = revealHole
    ? totals.soft !== undefined && totals.soft !== totals.hard
      ? `${totals.hard} / ${totals.soft}`
      : `${totals.soft ?? totals.hard}`
    : '??'

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Dealer</span>
          <span className="text-sm font-normal text-muted-foreground">Round {game.roundCount}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border border-dashed border-muted bg-muted/20 p-4">
          <p className="text-lg font-semibold">{visibleCards.join(' ') || 'No cards yet'}</p>
          <p className="text-sm text-muted-foreground">Total: {totalLabel}</p>
          {game.dealer.hand.isBlackjack ? (
            <p className="mt-1 text-sm font-medium text-primary">Dealer Blackjack</p>
          ) : null}
        </div>
        <div className="text-sm text-muted-foreground">
          <p>
            Shoe: {game.shoe.cards.length} remaining · {game.shoe.discard.length} discarded · Penetration{' '}
            {((1 - game.shoe.cards.length / game.shoe.initialCount) * 100).toFixed(1)}%
          </p>
          {game.dealer.hasPeeked && !game.dealer.hand.isBlackjack && game.phase === 'playerActions' ? (
            <p className="mt-1 text-xs text-muted-foreground">Dealer peeked — no blackjack.</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
