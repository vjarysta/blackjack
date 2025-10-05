# Blackjack Table (Vite + React + TypeScript)

A single-player, seven-seat Blackjack table implemented with a pure TypeScript engine, React UI, Tailwind CSS styling, shadcn/ui components, and Zustand state management. The engine supports a six-deck shoe, configurable rules, full round flow (bets, insurance, surrender, double, splits, dealer play, payouts), bankroll persistence, and Vitest-powered unit tests.

## Features

- ✅ Rules-driven engine with six-deck shoe, cut card, and crypto-strength shuffle
- ✅ Full round lifecycle: betting, insurance, player actions, dealer play, settlement
- ✅ Comprehensive action validation (hit, stand, double, split, surrender, insurance)
- ✅ Multi-seat play (up to seven simultaneous hands sharing a bankroll)
- ✅ Persistent €100 bankroll stored in `localStorage`
- ✅ Tailwind + shadcn/ui interface with clear totals, flags, and rule badges
- ✅ Extensive unit tests covering totals, splits, doubles, surrender, insurance, payouts, and dealer logic

## Getting Started

```bash
npm install
npm run dev    # start Vite dev server
npm run test   # run Vitest suite
npm run build  # build production bundle
npm run preview
```

Open http://localhost:5173 after `npm run dev` to play.

## Gameplay Overview

1. **Sit and Bet** – choose any of the seven seats, place individual bets (≥ €1).
2. **Deal** – once at least one valid bet is ready, click **Deal** to start the round.
3. **Insurance (if offered)** – when the dealer shows an Ace, each active hand can take up to 50% insurance.
4. **Player Actions** – resolve hands left-to-right, top-to-bottom. Only legal buttons are enabled per the rules and bankroll.
5. **Dealer Play** – the dealer reveals the hole card, draws to 17 (S17 by default), and the engine settles all hands.
6. **Next Round** – adjust seats/bets, reshuffle automatically when the cut card is reached.

### Table Controls

- **Deal** (betting phase) – starts a round when bankroll permits the queued bets.
- **Finish Insurance** (insurance phase) – resolves any pending insurance decisions.
- **Play Dealer** (player actions finished) – manually trigger dealer play if auto-advance is disabled.
- **Next Round** (settlement) – clear hands, reshuffle if required, and return to betting.

## Default Rule Configuration (`src/engine/rules.config.ts`)

| Rule | Default | Notes |
|------|---------|-------|
| Decks | 6 (`NUMBER_OF_DECKS`) | Adjust constant to change deck count |
| Penetration | 0.75 | Shoe reshuffles when the cut card is reached |
| Dealer Hits/Stand | `dealerStandsOnSoft17 = true` | Toggle to play H17 games |
| Blackjack payout | `"3:2"` | Switch to `"6:5"` for alternative tables |
| Insurance | Allowed | Offered when dealer shows Ace |
| Surrender | `"late"` | Change to `"none"` or `"early"` |
| Double | `"anyTwo"` | Use `"9to11"` or `"10to11"` for restrictive rules |
| Double After Split | Enabled | Disable by setting `doubleAfterSplit = false` |
| Split limits | `splitMaxHands = 4`, equal rank only, no resplit aces | Set `resplitAces = true` to allow | 
| Hit on split aces | Disabled | Set `hitOnSplitAces = true` to allow |
| Dealer peek | Enabled | Disable for European no-peek rules |
| Min/Max bet | €1 / unlimited | UI caps by bankroll |
| Currency | EUR | Modify `currency` + `formatCurrency` for other locales |
| Feature flags | Hi-Lo counter + sounds scaffolded off | Future expansion |

> Change any value in `defaultRuleConfig` to instantly update gameplay.

## Engine Structure (`src/engine/`)

- `types.ts` – shared domain types (cards, hands, seats, dealer, shoe, rules, state).
- `rules.config.ts` – default rule configuration + exported `NUMBER_OF_DECKS`.
- `totals.ts` – hand evaluation helpers (hard/soft totals, bust detection).
- `shoe.ts` – deck construction, Fisher–Yates shuffle via `crypto.getRandomValues`, cut-card logic.
- `rules.ts` – legality checks for hit/stand/double/split/surrender/insurance.
- `engine.ts` – state machine functions controlling every phase of the game.

These modules are pure TypeScript (no React). React components interact through the Zustand store which wraps engine calls.

## UI Structure

- `src/store/useGameStore.ts` – Zustand store with hydration (`localStorage`), error handling, and action wrappers.
- `src/components/` – React components for seats, dealer area, control bar, rule badges, and shadcn/ui primitives.
- `src/pages/App.tsx` – top-level page wiring state and layout.
- `src/services/AudioService.ts` – stubbed audio service ready for future SFX.

Tailwind styles live in `src/index.css`, while shadcn/ui-derived primitives reside under `src/components/ui/`.

## Testing

Vitest suites live under `tests/`:

- `totals.test.ts` – soft/hard totals, blackjack detection.
- `payouts.test.ts` – blackjack, standard wins, insurance resolution.
- `actions.test.ts` – double restrictions, double execution, late surrender.
- `splits.test.ts` – equal-rank enforcement, split aces behaviour.
- `dealer.test.ts` – S17 vs H17 behaviour.
- `shoe.test.ts` – deck sizes, reshuffle flags, discard handling.

Run all tests with `npm run test` (uses the jsdom environment).

## Customising the Game

- **Change deck count**: update `NUMBER_OF_DECKS` in `rules.config.ts`.
- **Switch to H17**: set `dealerStandsOnSoft17` to `false`.
- **Use 6:5 payout**: set `blackjackPayout` to `"6:5"`.
- **Disable surrender/insurance**: toggle `surrender` to `"none"`, `allowInsurance` to `false`.
- **Adjust split rules**: tweak `splitMaxHands`, `splitPairsEqualRankOnly`, `resplitAces`, `hitOnSplitAces`.
- **Set table limits**: configure `minBet` / `maxBet`.

After editing, no rebuild is required—Vite hot reloads rule changes.

## Limitations & Roadmap

- ✖️ No multiplayer or networking (single local player controlling all seats)
- ✖️ Simplified card rendering (Unicode glyphs, no SVG artwork)
- ✖️ Desktop-first layout (mobile optimisation pending)
- 🔜 Planned: sound effects via `AudioService`, chip animations, advanced statistics, Hi-Lo counter UI, improved visuals, responsive layout.

Enjoy the game and tweak the rules to match your favourite Blackjack variant!
