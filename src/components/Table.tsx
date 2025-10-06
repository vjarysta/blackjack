import React from "react";
import type { GameState } from "../engine/types";
import { formatCurrency } from "../utils/currency";
import { RuleBadges } from "./RuleBadges";
import { TableLayout } from "./table/TableLayout";
import type { ChipDenomination } from "../theme/palette";

interface TableProps {
  game: GameState;
  actions: {
    sit: (seatIndex: number) => void;
    leave: (seatIndex: number) => void;
    addChip: (seatIndex: number, denom: number) => void;
    removeChipValue: (seatIndex: number, denom: number) => void;
    removeTopChip: (seatIndex: number) => void;
    deal: () => void;
    playerHit: () => void;
    playerStand: () => void;
    playerDouble: () => void;
    playerSplit: () => void;
    playerSurrender: () => void;
    takeInsurance: (seatIndex: number, handId: string, amount: number) => void;
    declineInsurance: (seatIndex: number, handId: string) => void;
    finishInsurance: () => void;
    playDealer: () => void;
    nextRound: () => void;
  };
}

const penetrationPercentage = (game: GameState): string => {
  const totalCards = game.shoe.cards.length + game.shoe.discard.length;
  if (totalCards === 0) {
    return "0%";
  }
  const penetration = game.shoe.discard.length / totalCards;
  return `${Math.round(penetration * 100)}%`;
};

export const Table: React.FC<TableProps> = ({ game, actions }) => {
  const [activeChip, setActiveChip] = React.useState<ChipDenomination>(25);
  const headerRef = React.useRef<HTMLDivElement | null>(null);
  const [viewportHeight, setViewportHeight] = React.useState(
    typeof window === "undefined" ? 0 : window.innerHeight
  );
  const layoutContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [layoutTop, setLayoutTop] = React.useState(0);

  React.useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const recalcLayoutTop = React.useCallback(() => {
    if (layoutContainerRef.current) {
      const rect = layoutContainerRef.current.getBoundingClientRect();
      setLayoutTop(rect.top);
    }
  }, []);

  React.useLayoutEffect(() => {
    if (!headerRef.current || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(() => {
      recalcLayoutTop();
    });
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [recalcLayoutTop]);

  React.useLayoutEffect(() => {
    recalcLayoutTop();
  }, [recalcLayoutTop, viewportHeight]);

  const MAIN_BOTTOM_PADDING = 12;
  const availableHeight = Math.max(viewportHeight - layoutTop - MAIN_BOTTOM_PADDING, 320);

  const handleSelectChip = (value: ChipDenomination) => {
    setActiveChip(value);
  };

  const totalPendingBets = game.seats.reduce((sum, seat) => sum + seat.baseBet, 0);

  return (
    <div className="flex flex-1 flex-col gap-3 text-emerald-50">
      <header
        ref={headerRef}
        className="rounded-3xl border border-[#c8a24a]/35 bg-[#0c2c22]/65 px-4 py-2 shadow-[0_16px_36px_rgba(0,0,0,0.4)] backdrop-blur"
      >
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-200">
              <span>Casino Blackjack</span>
              <RuleBadges rules={game.rules} />
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-lg font-semibold uppercase tracking-[0.24em] text-emerald-50">Blackjack</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-emerald-200">
                <span>
                  Bankroll <span className="font-semibold text-emerald-50">{formatCurrency(game.bankroll)}</span>
                </span>
                <span>Pending {formatCurrency(totalPendingBets)}</span>
                <span>
                  Min {formatCurrency(game.rules.minBet)} · Max {formatCurrency(game.rules.maxBet)}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.18em] text-emerald-300 sm:grid-cols-5">
            <div>
              <p className="text-emerald-400/70">Round</p>
              <p className="mt-0.5 text-base font-semibold text-emerald-50">{game.roundCount}</p>
            </div>
            <div>
              <p className="text-emerald-400/70">Phase</p>
              <p className="mt-0.5 text-base font-semibold text-emerald-50">{game.phase}</p>
            </div>
            <div>
              <p className="text-emerald-400/70">Cards</p>
              <p className="mt-0.5 text-base font-semibold text-emerald-50">{game.shoe.cards.length}</p>
            </div>
            <div>
              <p className="text-emerald-400/70">Discard</p>
              <p className="mt-0.5 text-base font-semibold text-emerald-50">{game.shoe.discard.length}</p>
            </div>
            <div>
              <p className="text-emerald-400/70">Penetration</p>
              <p className="mt-0.5 text-base font-semibold text-emerald-50">{penetrationPercentage(game)}</p>
            </div>
          </div>
        </div>
      </header>

      <div
        ref={layoutContainerRef}
        className="flex min-h-0 justify-center"
        style={{ height: availableHeight }}
      >
        <TableLayout
          game={game}
          activeChip={activeChip}
          onSelectChip={handleSelectChip}
          onSit={actions.sit}
          onLeave={actions.leave}
          onAddChip={actions.addChip}
          onRemoveChipValue={actions.removeChipValue}
          onRemoveTopChip={actions.removeTopChip}
          onInsurance={actions.takeInsurance}
          onDeclineInsurance={actions.declineInsurance}
          onHit={actions.playerHit}
          onStand={actions.playerStand}
          onDouble={actions.playerDouble}
          onSplit={actions.playerSplit}
          onSurrender={actions.playerSurrender}
          onDeal={actions.deal}
          onFinishInsurance={actions.finishInsurance}
          onPlayDealer={actions.playDealer}
          onNextRound={actions.nextRound}
        />
      </div>
    </div>
  );
};
