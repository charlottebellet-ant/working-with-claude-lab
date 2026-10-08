# Architecture reference

## Backend (`com.marlowefinch.ops`, one flat package)

Controllers → repositories → plain SQL via `JdbcTemplate`. No JPA, no service layer. Responses are records (`Kpis`, `CarrierOnTime`, `LateDelivery`, `TicketCategoryCount`, `Vendor`). All endpoints are `GET` under `/api` (table in the root README).

- **Pinned clock**: today = `2026-09-21` (`ops.today` → `Clock` bean in `ClockConfig`). Seed data, default ranges and tests all depend on it.
- **Date ranges**: controllers pass optional `from`/`to` strings to `DateRange.resolve(from, to, clock)` (default: last 30 days). No validation on purpose (bad date → 500, `from > to` → empty); that is TODO-232.
- **Schema & data**: Flyway `db/migration/V1__schema.sql`, `V2__seed.sql`. The seed, `docs/data/deliveries-last-30-days.csv` and the git-ignored answer key come from `tools/make_seed.py`: regenerate, don't hand-edit. Schema changes go in a new `V3__…`.
- **Profiles**: `postgres` (default; `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD`) and `demo` (H2, PostgreSQL mode). Java tests all use `@ActiveProfiles("demo")`, so SQL must run on both.

## Frontend (`src/main/resources/static/`)

`app.js` is one IIFE. All behavior lives in `initApp(document, fetchImpl)` → `{ ready, state, load, selectPreset, api }`; pure helpers (`formatRate`, `formatMoney`, `barWidths`, `applyPreset`, `daysUntil`) are exported too. Browser: `window.OpsDashboard` on `DOMContentLoaded`. Jest: `module.exports`. Keep both exports. Startup reads `today` from `/api/health`, then loads the 30-day range. Charts are hand-built inline SVG.

## Local data

`.mcp.json` registers a read-only `postgres` MCP server on `postgresql://ops:ops@localhost:5432/ops` (needs `docker compose up -d db`). Without Docker, use `docs/data/deliveries-last-30-days.csv`.
