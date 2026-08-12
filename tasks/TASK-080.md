# TASK-080

## Status
DONE

## Title
Prompt library / favorites — pin/favorite prompts for quick access

## Note on numbering
Originally briefed as "TASK-077". A concurrently-running 19-domain-expansion
batch had already claimed TASK-077 ("Greeting Card / Personal Stationery
domain") before this task's implementation began (confirmed via
`tasks/TASK_QUEUE.md` and `state/CANONICAL_STATE.md`). Renumbered to
TASK-080 — the next free id against both `tasks/` and `TASK_QUEUE.md` at the
time of this check (TASK-079 was the highest existing id), following the
same renumbering convention already used by TASK-078/TASK-079.

## Mission
Let the user pin/favorite prompts so frequently-reused ones are easy to
find, distinct from `STARTER_PROMPTS` (fixed built-in examples,
`apps/desktop/src/starterPrompts.ts`) and distinct from just scrolling the
full chronological prompt list.

## Scope
- `apps/desktop/src-tauri/src/db.rs`: additive migration on the existing
  `prompts` table — `ALTER TABLE prompts ADD COLUMN is_favorite INTEGER NOT
  NULL DEFAULT 0`, guarded by a `pragma_table_info('prompts')` existence
  check first (SQLite has no `ADD COLUMN IF NOT EXISTS`), so a fresh
  database (via the existing `CREATE TABLE IF NOT EXISTS`) and an upgrading
  existing database both end up with the column, matching the additive,
  non-destructive migration spirit of TASK-018's `settings` table. `Prompt`
  struct gains `is_favorite: bool`.
- `apps/desktop/src-tauri/src/commands.rs`: new `set_favorite(id,
  is_favorite)` Tauri command — direct `UPDATE prompts SET is_favorite =
  ?1 WHERE id = ?2` (not append-only/provenance-tracked, same as
  `rename_prompt`). `create_prompt`/`list_prompts` updated to
  read/return the new column (new prompts default to not-favorited).
- `apps/desktop/src-tauri/src/lib.rs`: `set_favorite` registered in
  `invoke_handler!`.
- `apps/desktop/src/lib/api.ts`: `Prompt` interface gains `is_favorite:
  boolean`; new `setFavorite(id, isFavorite)` wrapper.
- `apps/desktop/src/components/PromptList.tsx`: a star/pin icon button
  (★/☆, `--sv-alert` token when active) per prompt row toggling favorite
  status via `setFavorite`, disabled mid-request and self-healing on
  failure via the existing `onPromptsChanged` refresh. A new "Favorites"
  section rendered above the regular chronological list, reusing the
  existing `CollapsibleSection` component (TASK-012's pattern) —
  `defaultOpen`, `--sv-alert` accent, auto-hides when there are no
  favorites (the component's own `count === 0` guard), still respects the
  active search query. Favorited prompts remain in the chronological list
  below as well — Favorites is a surfaced-to-the-top view, not a removal.
- No `packages/compiler`/`packages/schema` change — this is a straightforward
  boolean-flag feature with no pure-function helper to extract or test.

## Explicitly out of scope
- No new "template" concept beyond favoriting existing saved prompts (per
  the brief).
- No favorite-count limit, no reordering/drag within Favorites.
- Any other item in this batch of 5.

## Acceptance criteria
1. `prompts` table gains an `is_favorite` column via an additive migration
   that is safe on both fresh and pre-existing database files.
2. A new `set_favorite` Tauri command toggles the flag; `create_prompt`/
   `list_prompts` correctly read/write it.
3. A star/pin icon per prompt row in `PromptList.tsx` toggles favorite
   status.
4. A "Favorites" collapsible section renders above the chronological list,
   showing only favorited prompts, hidden entirely when there are none.
5. Favorited prompts still appear in the regular chronological list too.
6. `--sv-*` tokens only, no rounded corners, no new UI component library.
7. `tsc --noEmit` clean on `packages/schema`, `packages/compiler`,
   `apps/desktop`; `vite build` clean on `apps/desktop`; `cargo build` clean
   on `apps/desktop/src-tauri`.
8. `packages/compiler` vitest suite: all pre-existing tests still pass
   unchanged (no new pure-function helper needed for this feature).
9. No stray `&amp;amp;` entity artifacts or hardcoded hex colors outside
   `--sv-*` tokens in new/changed files.

## Verification
- `packages/compiler` vitest: 417/417 passing, unchanged (no new tests —
  no new pure-function helper introduced by this feature).
- `tsc --noEmit` clean on `packages/schema`, `packages/compiler`,
  `apps/desktop`.
- `vite build` clean on `apps/desktop` (pre-existing >500kB single-chunk
  warning only, unrelated to this change).
- `cargo build` clean on `apps/desktop/src-tauri` (`Finished dev profile`).
- Grepped every new/changed file for `&amp;amp;` and hardcoded hex colors:
  zero matches.
