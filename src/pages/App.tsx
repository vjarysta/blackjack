import { useMemo } from 'react'

import { ControlsBar } from '../components/ControlsBar'
import { RuleBadges } from '../components/RuleBadges'
import { Table } from '../components/Table'
import { useGameStore } from '../store/useGameStore'
import { formatCurrency } from '../utils/currency'

const App = () => {
  const {
    game,
    sit,
    leave,
    setBet,
    deal,
    takeInsurance,
    skipInsurance,
    hit,
    stand,
    double,
    split,
    surrender,
    nextRound,
  } = useGameStore()

  const canDeal = useMemo(() => {
    const readySeats = game.seats.filter((seat) => seat.occupied && seat.baseBet >= game.rules.minBet)
    if (readySeats.length === 0) {
      return false
    }
    const totalBet = readySeats.reduce((sum, seat) => sum + seat.baseBet, 0)
    return totalBet <= game.bankroll
  }, [game])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 pb-12">
        <header className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Blackjack Trainer</h1>
              <p className="text-sm text-muted-foreground">Single-player, 7 seats, Vegas rules.</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Bankroll: {formatCurrency(game.bankroll)}</p>
              <p>
                Shoe: {game.shoe.cards.length} cards left · {game.shoe.discard.length} discarded · Penetration{' '}
                {((1 - game.shoe.cards.length / game.shoe.initialCount) * 100).toFixed(1)}%
              </p>
              <p>Round: {game.roundCount}</p>
            </div>
          </div>
          <RuleBadges rules={game.rules} />
        </header>

        <ControlsBar game={game} canDeal={canDeal} onDeal={deal} onSkipInsurance={skipInsurance} onNextRound={nextRound} />

        <main className="flex flex-col gap-6 lg:flex-row">
          <section className="flex-1 space-y-4">
            <Table
              game={game}
              onSit={sit}
              onLeave={leave}
              onBetChange={setBet}
              onHit={hit}
              onStand={stand}
              onDouble={double}
              onSplit={split}
              onSurrender={surrender}
              onTakeInsurance={takeInsurance}
            />
          </section>
          <aside className="w-full max-w-sm space-y-4">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h2 className="text-lg font-semibold">Message log</h2>
              <p className="text-xs text-muted-foreground">Latest events first.</p>
              <ul className="mt-3 space-y-2 text-sm">
                {game.messageLog.length === 0 ? (
                  <li className="text-muted-foreground">No events yet — place bets and deal.</li>
                ) : (
                  game.messageLog.slice(0, 10).map((entry, index) => (
                    <li key={`${entry}-${index}`} className="rounded border border-muted bg-muted/20 px-2 py-1">
                      {entry}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}

export default App
