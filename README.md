# Blackjack Table Trainer

A single-player, multi-seat blackjack experience built with **Vite**, **React**, and **TypeScript**. The project focuses on rule correctness and clarity, exposing a seven-seat table where one player can manage multiple bets per round. The engine models a Vegas-style game, including insurance, late surrender, doubles, splits, and shoe penetration using a six-deck shoe by default.

> _Screenshot placeholder — capture to be added in future iterations._

## Features

- **Seven seat layout** with independent bets, actions, and hand tracking per seat.
- **Persistent bankroll** stored in `localStorage` (starting at €100.00).
- Fully rules-driven **TypeScript engine** separated from the UI, with configuration in a single place.
- **Dealer peek, insurance, surrender, double, and split** logic implemented according to Vegas conventions.
- **Shoe management** using crypto-strength Fisher–Yates shuffling, cut-card penetration, and discard piles.
- **Comprehensive message log** for round summaries and debugging.
- **shadcn/ui + Tailwind CSS** components for consistent styling.
- **Zustand** store for state orchestration and persistence.
- **Vitest** unit tests for totals, payouts, insurance, splits, dealer behaviour, and shoe handling.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173 to view the table. The `Controls` bar lists the current phase, bankroll, and enables round transitions.

### Additional scripts

| Command | Description |
| --- | --- |
| `npm run build` | Create a production bundle. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint with the configured strict TypeScript rules. |
| `npm run test` | Execute the Vitest unit suite (engine + rules). |

## Rules configuration

All rules live in [`src/engine/rules.config.ts`](src/engine/rules.config.ts). The exported `defaultRules` object drives the entire engine. Key options:

- `dealerStandsOnSoft17`: `true` for S17, `false` for H17.
- `blackjackPayout`: `'3:2'` (default) or `'6:5'`.
- `allowInsurance`: toggle insurance offers when the dealer shows an Ace.
- `surrender`: `'none' | 'late' | 'early'`; defaults to `'late'`.
- `doubleAllowed`: `'anyTwo' | '9to11' | '10to11'`.
- `doubleAfterSplit`: allow/dismiss DAS.
- `splitMaxHands`: total hands per original bet (default 4).
- `splitPairsEqualRankOnly`: only split identical ranks when `true`.
- `resplitAces`, `hitOnSplitAces`: control Ace-specific behaviour.
- `dealerPeekOnTenOrAce`: enable hole-card peek on Ten/Ace.
- `numberOfDecks`: defaults to `NUMBER_OF_DECKS` (6). Change this constant and rebuild to adjust shoe size.
- `penetration`: 0–1, fraction of shoe dealt before reshuffle.
- `minBet` / `maxBet`: table limits (max defaults to `Infinity`; UI caps at bankroll).
- `currency`: display currency for bankroll and payouts.
- `enableHiLoCounter`, `enableSounds`: forward-looking feature flags (stubs only).

### Tweaking deck count

`NUMBER_OF_DECKS` is exported alongside `defaultRules`. Change its value in [`rules.config.ts`](src/engine/rules.config.ts) and restart the dev server; the shoe creation helpers consume the constant during `initGame`.

## Engine architecture

The rules engine lives under [`src/engine`](src/engine). Key modules:

- `types.ts`: shared card/hand/seat interfaces and `GameState` definition.
- `rules.config.ts`: rule constants, defaults, and helper constants.
- `shoe.ts`: deck generation, Fisher–Yates shuffle using `crypto.getRandomValues`, draw/discard helpers.
- `totals.ts`: soft/hard total computation utilities.
- `rules.ts`: action guards (`canHit`, `canSplit`, `canDouble`, etc.) that respect the rule config and hand state.
- `engine.ts`: deterministic state transitions (`deal`, `playerHit`, `playerSplit`, `playDealer`, `settleAllHands`, etc.). Functions return new `GameState` instances using `immer` to keep mutations predictable.

The React layer never mutates state directly; it calls these pure functions through the Zustand store located in [`src/store/useGameStore.ts`](src/store/useGameStore.ts).

## UI structure

- `src/pages/App.tsx`: top-level layout, header, message log, and table wiring.
- `src/components/Table.tsx`: table composition, dealer area, and seat cards.
- `SeatCard.tsx`: per-seat UI for betting, insurance, and player actions. Uses shadcn button/card/input primitives.
- `DealerArea.tsx`: renders dealer cards, totals, and shoe statistics.
- `ControlsBar.tsx`: global action buttons (Deal, Skip Insurance, Next Round).
- `RuleBadges.tsx`: quick rule summary chips.
- `services/AudioService.ts`: future-facing stub for sound effects.

Styling uses Tailwind CSS with theme tokens matching shadcn defaults. Utility helpers live in `src/utils` (currency formatter and Tailwind class merger).

## Testing

The Vitest suite covers core mechanics:

- `tests/totals.test.ts`: soft/hard totals, bust detection, multiple Aces.
- `tests/dealer.test.ts`: S17/H17 behaviour, ensuring dealer hits or stands per rule.
- `tests/splits.test.ts`: pair splitting constraints, split aces, resplit rules.
- `tests/payouts.test.ts`: blackjack payouts, pushes, surrender, double-down, insurance and even-money resolution.
- `tests/shoe.test.ts`: deck creation, penetration flags, reshuffle flow.

Run with `npm run test`. The tests run in a Node environment with no DOM dependencies.

## Playing the game

1. Sit at any combination of seats and enter wagers (minimum €1, capped by bankroll).
2. Press **Deal** once at least one seat has a valid bet.
3. During insurance, either take up to 50% coverage or skip.
4. Use action buttons (Hit, Stand, Double, Split, Surrender) on the highlighted seat/hand. Illegal actions are disabled.
5. Dealer resolves automatically when all seats finish. Results appear in the message log; hit **Next round** to reset betting.
6. Bankroll and seat occupancy persist between sessions.

## Limitations & roadmap

- No sound effects yet (AudioService is a stub).
- Visual design remains minimal — future work includes improved layout, chip stacks, and animations.
- Mobile layout needs optimisation.
- Strategy aids (e.g. Hi-Lo counter, hints) are not yet implemented.
- Screenshot automation pending.

Contributions and variations (rule tweaks, UI polish, accessibility improvements) are welcome!
