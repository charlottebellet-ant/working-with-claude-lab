# TODO-234: Theme polish: no flash on reload, sync across open tabs

**Type:** Improvement
**Area:** Frontend
**Priority:** Low

## Story

TODO-231 added the light/dark toggle, dark by default, with the choice kept in
`localStorage` under `ops-dashboard-theme`. Two rough edges were found in code
review and left out on purpose to keep that ticket small:

1. **A dark flash for people who picked light.** `index.html` ships
   `data-theme="dark"`, and `app.js` (loaded at the end of `<body>`) applies the
   stored choice on `DOMContentLoaded`. A browser can paint the dark page before
   that, so every reload of a light dashboard flickers dark, then light.
2. **Open tabs don't follow each other.** The dashboard stays open all day on the
   wall screen and on people's second monitors. Switching the theme in one tab
   leaves the others on the old theme until they are reloaded, and then they pick
   up whichever tab wrote last, which can look like the choice was lost.

Why this was not done in TODO-231: the anti-flash fix needs a small inline script in
`<head>` that repeats the storage key and the "light only if exactly `light`, else
dark" rule from `app.js`, so the design needs a decision (repeat it, or move the
theme logic into a separate script in `<head>`). Tab sync was not in the TODO-231
acceptance criteria.

## Acceptance criteria

- **AC-1** With `light` stored, the page shows the light theme from its first paint:
  `data-theme` is set before the stylesheet-styled body renders. The rule for
  reading the stored value (missing or unknown means dark) is defined in one place
  only.
- **AC-2** Switching the theme in one open dashboard updates every other open
  dashboard in the same browser (via the `storage` event), including the button
  label.
- **AC-3** The TODO-231 behaviour is unchanged: dark by default, OS setting ignored,
  choice persisted.

Fences:

- Both test suites stay green (`./mvnw test` and `npm test`).
- Frontend only: no Java changes.
- No new dependencies.

## Open questions

- If the head script grows, should it live in its own file (e.g. `theme.js`) loaded
  without `defer` in `<head>`? That keeps the logic in one place but adds a second
  script to the page.
- The test harness (`src/test/javascript/setup/loadApp.js`) only mounts `<body>`;
  testing AC-1 may need it to run the head script too.

## Definition of done

- Run `./mvnw test` and `npm test` and report both counts.
- New element ids are registered in `src/test/javascript/setup/loadApp.js`.
- Restart the app so the reviewer can click it.
