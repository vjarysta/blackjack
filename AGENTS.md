# Repository Guidelines

## Frontend Architecture
- The UI is written in React + TypeScript and rendered through Vite. Entry code lives in `src/main.tsx`, which mounts the single view exported from `src/pages/App.tsx`.
- Layout components are colocated in `src/components`. Visual-only pieces sit under feature folders (e.g., the felt lives in `src/components/table` and HUD widgets in `src/components/hud`). Shared primitives (`Button`, `Card`) reside in `src/components/ui`.
- Styling is handled with Tailwind utility classes. Prefer class composition over inline styles unless values are dynamic (palette-driven colors, layout calculations, etc.).
- Table geometry is defined in `src/components/table/coords.ts`. Seat anchors, radii, and arc math should stay centralized there so the SVG, overlays, and card layers remain in sync.
- The felt stage is scaled responsively in `TableLayout`. Any change to `BASE_W`/`BASE_H` or padding should be reflected in the layout tests under `tests/e2e/table.spec.ts` so regressions are caught automatically.
- Playing card visuals are rendered via `PlayingCard.tsx` which uses Iconify suit glyphs. Update the palette values in `src/theme/palette.ts` if suit colours or materials change instead of hard-coding new hex codes in the component tree.
- UI seat visibility and layout modes (single-seat vs multi-seat) are resolved in `src/ui/config.ts`. Update that module whenever seat counts change and mirror the behaviour in `CoachToggle`/table overlays.

## Game Engine & State
- Core blackjack rules are in `src/engine`. `engine.ts` owns state transitions, `rules.ts` exposes guard helpers (split/double, etc.), and `totals.ts` performs score calculations.
- State is managed through Zustand in `src/store/useGameStore.ts`. UI components read from this store and dispatch the imperative actions returned by the hook.
- When altering seat counts, shoe math, or rule toggles, update both the engine defaults and any anchor metadata in `coords.ts` so rendering and logic stay aligned.

## UI Behaviour, Utilities & Services
- The basic-strategy coach is powered by `src/utils/basicStrategy.ts`. If you adjust recommendation tables, also review `CoachToggle`, action prompts, and the Vitest coverage in `tests/basicStrategy.test.ts`.
- Common helpers live under `src/utils` (`currency` formatting, Tailwind class concatenation, animation constants). Extend these utilities rather than scattering ad-hoc helpers across components.
- Audio hooks belong in `src/services/AudioService.ts`. Keep it side-effect free until playback is explicitly triggered by the store.

## Testing Strategy
- Unit tests are located in `tests/*.test.ts` and run with Vitest via `npm test`. Keep coverage alongside the engine/UI modules they validate—e.g., shoe behaviour in `tests/shoe.test.ts` and UI-mode logic in `tests/uiConfig.test.ts` when seat handling evolves.
- UI and layout smoke tests live in Playwright specs under `tests/e2e`. Use data-testid attributes that already exist on key nodes (`table-stage`, `bet-spot-*`) to avoid brittle selectors.
- Before sharing work, run `npm test` (Vitest) and `npm run test:e2e` (Playwright). The Playwright suite assumes `npm run dev -- --host` is serving the app locally.
- Run `npm run verify` before opening a PR or handing work back to Codex. It chains linting, unit tests, the production build, and the Playwright e2e suite exactly like CI. If the Playwright browsers are missing locally, bootstrap them first with `npx playwright install --with-deps`.

## Coding Style & Naming Conventions
- Write modern TypeScript with React function components. Follow the existing two-space indentation and favor named exports (`export const Table`). Derive Tailwind class strings through `src/utils/cn.ts` instead of ad hoc concatenation.
- Name state stores with the `useXStore` pattern and component files in PascalCase.
- Never put try/catch blocks around imports and keep error handling declarative; bubbling errors through the Zustand store is preferred.
- When introducing new visual primitives, colocate them with the feature that consumes them (e.g. table-specific cards live in `src/components/table`). Only promote to `components/ui` when they are reused across modules.
- Snapshot-style screenshots go under `artifacts/` when captured via the browser container so they can be attached to PRs.

## Version Control & PRs
- Commit messages follow Conventional Commit prefixes (`feat:`, `fix:`, `refactor:`, `test:`, etc.) with imperative descriptions.
- PR descriptions should summarise the UX or engine change, list technical notes, and capture the commands used for verification (`npm test`, `npm run test:e2e`, `npm run lint`, etc.). Attach updated screenshots or GIFs for any user-facing change to the table or HUD.
