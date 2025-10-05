import { GameState } from '../engine/types'
import { formatCurrency } from '../utils/currency'
import { Button } from './ui/button'

interface ControlsBarProps {
  game: GameState
  canDeal: boolean
  onDeal: () => void
  onSkipInsurance: () => void
  onNextRound: () => void
}

export const ControlsBar = ({ game, canDeal, onDeal, onSkipInsurance, onNextRound }: ControlsBarProps) => (
  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4 shadow-sm">
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      <span>Phase: {game.phase}</span>
      <span>
        Hands in action:{' '}
        {game.seats.reduce((count, seat) => count + seat.hands.filter((hand) => !hand.isResolved).length, 0)}
      </span>
      <span>Bankroll: {formatCurrency(game.bankroll, game.rules.currency)}</span>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={onDeal} disabled={!canDeal || game.phase !== 'betting'}>
        Deal
      </Button>
      {game.phase === 'insurance' ? (
        <Button onClick={onSkipInsurance} variant="outline">
          Skip insurance
        </Button>
      ) : null}
      {game.phase === 'settlement' ? (
        <Button onClick={onNextRound} variant="secondary">
          Next round
        </Button>
      ) : null}
    </div>
  </div>
)
