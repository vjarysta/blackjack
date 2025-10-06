import React from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { ChipSVG } from "./ChipSVG";
import type { ChipDenomination } from "../../theme/palette";
import { palette } from "../../theme/palette";
import { defaultTableAnchors, toPixels } from "./coords";
import type { GameState, Seat } from "../../engine/types";
import { formatCurrency } from "../../utils/currency";
import { AnimatedChip } from "../animation/AnimatedChip";
import { ANIM, REDUCED } from "../../utils/animConstants";
import { filterSeatsForMode, isSingleSeatMode } from "../../ui/config";

interface BetSpotOverlayProps {
  game: GameState;
  dimensions: { width: number; height: number };
  activeChip: ChipDenomination;
  onSit: (seatIndex: number) => void;
  onLeave: (seatIndex: number) => void;
  onAddChip: (seatIndex: number, denom: number) => void;
  onRemoveChipValue: (seatIndex: number, denom: number) => void;
  onRemoveTopChip: (seatIndex: number) => void;
}

const MAX_VISIBLE_CHIPS = 6;

export const BetSpotOverlay: React.FC<BetSpotOverlayProps> = ({
  game,
  dimensions,
  activeChip,
  onSit,
  onLeave,
  onAddChip,
  onRemoveChipValue,
  onRemoveTopChip
}) => {
  const isBettingPhase = game.phase === "betting";
  const seats = filterSeatsForMode(game.seats);
  const totalBets = seats.reduce((sum, seat) => sum + seat.baseBet, 0);

  const handleAddChip = (seat: Seat): void => {
    if (!isBettingPhase) {
      return;
    }
    if (!seat.occupied) {
      onSit(seat.index);
    }
    const remainingBankroll = Math.max(0, Math.floor(game.bankroll - (totalBets - seat.baseBet)));
    const nextBet = seat.baseBet + activeChip;
    if (remainingBankroll <= 0 || nextBet > game.rules.maxBet) {
      return;
    }
    const denom = Math.min(activeChip, remainingBankroll);
    if (denom > 0) {
      onAddChip(seat.index, denom);
    }
  };

  const handleContextMenu = (event: React.MouseEvent, seat: Seat): void => {
    event.preventDefault();
    if (!isBettingPhase) {
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
    <div className="pointer-events-none absolute inset-0 z-20">
      {seats.map((seat) => {
        const anchor = defaultTableAnchors.seats[seat.index];
        const { x, y } = toPixels(anchor.x, anchor.y, dimensions);
        const scaleX = dimensions.width / defaultTableAnchors.viewBox.width;
        const circleSize = defaultTableAnchors.seatRadius * 2 * scaleX;
        const chipStack = Array.isArray(seat.chips) ? seat.chips : [];
        const showSit = !isSingleSeatMode && isBettingPhase && !seat.occupied;
        const showLeave = !isSingleSeatMode && seat.occupied && isBettingPhase;
        const visibleStart = Math.max(0, chipStack.length - MAX_VISIBLE_CHIPS);
        const visibleChips = chipStack.slice(visibleStart);
        const overflow = chipStack.length - visibleChips.length;
        const isActive = game.activeSeatIndex === seat.index;

        return (
          <div key={seat.index} className="absolute" style={{ left: x, top: y }} data-testid={`seat-${seat.index}`}>
            <div className="relative -translate-x-1/2 -translate-y-1/2" style={{ width: circleSize, height: circleSize }}>
              <button
                type="button"
                data-testid={`bet-spot-${seat.index}`}
                className="pointer-events-auto absolute inset-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a24a]"
                style={{ backgroundColor: "transparent" }}
                onClick={() => handleAddChip(seat)}
                onContextMenu={(event) => handleContextMenu(event, seat)}
                disabled={!isBettingPhase}
                aria-label={isSingleSeatMode ? "Your bet spot" : `Bet spot for seat ${seat.index + 1}`}
              />
              <motion.div
                aria-hidden
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{
                  ...ANIM.fade,
                  duration: REDUCED ? 0 : ANIM.fade.duration
                }}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: circleSize,
                  height: circleSize,
                  borderRadius: "9999px",
                  boxShadow: "0 0 0 2px rgba(200,162,74,0.6), 0 0 18px rgba(200,162,74,0.35)",
                  pointerEvents: "none",
                  zIndex: 20
                }}
              />
              {showSit && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <Button
                    size="sm"
                    className="pointer-events-auto h-7 px-3 text-[11px] font-semibold uppercase tracking-[0.3em]"
                    onClick={() => onSit(seat.index)}
                  >
                    Sit
                  </Button>
                </div>
              )}
              {showLeave && (
                <div className="pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 justify-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="pointer-events-auto h-7 px-3 text-[11px] font-semibold uppercase tracking-[0.3em]"
                    onClick={() => onLeave(seat.index)}
                  >
                    Leave
                  </Button>
                </div>
              )}
            </div>
            <div className="pointer-events-none flex -translate-x-1/2 -translate-y-[110%] flex-col items-center gap-2">
              <div className="relative flex h-[64px] w-[64px] items-center justify-center">
                {visibleChips.map((chip, index) => {
                  const stackIndex = visibleStart + index;
                  const chipId = `${seat.index}-${stackIndex}-${chip}`;
                  return (
                    <AnimatedChip
                      key={chipId}
                      id={chipId}
                      style={{
                        left: "50%",
                        top: `calc(50% - ${index * 6}px)`,
                        transform: "translate(-50%, -50%)"
                      }}
                    >
                      <button
                        type="button"
                        data-chip-value={chip}
                        className="pointer-events-auto"
                        onContextMenu={(event) => {
                          event.preventDefault();
                          if (isBettingPhase) {
                            onRemoveChipValue(seat.index, chip);
                          }
                        }}
                      >
                        <ChipSVG value={chip} size={40} shadow={stackIndex === chipStack.length - 1} />
                      </button>
                    </AnimatedChip>
                  );
                })}
                {overflow > 0 && (
                  <span
                    className="pointer-events-none absolute bottom-[-18px] text-[10px] font-semibold uppercase tracking-[0.3em]"
                    style={{ color: palette.subtleText }}
                  >
                    +{overflow}
                  </span>
                )}
              </div>
              {seat.baseBet > 0 && (
                <span
                  data-testid={`seat-${seat.index}-bet`}
                  className="rounded-full px-3 py-1 text-xs font-semibold tracking-[0.3em]"
                  style={{ backgroundColor: "rgba(12, 46, 36, 0.8)", color: palette.line }}
                >
                  {formatCurrency(seat.baseBet)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
