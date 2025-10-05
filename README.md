# Blackjack Table (Vite + React + TypeScript)

A single-player, rules-driven Blackjack simulator that lets you play up to seven seats at once. The focus is correctness, configurability and transparent gameplay rather than flashy graphics. The engine follows configurable Vegas-style rules, supports late surrender, insurance, doubles, splits (with per-rule limits) and manages a six-deck shoe with realistic penetration logic.

> _Screenshot placeholder — add UI capture here when available._

## Features

- ✅ Six-deck shoe with cryptographically secure shuffle (`crypto.getRandomValues`) and configurable penetration cut card.
- ✅ Centralised rule configuration (`src/engine/rules.config.ts`) controlling S17/H17, DAS, surrender mode, blackjack payout, insurance availability and more.
- ✅ Full round flow: betting, dealing, insurance offer, player decisions per hand, dealer play, settlement and bankroll persistence.
- ✅ Seven independent seats sharing one bankroll (persisted to `localStorage`).
- ✅ Detailed activity log for debugging and learning.
- ✅ Pure TypeScript engine separated from React UI, extensively unit-tested with Vitest.

## Getting started

```bash
npm install
npm run dev
```

- Dev server: <http://localhost:5173>
- Tests: `npm run test`
- Lint: `npm run lint`
- Production build: `npm run build` then `npm run preview`

## Project structure

```
src/
  engine/        // Pure blackjack engine (state machine, rules, totals, shoe)
  store/         // Zustand store bridging engine + React
  components/    // UI components (seats, dealer, controls, badges)
  pages/         // App entry
  services/      // Audio service stub (no-op for future SFX)
  utils/         // Currency formatting helper
tests/           // Vitest unit tests covering engine behaviour
```

## Rule configuration

All configurable rules live in [`src/engine/rules.config.ts`](src/engine/rules.config.ts). The exported `defaultRules` object (typed by `RuleConfig`) controls every aspect of gameplay:

| Setting | Default | Notes |
| --- | --- | --- |
| `dealerStandsOnSoft17` | `true` (S17) | Set to `false` for H17; dealer will hit soft 17 (tested in `dealer.test.ts`). |
| `blackjackPayout` | `"3:2"` | Switch to `"6:5"` for alternate payout. |
| `allowInsurance` | `true` | When dealer shows an Ace, insurance is offered (capped at 50% of base bet). |
| `surrender` | `"late"` | Accepts `"none"`, `"late"`, `"early"`. Late occurs after peek. |
| `doubleAllowed` | `"anyTwo"` | Restrict doubles to `"9to11"` or `"10to11"`. |
| `doubleAfterSplit` | `true` | Disable to forbid doubling split hands. |
| `splitMaxHands` | `4` | Total hands from a single seat (original + resplits). |
| `splitPairsEqualRankOnly` | `true` | When `true`, only identical ranks may split (no 10/J combos). |
| `resplitAces` | `false` | Enable to allow multiple Ace splits. |
| `hitOnSplitAces` | `false` | When `false`, split Aces receive one card each and automatically stand. |
| `dealerPeekOnTenOrAce` | `true` | Peek resolves blackjack before player actions. |
| `numberOfDecks` | `6` | Change this to adjust shoe size (update `NUMBER_OF_DECKS` constant as well). |
| `penetration` | `0.75` | Shoe reshuffles when penetration reached; update alongside UI indicators. |
| `minBet` / `maxBet` | `1` / `Infinity` | UI clamps bet input to bankroll and `maxBet`. |
| `currency` | `"EUR"` | Displayed with `formatCurrency`. |
| `enableHiLoCounter`, `enableSounds` | `false` | Hooks for future features (AudioService currently no-op). |

To adjust the number of decks, update `NUMBER_OF_DECKS` and `defaultRules.numberOfDecks`. All engine modules consume `rules.numberOfDecks`, so the change propagates automatically.

## Gameplay flow

1. **Betting phase** – Sit at any seat (up to 7) and set a wager (≥ €1). Bets are deducted from the shared bankroll when you press **Deal**.
2. **Dealing** – Two cards to every occupied seat, one upcard and one hole card to the dealer.
3. **Insurance** – If enabled and the dealer shows an Ace, each active hand can insure up to 50% of the base bet before continuing.
4. **Player actions** – Seats act left-to-right. Split hands act in order. Buttons enable/disable based on legality (rules + bankroll). Split Aces auto-stand if hitting is disallowed.
5. **Dealer play** – Dealer reveals the hole card and hits per S17/H17 rules until reaching the stopping condition.
6. **Settlement** – Blackjack pays 3:2 (or 6:5), insurance pays 2:1 when appropriate, pushes return the bet, surrender refunds half, busts lose immediately. Bankroll persists to `localStorage`.
7. **Next round** – After settlement click **Next round** to return to betting. Shoe reshuffles automatically when the cut card is met.

## Testing

Vitest suites cover the pure engine logic:

- Totals, soft/hard handling and blackjack detection (`tests/totals.test.ts`).
- Split rules, including resplit restrictions and split-ace behaviour (`tests/splits.test.ts`).
- Double, surrender, insurance and deal sequencing (`tests/actions.test.ts`).
- Dealer play across S17/H17 variants (`tests/dealer.test.ts`).
- Settlements for blackjack, pushes, surrender and insurance (`tests/payouts.test.ts`).
- Shoe size, draw behaviour and reshuffle triggers (`tests/shoe.test.ts`).

Run the full suite with `npm run test`.

## Development notes

- The engine mutates a `GameState` object in-place for clarity and is orchestrated by a Zustand store (`src/store/useGameStore.ts`). All store updates persist bankroll + seat data to `localStorage`.
- The UI uses Tailwind utility classes with lightweight shadcn-style primitives (Button, Card).
- Currency is formatted via a dedicated helper (`src/utils/currency.ts`).
- Audio hooks are ready via `AudioService` but currently no-op.

## Limitations & roadmap

- No animations or sound effects yet.
- Card rendering is text-based (`A♦️ 10♣️`).
- Mobile layout is basic; optimisations and richer visuals are future work.
- Future enhancements: add true hi-lo counter, dealer tips, chip animations, round history exports and actual audio feedback via the existing service stub.

Enjoy refining your Blackjack strategy!
