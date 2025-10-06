import React from "react";
import type { RuleConfig, Shoe } from "../../engine/types";
import { formatCurrency } from "../../utils/currency";
import { cn } from "../../utils/cn";

interface StatsDrawerProps {
  open: boolean;
  onClose: () => void;
  shoe: Shoe;
  rules: RuleConfig;
  messageLog: string[];
}

export const StatsDrawer: React.FC<StatsDrawerProps> = ({ open, onClose, shoe, rules, messageLog }) => {
  const totalCards = shoe.cards.length + shoe.discard.length;
  const penetration = totalCards === 0 ? 0 : (shoe.discard.length / totalCards) * 100;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        role="presentation"
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[rgba(12,31,24,0.95)] p-6 text-[var(--text-hi)] shadow-[var(--shadow-1)] transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
        aria-label="Stats drawer"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em]">Shoe & Stats</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[rgba(216,182,76,0.3)] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-[var(--text-hi)]"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-4 text-[12px] text-[var(--text-lo)]">
          <section>
            <h3 className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-hi)]">Shoe</h3>
            <ul className="mt-2 space-y-1">
              <li>Decks {rules.numberOfDecks}</li>
              <li>Cards remaining {shoe.cards.length}</li>
              <li>Discard pile {shoe.discard.length}</li>
              <li>Penetration {penetration.toFixed(0)}%</li>
              <li>Cut card at {shoe.cutIndex}</li>
              <li>{shoe.needsReshuffle ? "Needs reshuffle" : "Shoe active"}</li>
            </ul>
          </section>

          <section>
            <h3 className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-hi)]">Rules</h3>
            <ul className="mt-2 space-y-1">
              <li>Blackjack pays {rules.blackjackPayout}</li>
              <li>Double rule {rules.doubleAllowed}</li>
              <li>Double after split {rules.doubleAfterSplit ? "Yes" : "No"}</li>
              <li>Surrender {rules.surrender}</li>
              <li>Min bet {formatCurrency(rules.minBet)}</li>
              <li>Max bet {formatCurrency(rules.maxBet)}</li>
            </ul>
          </section>

          <section>
            <h3 className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-hi)]">Recent Log</h3>
            <ol className="mt-2 max-h-48 space-y-1 overflow-y-auto pr-2 text-[11px]">
              {messageLog.slice(-10).reverse().map((entry, index) => (
                <li key={`${entry}-${index}`} className="rounded border border-[rgba(216,182,76,0.15)] bg-[rgba(10,27,21,0.6)] px-3 py-2">
                  {entry}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </aside>
    </>
  );
};
