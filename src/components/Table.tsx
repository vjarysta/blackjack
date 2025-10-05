import { GameState } from '../engine/types'
import { DealerArea } from './DealerArea'
import { SeatCard } from './SeatCard'

interface TableProps {
  game: GameState
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

export const Table = ({
  game,
  onSit,
  onLeave,
  onBetChange,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onSurrender,
  onTakeInsurance,
}: TableProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="w-full">
        <DealerArea game={game} />
      </div>
      <div className="flex flex-wrap items-stretch justify-center gap-4">
        {game.seats.map((seat) => (
          <div key={seat.index} className="w-full md:w-[calc(50%-1rem)] xl:w-[calc(33%-1rem)]">
            <SeatCard
              game={game}
              seat={seat}
              phase={game.phase}
              isActive={game.activeSeatIndex === seat.index}
              activeHandId={game.activeHandId}
              onSit={onSit}
              onLeave={onLeave}
              onBetChange={onBetChange}
              onHit={onHit}
              onStand={onStand}
              onDouble={onDouble}
              onSplit={onSplit}
              onSurrender={onSurrender}
              onTakeInsurance={onTakeInsurance}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
