# TODO-234: Keep the theme in sync across open tabs

**Type:** Improvement
**Area:** Frontend
**Priority:** Low

Follow-up from the `/code-review` of TODO-231.

## Story

The dashboard stays open all day on the wall screen and on people's second
monitors, often in more than one tab. The theme from TODO-231 is read from
`localStorage` once, at load. Switching the theme in one tab leaves every other
open tab on the old theme until it is refreshed or toggled by hand.

## Acceptance criteria

- **AC-1** When the theme changes in one tab, every other open tab of the dashboard
  switches to the same theme without a refresh (listen for the `storage` event on
  the `ops-theme` key).
- **AC-2** An unknown value written to `ops-theme` is ignored; the tab keeps its
  current theme.

Fences:

- Both test suites stay green (`./mvnw test` and `npm test`).
- Frontend only: no Java changes.
- No new dependencies.

## Why it is not in TODO-231

TODO-231 asks for the choice to survive a refresh (AC-3), not for live sync between
tabs. Keeping that change small kept the review focused.
