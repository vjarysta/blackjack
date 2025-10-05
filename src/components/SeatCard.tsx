import { useEffect, useState } from 'react'

import { canDouble, canHit, canSplit, canSurrender, canTakeInsurance } from '../engine/rules'
import { getHandTotals, isBust } from '../engine/totals'
import { GameState, Hand, Phase, Seat } from '../engine/types'
import { formatCurrency } from '../utils/currency'
import { Button } from './ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'

const cardLabel = (card: Hand['cards'][number]): string => `${card.rank}${card.suit}`

const renderTotals = (hand: Hand): string => {
  const totals = getHandTotals(hand)
  if (totals.soft !== undefined && totals.soft !== totals.hard) {
    return `${totals.hard} / ${totals.soft}`
  }
  return `${totals.soft ?? totals.hard}`
}

const handStatus = (hand: Hand): string | null => {
  if (hand.isSurrendered || hand.outcome === 'surrender') {
    return 'Surrendered'
  }
  if (hand.outcome === 'blackjack' || hand.isBlackjack) {
    return 'Blackjack'
  }
  if (hand.outcome === 'bust' || isBust(hand)) {
    return 'Busted'
  }
  if (hand.outcome === 'push') {
    return 'Push'
  }
  if (hand.outcome === 'win') {
    return 'Won'
  }
  if (hand.outcome === 'lose') {
    return 'Lost'
  }
  return null
}

interface SeatCardProps {
  game: GameState
  seat: Seat
  phase: Phase
  isActive: boolean
  activeHandId: string | null
  onSit: (seatIndex: number) => void
  onLeave: (seatIndex: number) => void
  onBetChange: (seatIndex: number, amount: number) => void
  onHit: () => void
  onStand: () => void
  onDouble: () => void
  onSplit: () => void
  onSurrender: () => void
  onTakeInsurance: (seatIndex: number, handId: string, amount: number) => void
}

export const SeatCard = ({
  game,
  seat,
  phase,
  isActive,
  activeHandId,
  onSit,
  onLeave,
  onBetChange,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onSurrender,
  onTakeInsurance,
}: SeatCardProps) => {
  const [insuranceInputs, setInsuranceInputs] = useState<Record<string, string>>({})

  useEffect(() => {
    if (phase === 'insurance') {
      const next: Record<string, string> = {}
      seat.hands.forEach((hand) => {
        next[hand.id] = hand.insuranceBet
          ? hand.insuranceBet.toFixed(2)
          : (hand.bet / 2).toFixed(2)
      })
      setInsuranceInputs(next)
    }
  }, [phase, seat.hands])

  const seatTitle = `Seat ${seat.index + 1}`
  const canAdjustBet = phase === 'betting' && seat.occupied
  const showActions = phase === 'playerActions' && isActive

  const renderBettingControls = () => {
    if (!seat.occupied) {
      return (
        <Button onClick={() => onSit(seat.index)} variant="secondary">
          Sit here
        </Button>
      )
    }

    return (
      <div className="flex w-full items-end gap-2">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-muted-foreground" htmlFor={`bet-${seat.index}`}>
            Bet amount
          </label>
          <Input
            id={`bet-${seat.index}`}
            type="number"
            min={game.rules.minBet}
            step={1}
            value={seat.baseBet > 0 ? seat.baseBet : ''}
            onChange={(event) => onBetChange(seat.index, Number(event.target.value))}
            disabled={!canAdjustBet}
          />
          <p className="text-xs text-muted-foreground">
            Min {formatCurrency(game.rules.minBet)} – bankroll {formatCurrency(game.bankroll)}
          </p>
        </div>
        <Button onClick={() => onLeave(seat.index)} variant="ghost" className="self-start">
          Leave
        </Button>
      </div>
    )
  }

  const renderInsuranceControls = (hand: Hand) => {
    if (phase !== 'insurance') {
      return null
    }
    if (!canTakeInsurance(hand, game)) {
      return null
    }
    const value = insuranceInputs[hand.id] ?? (hand.bet / 2).toFixed(2)
    const maxInsurance = hand.bet / 2
    return (
      <div className="mt-2 space-y-2 rounded-md border border-dashed border-muted p-3 text-sm">
        <p className="font-medium">Insurance</p>
        <div className="flex items-end gap-2">
          <Input
            type="number"
            min={0}
            step="0.5"
            max={maxInsurance}
            value={value}
            onChange={(event) =>
              setInsuranceInputs((prev) => ({ ...prev, [hand.id]: event.target.value }))
            }
            className="max-w-[120px]"
            disabled={hand.insuranceBet !== undefined}
          />
          <Button
            variant="outline"
            disabled={hand.insuranceBet !== undefined}
            onClick={() => onTakeInsurance(seat.index, hand.id, Number(value))}
          >
            Take
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Max {formatCurrency(maxInsurance)}
        </p>
      </div>
    )
  }

  const renderHandActions = (hand: Hand) => {
    if (!showActions || hand.id !== activeHandId) {
      return null
    }

    const canHitNow = canHit(hand, game)
    const canStandNow = canStand(hand, game)
    const canDoubleNow = canDouble(hand, game) && hand.bet <= game.bankroll
    const canSplitNow = canSplit(hand, game) && hand.bet <= game.bankroll
    const canSurrenderNow = canSurrender(hand, game)

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={onHit} disabled={!canHitNow}>
          Hit
        </Button>
        <Button onClick={onStand} variant="secondary" disabled={!canStandNow}>
          Stand
        </Button>
        <Button onClick={onDouble} variant="outline" disabled={!canDoubleNow}>
          Double
        </Button>
        <Button onClick={onSplit} variant="outline" disabled={!canSplitNow}>
          Split
        </Button>
        <Button onClick={onSurrender} variant="destructive" disabled={!canSurrenderNow}>
          Surrender
        </Button>
      </div>
    )
  }

  const renderHand = (hand: Hand) => {
    const isActiveHand = isActive && hand.id === activeHandId
    const totals = renderTotals(hand)
    const status = handStatus(hand)
    return (
      <div
        key={hand.id}
        className={
          'rounded-md border border-muted bg-muted/20 p-3 transition-colors ' +
          (isActiveHand ? 'border-primary ring-2 ring-primary/40' : '')
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-base font-medium">
            <span>{hand.cards.map(cardLabel).join(' ') || '—'}</span>
            {hand.isDoubled ? <span className="rounded bg-secondary px-2 py-0.5 text-xs">Doubled</span> : null}
            {hand.isSplitAce ? (
              <span className="rounded bg-secondary px-2 py-0.5 text-xs">Split Ace</span>
            ) : null}
          </div>
          <span className="text-sm text-muted-foreground">Bet {formatCurrency(hand.bet)}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between text-sm text-muted-foreground">
          <span>Totals: {totals}</span>
          {hand.insuranceBet ? <span>Insurance {formatCurrency(hand.insuranceBet)}</span> : null}
        </div>
        {status ? <p className="mt-1 text-sm font-medium text-primary">{status}</p> : null}
        {renderInsuranceControls(hand)}
        {renderHandActions(hand)}
      </div>
    )
  }

  return (
    <Card className={isActive ? 'border-primary' : undefined}>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>{seatTitle}</CardTitle>
        <span className="text-sm text-muted-foreground">
          {seat.occupied
            ? `Base bet ${formatCurrency(seat.baseBet || game.rules.minBet)}`
            : `Bankroll ${formatCurrency(game.bankroll)}`}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        {phase === 'betting' || !seat.occupied ? renderBettingControls() : null}
        {seat.occupied && seat.hands.length > 0 ? (
          <div className="space-y-3">
            {seat.hands.map((hand) => renderHand(hand))}
          </div>
        ) : null}
        {seat.occupied && seat.hands.length === 0 && phase !== 'betting' ? (
          <p className="text-sm text-muted-foreground">Waiting for next round…</p>
        ) : null}
      </CardContent>
      <CardFooter className="justify-end text-sm text-muted-foreground">
        {phase === 'betting' && !seat.occupied ? 'Tap sit to join this spot.' : null}
        {phase === 'betting' && seat.occupied ? 'Adjust bet before dealing.' : null}
        {phase !== 'betting' ? `Hands this round: ${seat.hands.length}` : null}
      </CardFooter>
    </Card>
  )
}
