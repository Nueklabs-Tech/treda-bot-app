# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

TredaBot — a self-hosted, visual trading-bot builder on the Deriv WebSocket API (Blockly drag-and-drop strategies, SmartCharts, automated execution).

**This is an Rsbuild + React Router SPA, not a Next.js app.** The `NEXT_PUBLIC_*` environment variable names are a naming carryover from sibling templates; there is no Next.js, no SSR, no `.next`/`out`. Build output is `dist/`.

## Commands

```bash
npm run dev          # rsbuild dev server on http://localhost:4003
npm run build        # production build -> dist/ (runs generate:brand-css first via prebuild)
npm test             # jest (coverage is ON by default, see jest.config.ts)
npm run type-check   # tsc --noEmit
npm run generate:brand-css   # regenerate theme CSS vars from brand.config.json
```

Single test / focused runs (no `lint` script exists — invoke the linters directly):

```bash
npx jest src/utils/__tests__/error-handler.spec.ts
npx jest -t "name of test"
npx jest --coverage=false --watch src/hooks     # faster local loop
npx eslint src --ext .ts,.tsx,.js,.jsx
npx stylelint "src/**/*.scss"
```

### Known baseline

`npm run type-check` currently reports 4 pre-existing errors — all the same missing `transition_ref` prop on `TModalElement` (error-modal, journal-stats-modal, unhandled-error-modal, dashboard/info-panel). Treat these as the baseline; don't count them as regressions from your change.

## Architecture

### Boot chain

`src/main.tsx` (mobx `configure`, brand/document side effects) → `app/AuthWrapper` → `app/App.tsx` → `app/app-root.tsx` → `app/app-content.jsx` → `pages/main`.

`App.tsx` owns two things worth knowing: the React Router config (a single `/` route plus `/preview`), and the **OAuth callback handler** — when `?code=` is present it exchanges the code, fetches accounts via `DerivWSAccountsService`, writes `active_loginid` / `account_type` to localStorage, and re-inits `api_base`. `app-root.tsx` gates rendering on `api_base.init()` (with a 5s timeout fallback).

`pages/main/main.tsx` is the tab shell — Dashboard / Bot Builder / Chart / Tutorials, indexed by `DBOT_TABS` in `src/constants/bot-contents.ts`.

### State: MobX RootStore

`src/stores/root-store.ts` instantiates ~20 domain stores and is provided through `StoreProvider` / `useStore()` in [src/hooks/useStore.tsx](src/hooks/useStore.tsx). Order matters — `chart_store`, `blockly_store`, and `data_collection_store` are constructed last because they depend on the others. `RootStore` also exposes a `core = { ui, client, common }` sub-object; many vendored stores take `(root_store, core)` and reach through `core`, so keep that shape when touching store constructors.

Components consume stores via `observer()` from `mobx-react-lite` + `useStore()`.

### Bot execution pipeline

This is the core of the app and spans several vendored layers under `src/external/bot-skeleton/`:

1. **Blockly workspace** — `scratch/dbot.js` (a `DBot` singleton, passed into `RootStore` as `dbot`). Block definitions live in `scratch/blocks/` (`Binary/` holds the trading blocks: Trade Definition, Before/During/After Purchase, Indicators, Tick Analysis).
2. **Run** — `run_panel_store.onRunButtonClick()` → `dbot.runBot()` → `dbot.generateCode()` emits a JS program built around `BinaryBotPrivate*` hook functions.
3. **Sandbox** — that code string is executed by `services/tradeEngine/utils/interpreter.js`, wrapping `@deriv/js-interpreter`. It patches the interpreter with `takeStateSnapshot`/`restoreStateSnapshot` to support the "time machine" revert-on-error behaviour.
4. **Trade engine** — `services/tradeEngine/` (Proposal, Purchase, OpenContract, Sell, Ticks, Balance) exposed to the sandbox through `services/tradeEngine/Interface/`.
5. **Transport** — `services/api/api-base.ts`, an `api_base` singleton that owns the Deriv WebSocket connection, authorization, subscriptions, active symbols, and reconnection. Nearly everything network-related funnels through it.

Cross-layer communication uses the `globalObserver` event emitter (`utils/observer.js`), not direct calls — e.g. errors are `globalObserver.emit('Error', …)`.

### Vendored code (`src/external/`)

- **`bot-skeleton/`** — the Blockly/trade-engine package, vendored rather than depended on.
- **`deriv-core/`** — a deliberately partial copy of `@deriv/core`: **auth, config, and types only**. React hooks and the WebSocket client are intentionally *not* vendored; the bot uses its own `DerivWSAccountsService` and `api_base`. See the header comment in [src/external/deriv-core/index.ts](src/external/deriv-core/index.ts) before adding to it.
- **`indicators/`** — technical indicator math.
- `src/components/shared/` and `src/components/shared_ui/` are likewise vendored Deriv UI code.

Vendored files carry `// @ts-nocheck — vendored bot code with known upstream type gaps` (~100 files). Keep that header when editing them rather than trying to fully type them. Note both this header and some `[AI]` comments reference an `AGENTS.md` and a `migrate-docs/` directory that **do not exist in this repo** — don't go looking.

### Chart adapter

`src/adapters/smartcharts-champion/` bridges Deriv API shapes to `@deriv-com/smartcharts-champion` (`index.ts` builds the adapter over `transport.ts` + `services.ts`; `getQuotes`, `subscribeQuotes`, `getChartData`). SmartCharts engine assets (wasm/canvaskit) are copied into `dist/js/smartcharts/` by `rsbuild.config.ts` — they are not bundled.

## Conventions & gotchas

**Path aliases must be registered in three places** — adding one to only some of them breaks either the build, the editor, or tests:
- [rsbuild.config.ts](rsbuild.config.ts) `source.alias` (bundler)
- [tsconfig.json](tsconfig.json) `paths` (`@/*` → `./src/*`)
- [jest.config.ts](jest.config.ts) `moduleNameMapper` (per-alias entries)

**Env vars are baked in at build time** via Rsbuild `source.define` (`NEXT_PUBLIC_DERIV_APP_ID`, `NEXT_PUBLIC_DERIV_ENV`, `NEXT_PUBLIC_DERIV_REFERRAL_LINK`, `NEXT_PUBLIC_APP_BUILD`, `GD_*`). Changing `.env` requires a rebuild/restart — there is no runtime config. Only vars listed in `source.define` reach the client. Note the README says to `cp .env.example .env`, but no `.env.example` is checked in; local `.env` / `.env.local` files exist and are gitignored.

**Branding is generated, not hand-written.** `brand.config.json` → `scripts/generate-brand-css.cjs` → rewrites the brand-variable blocks inside `src/components/shared/styles/_themes.scss` (a tracked file). Edit `brand.config.json` and regenerate; don't hand-edit the generated blocks. `main.tsx` additionally applies title, favicon, font, and primary color at runtime from `src/utils/document-branding.ts`.

**Preview mode** — `NEXT_PUBLIC_APP_BUILD=true` switches the build to `out/preview` with a `/bot/preview/` asset prefix, and `src/public-path.ts` / `src/utils/is-preview-mode.ts` set the webpack public path and router basename accordingly. Any new asset-path logic must go through `getUrlBase()` / `isPreviewMode()`.

**Style** — Prettier: 4-space indent, 120 cols, single quotes (incl. JSX), `arrowParens: avoid`. ESLint enforces `simple-import-sort` with a custom group order (`public-path` → `react` → lowercase packages → `@` packages → `Components`/`Constants`/`Utils`/`Types`/`Stores` → relative → styles → side effects); let the fixer sort imports rather than ordering them by hand.

**TypeScript is non-strict** (`strict: false`, `allowJs: true`) and the codebase mixes `.js`/`.jsx`/`.ts`/`.tsx` — new code should be TS, but don't expect strict-mode guarantees from neighbours.

**Deploy** — [vercel.json](vercel.json) builds to `dist/` with an SPA rewrite of all paths to `/index.html`. Any static host serving `dist/` with that rewrite works.
