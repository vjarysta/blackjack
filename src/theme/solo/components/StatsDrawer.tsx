import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameState } from "../../../engine/types";
import { formatCurrency } from "../../../utils/currency";

interface StatsDrawerProps {
  game: GameState;
  open: boolean;
  onClose: () => void;
}

const variants = {
  hidden: { x: "100%" },
  visible: { x: 0 }
};

export const StatsDrawer: React.FC<StatsDrawerProps> = ({ game, open, onClose }) => {
  const totalCards = game.shoe.cards.length + game.shoe.discard.length;
  const penetration = totalCards === 0 ? 0 : (game.shoe.discard.length / totalCards) * 100;
  const recentMessages = game.messageLog.slice(-5).reverse();

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="stats"
          className="solo-stats-drawer fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col gap-4 px-6 py-6 text-[var(--text-hi)]"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={variants}
          transition={{ type: "spring", stiffness: 160, damping: 22 }}
          role="dialog"
          aria-modal="true"
          aria-label="Statistiques"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold uppercase tracking-[var(--caps-track)]">Stats & Sabot</h3>
            <button type="button" className="solo-control solo-secondary h-10 px-3 text-[11px]" onClick={onClose}>
              Fermer
            </button>
          </div>
          <section className="space-y-2 text-sm text-[var(--text-lo)]">
            <h4 className="text-xs uppercase tracking-[var(--caps-track)] text-[var(--text-hi)]">Shoe</h4>
            <p>Cartes restantes : {game.shoe.cards.length}</p>
            <p>Défausse : {game.shoe.discard.length}</p>
            <p>Pénétration : {penetration.toFixed(0)}%</p>
            <p>Cut card : {game.shoe.cutIndex}</p>
          </section>
          <section className="space-y-2 text-sm text-[var(--text-lo)]">
            <h4 className="text-xs uppercase tracking-[var(--caps-track)] text-[var(--text-hi)]">Règles</h4>
            <p>Blackjack {game.rules.blackjackPayout}</p>
            <p>Double : {game.rules.doubleAllowed}</p>
            <p>Surrender : {game.rules.surrender}</p>
            <p>Decks : {game.rules.numberOfDecks}</p>
            <p>Banque sur soft 17 : {game.rules.dealerStandsOnSoft17 ? "Stand" : "Hit"}</p>
          </section>
          <section className="space-y-2 text-sm text-[var(--text-lo)]">
            <h4 className="text-xs uppercase tracking-[var(--caps-track)] text-[var(--text-hi)]">Score</h4>
            <p>Bankroll : {formatCurrency(game.bankroll)}</p>
            <p>Round : {game.roundCount}</p>
            <p>Phase : {game.phase}</p>
          </section>
          <section className="space-y-2 text-sm text-[var(--text-lo)]">
            <h4 className="text-xs uppercase tracking-[var(--caps-track)] text-[var(--text-hi)]">Historique</h4>
            {recentMessages.length === 0 ? (
              <p>Aucun évènement récent.</p>
            ) : (
              <ul className="space-y-1">
                {recentMessages.map((message, index) => (
                  <li key={`${message}-${index}`} className="text-xs uppercase tracking-[0.2em] text-[var(--text-hi)]/80">
                    {message}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
