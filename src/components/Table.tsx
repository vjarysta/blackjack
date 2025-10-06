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

  const MAIN_BOTTOM_PADDING = 24;
  const availableHeight = Math.max(viewportHeight - layoutTop - MAIN_BOTTOM_PADDING, 320);

  const handleSelectChip = (value: ChipDenomination) => {
    setActiveChip(value);
  };

  const totalPendingBets = game.seats.reduce((sum, seat) => sum + seat.baseBet, 0);

  return (
    <div className="flex flex-1 flex-col gap-6 text-emerald-50">
      <header
        ref={headerRef}
        className="rounded-3xl border border-[#c8a24a]/40 bg-[#0c2c22]/80 px-6 py-5 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-emerald-200">Casino Blackjack</p>
            <h1 className="text-3xl font-semibold tracking-[0.4em] text-emerald-50">Blackjack</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-emerald-200">
              <span>
                Bankroll <span className="font-semibold text-emerald-50">{formatCurrency(game.bankroll)}</span>
              </span>
              <span>Pending {formatCurrency(totalPendingBets)}</span>
              <span>
                Min {formatCurrency(game.rules.minBet)} · Max {formatCurrency(game.rules.maxBet)}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs uppercase tracking-[0.3em] text-emerald-300 md:grid-cols-3">
            <div>
              <p className="text-emerald-400/80">Round</p>
              <p className="mt-1 text-lg font-semibold text-emerald-50">{game.roundCount}</p>
            </div>
            <div>
              <p className="text-emerald-400/80">Phase</p>
              <p className="mt-1 text-lg font-semibold text-emerald-50">{game.phase}</p>
            </div>
            <div>
              <p className="text-emerald-400/80">Cards</p>
              <p className="mt-1 text-lg font-semibold text-emerald-50">{game.shoe.cards.length}</p>
            </div>
            <div>
              <p className="text-emerald-400/80">Discard</p>
              <p className="mt-1 text-lg font-semibold text-emerald-50">{game.shoe.discard.length}</p>
            </div>
            <div>
              <p className="text-emerald-400/80">Penetration</p>
              <p className="mt-1 text-lg font-semibold text-emerald-50">{penetrationPercentage(game)}</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <RuleBadges rules={game.rules} />
            </div>
          </div>
        </div>
      </header>

      <div ref={layoutContainerRef} className="flex min-h-0" style={{ height: availableHeight }}>
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
