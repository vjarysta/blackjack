import React from "react";
import { Table } from "../components/Table";
import { ControlsBar } from "../components/ControlsBar";
import { RuleBadges } from "../components/RuleBadges";
import { useGameStore } from "../store/useGameStore";
import { formatCurrency } from "../utils/currency";

function penetrationText(remaining: number, total: number): string {
  if (total === 0) return "0%";
  const used = total - remaining;
  return `${((used / total) * 100).toFixed(1)}% used`;
}

export const App: React.FC = () => {
  const { game } = useGameStore();
  const totalCards = game.rules.numberOfDecks * 52;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
        <header className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <div>
              <div className="text-lg font-semibold">Bankroll {formatCurrency(game.bankroll, game.rules.currency)}</div>
              <div className="text-xs text-slate-400">
                Round {game.roundCount + 1} · Phase: {game.phase}
              </div>
            </div>
            <div className="text-xs text-slate-400">
              Shoe: {game.shoe.cards.length} / {totalCards} cards · {penetrationText(game.shoe.cards.length, totalCards)}
            </div>
          </div>
          <RuleBadges />
        </header>
        <ControlsBar />
        <main className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Table />
          <aside className="flex flex-col gap-4">
            <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Activity</h2>
              <ul className="mt-2 space-y-1 text-xs text-slate-400">
                {game.messageLog.length === 0 && <li>No activity yet.</li>}
                {game.messageLog.map((message, index) => (
                  <li key={`${message}-${index}`}>{message}</li>
                ))}
              </ul>
            </section>
            <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-400">
              <p>
                Bankroll and seat preferences persist in your browser. Reload to continue where you left off. Bets are shared across
                seats and deducted when dealing.
              </p>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default App;
