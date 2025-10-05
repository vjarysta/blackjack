# Repository Guidelines

## Project Structure & Module Organization
Client code lives in `src`, with stateful game rules under `src/engine` and UI widgets in `src/components`. Route-level views reside in `src/pages`, shared stores in `src/store`, and helpers such as `formatCurrency` in `src/utils`. Keep Vitest suites in `tests/`, mirroring engine modules (e.g., `tests/payouts.test.ts`). Static entry points (`index.html`, `tailwind.config.ts`) configure Vite and Tailwind.

## Build, Test, and Development Commands
Use `npm install` once to hydrate dependencies. `npm run dev` launches Vite with hot reload; prefer it while iterating on UI. Ship-ready bundles come from `npm run build`, which type-checks via `tsc -b` before bundling. `npm run preview` serves the build artifact for smoke-testing. `npm run lint` runs ESLint across `.ts/.tsx`, and `npm test` executes the Vitest suite headlessly.

## Coding Style & Naming Conventions
Write modern TypeScript with React function components. Follow the existing two-space indentation and favor named exports (`export const Table`). Derive Tailwind class strings through `src/utils/cn.ts` instead of ad hoc concatenation. ESLint (see `.eslintrc.cjs`) and Prettier alignment catch most formatting issues—run `npm run lint` or `npx prettier --check "src/**/*.ts*"` before pushing. Name state stores with the `useXStore` pattern and component files in PascalCase.

## Testing Guidelines
Vitest powers logic tests; add new cases beside related engine modules (e.g., `shoe` behaviors extend `tests/shoe.test.ts`). Use Testing Library for React interaction coverage when adding UI. Prefer descriptive test names like `"returns blackjack payout for natural"`. Keep branch logic covered, and update tests whenever the engine contract changes.

## Commit & Pull Request Guidelines
Follow the existing Conventional Commit style (`feat:`, `fix:`, `refactor:`) with imperative phrasing. Each PR should include: problem summary, implementation notes, test evidence (`npm test`, `npm run lint`), and UI screenshots or GIFs when visuals shift. Reference related issues using `Closes #id` so automation can link context.
