---
name: release-check
description: Run before opening a PR. Runs both test suites and checks their counts against the baseline (Java 25, Jest 51).
---

# Release check

## Preconditions

- You are at the root of the ops-dashboard repository (`pom.xml` and `package.json`
  are both present).
- `node_modules/` exists. If not, run `npm install` first and say so. Revert any
  `package-lock.json` churn it causes.
- The working tree has the change you intend to ship. Do not stash or discard
  anything.

## Steps

1. Run `./mvnw test` (Windows: `mvnw.cmd test`, with `JAVA_HOME` set). Capture the
   final `Tests run:` summary line (the one after all the per-class lines). If the
   output is quiet, sum the `Tests run:` lines in `target/surefire-reports/*.txt`.
2. Run `npm test`. Capture the line that starts with `Tests:`.
3. Compare both counts with the baseline below.
4. Report using the output format.

## Constraints

- Baseline: **Java 25**, **Jest 51** (the count after TODO-231).
- A count BELOW the baseline is a **FAIL**, even if every test that ran passed.
  Fewer tests means something was deleted or skipped; find out what (e.g.
  `git diff --stat src/test`) and name it in Notes.
- A count above the baseline is fine when the change adds tests. In that case,
  raise the baseline in this file as part of the same change so the next run
  checks against the new number.
- Any failure or error is a **FAIL**.
- Never edit, skip or delete a test to make the check pass.
- Do not open the PR from this skill; it only reports.

## Output format

```
Release check
  Java:  <n> run, <f> failures, <e> errors   (baseline 25)  PASS|FAIL
  Jest:  <n> passed, <t> total               (baseline 51)  PASS|FAIL
  Verdict: READY | NOT READY
  Notes: <"baseline held", or one line per problem>
```
