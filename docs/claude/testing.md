# Testing reference

```bash
./mvnw test -Dtest=DashboardControllerTest          # one Java class (append #method for one method)
npx jest src/test/javascript/render.test.js         # one Jest file; add -t "name" for one test
```

- **Java** (25 tests): JUnit 5, `@SpringBootTest` + `@ActiveProfiles("demo")` on H2, MockMvc for controllers. No database needed.
- **Frontend** (45 tests): Jest + jsdom, files `src/test/javascript/*.test.js`.
- **Harness** `src/test/javascript/setup/loadApp.js`: `loadApp(overrides)` puts `index.html`'s body into jsdom, swaps `fetch` for an in-memory fake of every `/api` endpoint (`FIXTURES`; `overrides.failing` makes paths answer 500) and awaits `app.ready`.
  - New element `id` in `index.html` → add it to `REGISTERED_IDS`, or `harness.test.js` fails.
  - New endpoint called by the frontend → add a case to `createFakeApi`.
