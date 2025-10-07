import React from "react";
import type { CoachMode } from "../../store/useGameStore";
import type { ChipDenomination } from "../../theme/palette";
import { formatCurrency } from "../../utils/currency";
import type { Action } from "../../utils/basicStrategy";
import { cn } from "../../utils/cn";
import { usePrefersReducedMotion } from "./hooks";

const CHIP_VALUES: ChipDenomination[] = [1, 5, 25, 100, 500];

type ActionAvailability = {
  hit: boolean;
  stand: boolean;
  double: boolean;
  split: boolean;
  surrender: boolean;
  deal: boolean;
  finishInsurance: boolean;
  playDealer: boolean;
  nextRound: boolean;
};

interface ChipTrayProps {
  activeChip: ChipDenomination;
  onSelect: (value: ChipDenomination) => void;
  onAdd: (value: ChipDenomination) => void;
  onRemove: (value: ChipDenomination) => void;
  onRemoveTop: () => void;
  disabled: boolean;
  bankroll: number;
  bet: number;
}

const ChipTray: React.FC<ChipTrayProps> = ({
  activeChip,
  onSelect,
  onAdd,
  onRemove,
  onRemoveTop,
  disabled,
  bankroll,
  bet
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [bounceChip, setBounceChip] = React.useState<ChipDenomination | null>(null);

  const triggerBounce = (value: ChipDenomination) => {
    if (prefersReducedMotion) {
      return;
    }
    setBounceChip(value);
    window.setTimeout(() => {
      setBounceChip((current) => (current === value ? null : current));
    }, 220);
  };

  const handleSelect = (value: ChipDenomination) => {
    onSelect(value);
    if (!disabled) {
      onAdd(value);
      triggerBounce(value);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-[0.62rem] uppercase tracking-[0.32em] text-[var(--nj-text-muted)]">
        <span>Chips</span>
        <span>
          Bet <span className="text-[var(--nj-text)]">{formatCurrency(bet)}</span>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {CHIP_VALUES.map((value) => {
          const isSelected = activeChip === value;
          const bounce = bounceChip === value;
          return (
            <button
              key={value}
              type="button"
              className={cn(
                "nj-chip",
                isSelected ? "ring-2 ring-[rgba(233,196,106,0.6)]" : undefined,
                bounce ? "nj-chip-bounce" : undefined
              )}
              onClick={() => handleSelect(value)}
              onContextMenu={(event) => {
                event.preventDefault();
                if (!disabled) {
                  onRemove(value);
                }
              }}
              data-selected={isSelected}
              aria-label={`Select ${value} chip`}
            >
              {value}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-2 text-[0.62rem] uppercase tracking-[0.28em]">
        <button
          type="button"
          className="nj-btn col-span-2"
          onClick={() => onAdd(activeChip)}
          disabled={disabled}
        >
          Add {activeChip}
        </button>
        <button type="button" className="nj-btn" onClick={() => onRemove(activeChip)} disabled={disabled}>
          Remove
        </button>
        <button type="button" className="nj-btn col-span-3" onClick={onRemoveTop} disabled={disabled}>
          Undo Last
        </button>
      </div>
      <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(10,15,20,0.35)] px-4 py-3 text-[0.62rem] uppercase tracking-[0.32em] text-[var(--nj-text-muted)]">
        <div className="flex items-center justify-between">
          <span>Bankroll</span>
          <span className="text-[var(--nj-text)]">{formatCurrency(bankroll)}</span>
        </div>
      </div>
    </div>
  );
};

interface ActionButtonsProps {
  availability: ActionAvailability;
  onDeal: () => void;
  onFinishInsurance: () => void;
  onPlayDealer: () => void;
  onNextRound: () => void;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
  onSurrender: () => void;
  highlightedAction?: Action | null;
}

const highlightAttr = (highlighted: Action | null, action: Action): string | undefined => {
  if (!highlighted) {
    return undefined;
  }
  return highlighted === action ? "best" : undefined;
};

const ActionButtons: React.FC<ActionButtonsProps> = ({
  availability,
  onDeal,
  onFinishInsurance,
  onPlayDealer,
  onNextRound,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onSurrender,
  highlightedAction
}) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="nj-btn nj-btn-primary h-16 text-base uppercase tracking-[0.32em]"
          onClick={onHit}
          disabled={!availability.hit}
          data-coach={highlightAttr(highlightedAction, "hit")}
        >
          Hit
        </button>
        <button
          type="button"
          className="nj-btn h-16 text-base uppercase tracking-[0.32em]"
          onClick={onStand}
          disabled={!availability.stand}
          data-coach={highlightAttr(highlightedAction, "stand")}
        >
          Stand
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3 text-[0.62rem] uppercase tracking-[0.28em]">
        <button
          type="button"
          className="nj-btn"
          onClick={onDouble}
          disabled={!availability.double}
          data-coach={highlightAttr(highlightedAction, "double")}
        >
          Double
        </button>
        <button
          type="button"
          className="nj-btn"
          onClick={onSplit}
          disabled={!availability.split}
          data-coach={highlightAttr(highlightedAction, "split")}
        >
          Split
        </button>
        <button
          type="button"
          className="nj-btn"
          onClick={onSurrender}
          disabled={!availability.surrender}
          data-coach={highlightAttr(highlightedAction, "surrender")}
        >
          Surrender
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 text-[0.62rem] uppercase tracking-[0.28em] md:grid-cols-4">
        <button type="button" className="nj-btn" onClick={onDeal} disabled={!availability.deal}>
          Deal
        </button>
        <button type="button" className="nj-btn" onClick={onFinishInsurance} disabled={!availability.finishInsurance}>
          Finish Insurance
        </button>
        <button type="button" className="nj-btn" onClick={onPlayDealer} disabled={!availability.playDealer}>
          Play Dealer
        </button>
        <button type="button" className="nj-btn" onClick={onNextRound} disabled={!availability.nextRound}>
          Next Round
        </button>
      </div>
    </div>
  );
};

interface ControlsZoneProps {
  activeChip: ChipDenomination;
  onSelectChip: (value: ChipDenomination) => void;
  onAddChip: (value: ChipDenomination) => void;
  onRemoveChip: (value: ChipDenomination) => void;
  onRemoveTopChip: () => void;
  chipDisabled: boolean;
  availability: ActionAvailability;
  onDeal: () => void;
  onFinishInsurance: () => void;
  onPlayDealer: () => void;
  onNextRound: () => void;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
  onSurrender: () => void;
  highlightedAction?: Action | null;
  coachMode: CoachMode;
  coachMessage?: { tone: "correct" | "better"; text: string } | null;
  bankroll: number;
  bet: number;
}

export const ControlsZone: React.FC<ControlsZoneProps> = ({
  activeChip,
  onSelectChip,
  onAddChip,
  onRemoveChip,
  onRemoveTopChip,
  chipDisabled,
  availability,
  onDeal,
  onFinishInsurance,
  onPlayDealer,
  onNextRound,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onSurrender,
  highlightedAction,
  coachMode,
  coachMessage,
  bankroll,
  bet
}) => {
  return (
    <section className="nj-sticky-bottom">
      <div className="flex flex-col gap-4 rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(4,12,10,0.75)] px-4 py-4 backdrop-blur-lg sm:flex-row sm:items-start sm:justify-between">
        <div className="sm:w-[260px]">
          <ChipTray
            activeChip={activeChip}
            onSelect={onSelectChip}
            onAdd={onAddChip}
            onRemove={onRemoveChip}
            onRemoveTop={onRemoveTopChip}
            disabled={chipDisabled}
            bankroll={bankroll}
            bet={bet}
          />
        </div>
        <div className="flex-1">
          <div className="flex flex-col gap-4 rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,15,20,0.35)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[0.62rem] uppercase tracking-[0.28em] text-[var(--nj-text-muted)]">
              <span>Coach {coachMode === "off" ? "Off" : coachMode === "live" ? "Live" : "Feedback"}</span>
              <span>Bankroll {formatCurrency(bankroll)}</span>
            </div>
            {coachMessage ? (
              <div
                className={cn(
                  "rounded-2xl px-3 py-2 text-[0.62rem] uppercase tracking-[0.28em]",
                  coachMessage.tone === "correct"
                    ? "border border-[rgba(34,197,94,0.45)] bg-[rgba(34,197,94,0.15)] text-[var(--nj-text)]"
                    : "border border-[rgba(233,196,106,0.45)] bg-[rgba(233,196,106,0.12)] text-[var(--nj-gold)]"
                )}
              >
                {coachMessage.text}
              </div>
            ) : null}
            <ActionButtons
              availability={availability}
              onDeal={onDeal}
              onFinishInsurance={onFinishInsurance}
              onPlayDealer={onPlayDealer}
              onNextRound={onNextRound}
              onHit={onHit}
              onStand={onStand}
              onDouble={onDouble}
              onSplit={onSplit}
              onSurrender={onSurrender}
              highlightedAction={highlightedAction}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export type { ActionAvailability };
