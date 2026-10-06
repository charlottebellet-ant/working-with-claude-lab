# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

- Run: `SPRING_PROFILES_ACTIVE=demo ./mvnw spring-boot:run` (H2, no Docker) or `docker compose up -d db && ./mvnw spring-boot:run` (PostgreSQL); app at http://localhost:8080.
- Test: `./mvnw test` (Java, always on H2) and `npm test` (Jest + jsdom). Single test: `./mvnw test -Dtest=Class#method`, `npx jest -t 'name'`.
- Layout: Spring Boot JSON API in `src/main/java` (plain SQL via JdbcTemplate, Flyway migrations, no JPA); vanilla JS page in `src/main/resources/static` (no build step).
- "Today" is pinned to 2026-09-21: use the injected `Clock` (`ClockConfig`), never `LocalDate.now()`.
- SQL must run on both PostgreSQL and H2 in PostgreSQL mode.
- Seed data comes from `tools/make_seed.py`; the expected numbers in both test suites come from its answer key. Don't hand-edit `V2__seed.sql`.
- Every element id in `index.html` must be listed in `REGISTERED_IDS` in `src/test/javascript/setup/loadApp.js`.
- Colours live only in the CSS variables in `style.css` (themed via `data-theme` on `<html>`); no colours in JS.
- Done means: both suites green with counts reported, and the app restarted.
- pom.xml dependencies are frozen. Any change needs a CHG ticket.
