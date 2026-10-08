# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Spring Boot 3.2 / Java 17 read-only API (plain SQL, no JPA) + vanilla-JS dashboard in `src/main/resources/static/`. Workshop repo: tickets in `docs/tickets/` win over chat instructions.

## Commands (Windows: `mvnw.cmd`)

```bash
./mvnw test && npm test                              # both suites, no DB needed (npm install once)
docker compose up -d db && ./mvnw spring-boot:run    # http://localhost:8080
SPRING_PROFILES_ACTIVE=demo ./mvnw spring-boot:run   # H2, no Docker
```

## Rules

- Done = both suites green, report both counts.
- pom.xml dependencies are frozen. Any change needs a CHG ticket. No new npm packages either.
- "Today" is pinned to 2026-09-21: use the injected `Clock`, never the system date.
- New `id` in `index.html` → register it in `src/test/javascript/setup/loadApp.js`.

## Read when needed

- `docs/claude/architecture.md`: backend layers, profiles, migrations/seed, frontend `initApp`, MCP
- `docs/claude/testing.md`: single-test commands, Jest harness and fake API
