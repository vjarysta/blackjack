import { DealerArea } from "./DealerArea";
import { SeatCard } from "./SeatCard";
import { type GameState, type Hand } from "../engine/types";

interface TableProps {
  game: GameState;
  onSit: (seatIndex: number) => void;
  onLeave: (seatIndex: number) => void;
  onSetBet: (seatIndex: number, amount: number) => void;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
  onSurrender: () => void;
  onInsurance: (seatIndex: number, hand: Hand, amount: number) => void;
}

export function Table({
  game,
  onSit,
  onLeave,
  onSetBet,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onSurrender,
  onInsurance
}: TableProps): JSX.Element {
  const seatComponents = game.seats.map((seat) => (
    <SeatCard
      key={seat.index}
      seat={seat}
      game={game}
      onSit={onSit}
      onLeave={onLeave}
      onBetChange={onSetBet}
      onHit={onHit}
      onStand={onStand}
      onDouble={onDouble}
      onSplit={onSplit}
      onSurrender={onSurrender}
      onInsurance={(hand, amount) => onInsurance(seat.index, hand, amount)}
      isActiveSeat={game.activeSeatIndex === seat.index}
    />
  ));

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-4 md:col-span-3">
        <DealerArea game={game} />
      </div>
      {seatComponents}
    </div>
  );
}
