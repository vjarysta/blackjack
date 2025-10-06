import React from "react";
import type { Hand } from "../../../engine/types";
import { formatCurrency } from "../../../utils/currency";

interface InsuranceRowProps {
  seatIndex: number;
  hand: Hand;
  bankroll: number;
  onInsurance: (handId: string, amount: number) => void;
  onDecline: (handId: string) => void;
}

const InsuranceRow: React.FC<InsuranceRowProps> = ({ seatIndex, hand, bankroll, onInsurance, onDecline }) => {
  const maxInsurance = Math.floor(hand.bet / 2);
  const capped = Math.min(maxInsurance, Math.floor(bankroll));
  const [value, setValue] = React.useState(capped);

  React.useEffect(() => {
    setValue(capped);
  }, [capped]);

  return (
    <div className="solo-surface flex w-full flex-col gap-3 px-4 py-3 text-sm text-[var(--text-hi)]">
      <div className="flex items-center justify-between text-xs uppercase tracking-[var(--caps-track)] text-[var(--text-lo)]">
        <span>Assurance main {hand.id.split("-").pop()}</span>
        <span>Max {formatCurrency(maxInsurance)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={maxInsurance}
        step={1}
        value={value}
        className="w-full accent-[var(--accent)]"
        onChange={(event) => setValue(Number(event.target.value))}
      />
      <div className="flex items-center justify-between text-xs uppercase tracking-[var(--caps-track)]">
        <span>Assurance {formatCurrency(value)}</span>
        <div className="flex gap-2">
          <button
            type="button"
            className="solo-control solo-secondary h-10 px-4 text-[11px]"
            onClick={() => onDecline(hand.id)}
          >
            Passer
          </button>
          <button
            type="button"
            className="solo-control solo-primary h-10 px-4 text-[11px]"
            onClick={() => onInsurance(hand.id, Math.min(value, capped))}
            disabled={capped <= 0}
          >
            Prendre
          </button>
        </div>
      </div>
    </div>
  );
};

interface InsuranceStripProps {
  seatIndex: number;
  hands: Hand[];
  bankroll: number;
  onInsurance: (handId: string, amount: number) => void;
  onDecline: (handId: string) => void;
}

export const InsuranceStrip: React.FC<InsuranceStripProps> = ({
  seatIndex,
  hands,
  bankroll,
  onInsurance,
  onDecline
}) => {
  if (hands.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-2 px-4">
      {hands.map((hand) => (
        <InsuranceRow
          key={`${seatIndex}-${hand.id}`}
          seatIndex={seatIndex}
          hand={hand}
          bankroll={bankroll}
          onInsurance={onInsurance}
          onDecline={onDecline}
        />
      ))}
    </div>
  );
};
