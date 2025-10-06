import React from "react";
import { Button } from "../ui/button";
import { ChipSVG } from "./ChipSVG";
import type { ChipDenomination } from "../../theme/palette";
import { palette } from "../../theme/palette";
import { defaultTableAnchors, toPixels } from "./coords";
import type { GameState, Hand, Seat } from "../../engine/types";
import { formatCurrency } from "../../utils/currency";

interface BetSpotOverlayProps {
  game: GameState;
  dimensions: { width: number; height: number };
  activeChip: ChipDenomination;
  onSit: (seatIndex: number) => void;
  onLeave: (seatIndex: number) => void;
  onAddChip: (seatIndex: number, value: number) => void;
  onRemoveChipValue: (seatIndex: number, value: number) => void;
  onRemoveTopChip: (seatIndex: number) => void;
  onInsurance: (seatIndex: number, handId: string, amount: number) => void;
  onDeclineInsurance: (seatIndex: number, handId: string) => void;
}

const CHIP_ORDER: ChipDenomination[] = [500, 100, 25, 5, 1];

const computeChipStack = (amount: number): ChipDenomination[] => {
  const stack: ChipDenomination[] = [];
  let remaining = Math.max(0, Math.floor(amount));
  for (const value of CHIP_ORDER) {
    const count = Math.floor(remaining / value);
    for (let i = 0; i < count; i += 1) {
      stack.push(value);
    }
    remaining -= count * value;
  }
  return stack;
};

const seatChips = (seat: Seat): ChipDenomination[] => {
  if (seat.chips && seat.chips.length > 0) {
    return [...seat.chips];
  }
  return computeChipStack(seat.baseBet);
};

const renderChipStack = (chips: ChipDenomination[]): React.ReactNode => {
  if (chips.length === 0) {
    return null;
  }
  const maxVisible = 5;
  const visible = chips.slice(-maxVisible);
  const overflow = chips.length - visible.length;
  return (
    <div className="relative flex h-[64px] w-[64px] items-center justify-center">
      {visible.map((chip, index) => {
        const stackIndex = chips.length - visible.length + index;
        return (
          <span
            key={`${chip}-${stackIndex}`}
            data-chip-value={chip}
            className="absolute pointer-events-auto"
            style={{ transform: `translateY(-${index * 5}px)`, zIndex: index + 1 }}
          >
            <ChipSVG value={chip} size={44} shadow={index === visible.length - 1} />
          </span>
        );
      })}
      {overflow > 0 && (
        <span
          className="absolute -bottom-5 text-[10px] font-semibold uppercase tracking-[0.3em]"
          style={{ color: palette.subtleText }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
};

const totalPendingBets = (seats: Seat[]): number => seats.reduce((sum, seat) => sum + seat.baseBet, 0);

const seatInsurancePrompt = (
  seat: Seat,
  hand: Hand,
  game: GameState,
  onInsurance: BetSpotOverlayProps["onInsurance"],
  onDeclineInsurance: BetSpotOverlayProps["onDeclineInsurance"]
): React.ReactNode => {
  const alreadyResolved = hand.insuranceBet !== undefined;
  if (!seat.occupied || game.phase !== "insurance" || alreadyResolved || hand.isResolved) {
    return null;
  }
  const maxInsurance = Math.floor(hand.bet / 2);
  const cappedAmount = Math.min(maxInsurance, Math.floor(game.bankroll));
  const disabled = cappedAmount <= 0;
  return (
    <div
      key={hand.id}
      className="pointer-events-auto absolute left-1/2 top-full z-10 mt-3 -translate-x-1/2 rounded-lg border border-[#c8a24a]/60 bg-[#0d3024]/95 px-3 py-2 text-xs shadow-lg"
    >
      <p className="font-semibold tracking-wide" style={{ color: palette.gold }}>
        Insurance?
      </p>
      <div className="mt-2 flex gap-2">
        <Button
          size="sm"
          onClick={() => onInsurance(seat.index, hand.id, cappedAmount)}
          disabled={disabled}
        >
          Take {formatCurrency(cappedAmount)}
        </Button>
        <Button size="sm" variant="outline" onClick={() => onDeclineInsurance(seat.index, hand.id)}>
          Skip
        </Button>
      </div>
    </div>
  );
};

export const BetSpotOverlay: React.FC<BetSpotOverlayProps> = ({
  game,
  dimensions,
  activeChip,
  onSit,
  onLeave,
  onAddChip,
  onRemoveChipValue,
  onRemoveTopChip,
  onInsurance,
  onDeclineInsurance
}) => {
  const isBettingPhase = game.phase === "betting";
  const seats = game.seats;
  const totalBets = totalPendingBets(seats);

  const handleAddChip = (seat: Seat): void => {
    if (!isBettingPhase) {
      return;
    }
    if (!seat.occupied) {
      onSit(seat.index);
    }
    const nextAmount = seat.baseBet + activeChip;
    const nextTotal = totalBets - seat.baseBet + nextAmount;
    if (nextTotal > Math.floor(game.bankroll)) {
      return;
    }
    onAddChip(seat.index, activeChip);
  };

  const handleContextMenu = (event: React.MouseEvent, seat: Seat): void => {
    event.preventDefault();
    if (!isBettingPhase || seat.baseBet <= 0) {
      return;
    }
    const target = event.target as HTMLElement;
    const value = Number(target.dataset.chipValue);
    if (!Number.isNaN(value)) {
      onRemoveChipValue(seat.index, value);
    } else {
      onRemoveTopChip(seat.index);
    }
  };

  return (
    <div className="absolute inset-0">
      {seats.map((seat) => {
        const anchor = defaultTableAnchors.seats[seat.index];
        const { x, y } = toPixels(anchor.x, anchor.y, dimensions);
        const scaleX = dimensions.width / defaultTableAnchors.viewBox.width;
        const circleSize = defaultTableAnchors.seatRadius * 2 * scaleX;
        const chips = seatChips(seat);
        const showSit = isBettingPhase && !seat.occupied;
        return (
          <div key={seat.index} className="absolute" style={{ left: x, top: y }}>
            <button
              type="button"
              className="pointer-events-auto relative flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a24a]"
              style={{ width: circleSize, height: circleSize, backgroundColor: "transparent" }}
              onClick={() => handleAddChip(seat)}
              onContextMenu={(event) => handleContextMenu(event, seat)}
              disabled={!isBettingPhase}
              aria-label={`Bet spot for seat ${seat.index + 1}`}
            >
              {renderChipStack(chips)}
            </button>
            <div className="pointer-events-none flex -translate-x-1/2 -translate-y-[110%] flex-col items-center gap-2">
              {seat.baseBet > 0 && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold tracking-[0.3em]"
                  style={{ backgroundColor: "rgba(12, 46, 36, 0.8)", color: palette.line }}
                >
                  {formatCurrency(seat.baseBet)}
                </span>
              )}
            </div>
            {showSit && (
              <div className="pointer-events-auto absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2">
                <Button size="sm" onClick={() => onSit(seat.index)}>
                  Sit
                </Button>
              </div>
            )}
            {seat.occupied && isBettingPhase && (
              <div className="pointer-events-auto absolute left-1/2 top-[85%] -translate-x-1/2">
                <Button size="sm" variant="ghost" onClick={() => onLeave(seat.index)}>
                  Leave
                </Button>
              </div>
            )}
            {seat.hands.map((hand) => seatInsurancePrompt(seat, hand, game, onInsurance, onDeclineInsurance))}
          </div>
        );
      })}
    </div>
  );
};
