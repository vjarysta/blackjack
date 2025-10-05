import React from "react";
import { SeatCard } from "./SeatCard";
import { DealerArea } from "./DealerArea";
import { useGameStore } from "../store/useGameStore";

export const Table: React.FC = () => {
  const { game } = useGameStore();
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-3">
        <DealerArea />
      </div>
      {game.seats.map((seat) => (
        <SeatCard key={seat.index} seat={seat} />
      ))}
    </div>
  );
};
