# HANDOFF-TASK-020

## Mission
For a given prompt, let the user browse its past compiles (already append-only in SQLite, `list_compiles`) and see a simple structural diff between any two selected versions of the `CompiledPrompt`.

## Scope
- `packages/compiler/src/formatDiff.ts`: pure `formatDiff(a: CompiledPrompt, b: CompiledPrompt): CompiledPromptDiff` helper, exported from `packages/compiler/src/index.ts`.
  - Per requirement category (`userRequirements`, `nonNegotiables`, `preferences`, `constraints`, `assumptions`, `functionalRequirements`): items in `b` not matched in `a` are `added`; items in `a` not matched in `b` are `removed`. Matching is by exact `text` equality (case-sensitive, matches the schema's plain-string `RequirementItem.text` field) — this is a set-of-texts diff per category, not a positional/index diff, so reordering alone produces no false added/removed entries.
  - Top-level scalar fields (`mission`, `context`, `objective`, `role`, `outputFormat`): a field is reported as `changed` in `fieldChanges` when `a`'s and `b`'s values differ (including undefined-vs-present).
  - `architecture` notes: matched by `component` name; `added`/`removed`/`changed` (changed = same `component`, different `note`/`dependsOn`/`source`).
  - Pure, zero mutation of `a`/`b` (no `.sort()` on the input arrays — copy before sorting if needed), zero AI calls, deterministic.
- `apps/desktop/src/components/VersionHistory.tsx` (new): given a prompt id, calls `listCompiles`, renders a dropdown/list of versions (mode + timestamp), lets the user pick two versions ("from"/"to"), and renders `formatDiff`'s structured result — added (green-ish `--sv-*` token), removed (burgundy `--sv-alert`/`--sv-burgundy`), changed sections per category, plus changed top-level fields and architecture notes.
- Wire an entry point into the existing UI to open this panel for the active prompt (e.g. a "History" button near `CompiledOutput`'s `ExportToolbar`, or inside `PromptList.tsx`'s row). Read `theme.css` first for the exact token names available before styling.

## Acceptance criteria
1. `formatDiff` lives in `packages/compiler`, is a pure function with no side effects, has unit tests covering: added items, removed items, unchanged-items-not-reported, top-level field changes, architecture note added/removed/changed, and a no-mutation check on both inputs.
2. UI can list all saved compiles for a prompt (reusing `listCompiles`, no new backend command needed unless something is missing from `api.ts`).
3. UI can pick two versions and render the diff using only `formatDiff`'s output (no UI-side re-implementation of diffing logic).
4. Zero AI API calls anywhere in the new code.
5. Dark SINVAUX/Scaffold visual language, `--sv-*` tokens only, no rounded corners, no new UI component libraries.
6. `packages/compiler` vitest suite: 123 pre-existing tests still pass, plus new `formatDiff` tests, zero regressions.
7. `tsc --noEmit` clean on `packages/schema`, `packages/compiler`, `apps/desktop`; `vite build` clean.
8. No stray `&amp;amp;` entity artifacts or hardcoded hex colors outside `--sv-*` tokens in new/changed files.
9. `apps/desktop/src-tauri/scaffold-updater.key` and `Scaffold-Release/`/`bundle/` untouched.

## Explicitly out of scope
See `tasks/TASK-020.md`.
