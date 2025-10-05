# Blackjack Table (Vite + React + TypeScript)

A single-player, seven-seat blackjack experience built with Vite, React, Tailwind CSS, shadcn/ui components, and a deterministic TypeScript engine. The game emulates a Las Vegas shoe table with full support for insurance, surrender, doubling, splitting (up to seven seats and four hands per seat), and dealer peek rules. Bankroll and preferred bets persist between sessions via `localStorage`.

> _Cards use simple text rendering today (e.g. `A♦`), making the UI intentionally functional rather than flashy. The architecture is designed so richer visuals, audio, or animations can be added later._

## Features

- Rules-driven engine with configurable toggles (S17/H17, DAS, surrender modes, blackjack payout, penetration, and more).
- Six-deck shoe with cryptographically strong shuffling (`crypto.getRandomValues`) and cut card handling.
- Seven simultaneous seats with independent bets and decisions.
- Full flow for insurance, surrender, double, and split actions (including split aces restrictions and bankroll validation).
- Dealer peek logic, late surrender, correct blackjack/push/bust/insurance payouts, and reshuffle notices.
- Zustand store orchestrating engine actions with persistence for bankroll and base bets.
- Tailwind + shadcn/ui powered interface with rule badges, table layout, and dynamic action controls.
- Vitest unit tests covering totals, payouts, insurance, surrender, double-downs, splits, and dealer behaviour.
- ESLint + Prettier configuration enforcing strict TypeScript (no `any`).
- Audio service stub ready for future sound effects.

## Getting Started

```bash
npm install
npm run dev
```

Open the dev server (default `http://localhost:5173`) to play. Seats can be toggled during the betting phase. Set individual bets, then click **Deal** to begin a round. During dealer upcard Ace, an insurance control appears for each eligible hand; otherwise, only legal actions for the active hand are enabled. After all hands resolve, click **Play Dealer** and then **Next Round** when prompted.

For local verification you can additionally run:

```bash
npm run lint
npm run test -- --run
```

Both commands are fast and help ensure the engine behaviour stays deterministic after making changes.

### Additional scripts

| Command | Description |
| --- | --- |
| `npm run build` | Production build (type-check + Vite build). |
| `npm run preview` | Preview the production build locally. |
| `npm run test` | Execute Vitest unit tests. |
| `npm run lint` | Run ESLint over the codebase. |

## Rules & Configuration

Core rule toggles live in [`src/engine/rules.config.ts`](src/engine/rules.config.ts). Defaults:

- **Dealer** stands on soft 17 (`dealerStandsOnSoft17: true`).
- **Blackjack payout** `3:2` (`blackjackPayout: "3:2"`). Switch to `"6:5"` to tighten payouts.
- **Insurance** allowed when dealer shows Ace (`allowInsurance: true`).
- **Surrender**: `"late"` (after peek) with options `"none" | "late" | "early"`.
- **Double rules**: `"anyTwo"` by default, can limit to `"9to11"` or `"10to11"`.
- **Double after split** enabled (`doubleAfterSplit: true`).
- **Split**: up to four hands, equal-rank only, no resplit aces, no hits after split aces.
- **Dealer peek** enabled on Ten/Ace (`dealerPeekOnTenOrAce: true`).
- **Shoe**: six decks (`NUMBER_OF_DECKS = 6`) with 75% penetration.
- **Bet limits**: minimum €1, maximum unlimited (UI restricts to bankroll).
- **Currency**: `EUR` (changeable via `currency` in rules config).
- **Feature flags**: `enableHiLoCounter` and `enableSounds` are placeholders.

Edit `defaultRules` or provide overrides to `initGame` in custom builds to experiment with rule variations. The UI automatically reflects S17/H17, payout, surrender, DAS, and peek statuses through badges.

## Project Structure

```
├── index.html
├── package.json
├── src
│   ├── engine
│   │   ├── engine.ts          # State machine and actions
│   │   ├── rules.ts           # Action guards
│   │   ├── rules.config.ts    # Default rule toggles
│   │   ├── shoe.ts            # Multi-deck shoe management
│   │   ├── totals.ts          # Hand total helpers
│   │   └── types.ts           # Shared types/constants
│   ├── store
│   │   └── useGameStore.ts    # Zustand store + persistence
│   ├── components             # Table, seats, dealer, controls, UI primitives
│   ├── services
│   │   └── AudioService.ts    # No-op audio stub
│   ├── utils
│   │   └── currency.ts        # Currency formatter
│   ├── pages
│   │   └── App.tsx            # Main page
│   └── main.tsx               # Entry point
├── tests                      # Vitest suites
└── tailwind.config.ts         # Tailwind theme configuration
```

## Changing Deck Counts & Rules

- Update `NUMBER_OF_DECKS` in [`types.ts`](src/engine/types.ts) to alter the base shoe size. The `defaultRules.numberOfDecks` mirrors this value, so adjust both for clarity.
- Modify `defaultRules` to tweak S17/H17, blackjack payout, surrender mode, DAS, resplitting, or penetration. The engine consumes these options at runtime, so state resets will pick up new values immediately.

## Testing

Run `npm run test` to execute the Vitest suite. Key coverage areas include:

- Hand totals (soft/hard), blackjack detection, and busts.
- Dealer play (S17 vs H17), insurance payouts, surrender resolution.
- Double-down validation, split restrictions, and hit-on-split-aces enforcement.
- Payout calculations for blackjack, wins, pushes, and busts.
- Shoe construction, shuffle integrity (via crypto), and reshuffle triggers.

## Limitations & Roadmap

- **Visual polish:** Cards are text-based; no chip animations or card flipping yet.
- **Audio:** Placeholder service only—no sound effects.
- **Multiplayer/networking:** Not implemented; the experience is single-player with multiple seats.
- **Mobile layout:** Desktop-first layout; responsive tweaks are minimal.

Planned enhancements could include richer card art, chip stack animations, autoplay/strategy helpers, hi-lo counter UI, full audio feedback, and exportable hand histories.

## Screenshots

_(Screenshot capture can be added when a browser preview is available.)_
