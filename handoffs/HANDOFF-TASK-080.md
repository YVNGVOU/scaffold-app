# HANDOFF-TASK-080

## Numbering note
Briefed as "TASK-077". A concurrently-running 19-domain-expansion batch had
already claimed TASK-077 ("Greeting Card / Personal Stationery" domain)
before this task's implementation began. Renumbered to TASK-080 — the next
free id, since TASK-079 (Batch Compile) was the highest id landed at the
time of this check.

## Mission
Let the user pin/favorite prompts so frequently-reused ones are easy to
find, distinct from `STARTER_PROMPTS` (fixed built-in examples) and from
just scrolling the full chronological prompt list.

## Scope
- `apps/desktop/src-tauri/src/db.rs`: additive migration on the pre-existing
  `prompts` table — `ALTER TABLE prompts ADD COLUMN is_favorite INTEGER NOT
  NULL DEFAULT 0`, run only when `pragma_table_info('prompts')` doesn't
  already report the column (SQLite has no `ADD COLUMN IF NOT EXISTS`), so
  both a brand-new database (created via the existing `CREATE TABLE IF NOT
  EXISTS`, which already includes the column in its literal text) and an
  upgrading pre-existing database end up with it — no data loss, no
  destructive rewrite. `Prompt` struct gains `is_favorite: bool`.
- `apps/desktop/src-tauri/src/commands.rs`: new `set_favorite(id,
  is_favorite: bool)` Tauri command — a direct `UPDATE prompts SET
  is_favorite = ?1 WHERE id = ?2` (not a read-then-toggle, so frontend
  optimistic state and backend state can't disagree about direction); same
  non-append-only-is-correct reasoning already documented for
  `rename_prompt`. `create_prompt` returns `is_favorite: false` for new
  rows; `list_prompts`'s `SELECT`/row-mapping extended to include the
  column (`row.get::<_, i64>(4)? != 0`).
- `apps/desktop/src-tauri/src/lib.rs`: `commands::set_favorite` added to
  `invoke_handler!`.
- `apps/desktop/src/lib/api.ts`: `Prompt` interface gains `is_favorite:
  boolean`; new `setFavorite(id, isFavorite): Promise<void>` wrapper around
  the new command.
- `apps/desktop/src/components/PromptList.tsx`:
  - `PromptRow` gains a star/pin toggle button (★ favorited / ☆ not,
    `--sv-alert` token when active, `--sv-ink-soft` otherwise) placed first
    in the row's action-button group, before Rename/Duplicate/Delete.
    Clicking calls `setFavorite(p.id, !p.is_favorite)` then
    `onChanged()` (the existing prompt-list refresh callback) so a failed
    toggle self-heals on next refresh rather than leaving a permanently
    wrong-looking row; a local `favoriteBusy` flag disables the button and
    prevents double-submit mid-request.
  - New `favorites` memo (`filtered.filter(p => p.is_favorite)`, still
    respecting the active search query) rendered in a new "Favorites"
    section above the chronological list, using the existing
    `CollapsibleSection` component from TASK-012 (`--sv-alert` accent,
    default open, auto-hides via the component's own `count === 0` guard
    when nothing is favorited). Favorited prompts also remain visible in
    the chronological list below — Favorites is a surfaced-to-the-top view,
    not a removal/filter-out.
- No `packages/compiler`/`packages/schema` change — a boolean-flag
  pin/unpin feature has no pure-function logic worth extracting into the
  compiler package; nothing to unit test there beyond what `tsc`/build
  already cover.

## Acceptance criteria
Same as `tasks/TASK-080.md`'s Acceptance criteria section — mirrored there
in full; not duplicated twice here.

## Explicitly out of scope
- No new "template" concept beyond favoriting existing saved prompts (per
  the brief).
- No favorite-count limit, no manual reordering/drag within Favorites.
- Items 1, 2, 4, 5 of this 5-item batch.

## Verification (real output)
- `packages/compiler` vitest: **417/417 passing**, unchanged from before
  this task (no new pure-function helper introduced, so no new tests).
- `tsc --noEmit`: clean on `packages/schema`, `packages/compiler`,
  `apps/desktop`.
- `vite build` (apps/desktop): clean build, only the pre-existing >500kB
  single-chunk size warning (unrelated to this change).
- `cargo build` (apps/desktop/src-tauri): clean — `Finished dev profile
  [unoptimized + debuginfo] target(s) in 36.37s`.
- Grep of every new/changed file for `&amp;amp;` entity artifacts and
  hardcoded hex colors outside `--sv-*` tokens: zero matches.

## Known limitation
No screenshot/display tool available in this agent session to visually
confirm the star icon's rendered appearance or the Favorites section's
layout in a live running window — same accepted headless-environment
limitation as prior UI tasks (TASK-012, TASK-015, TASK-017, TASK-018).
Confirmed instead via full source read of the new/changed component plus
`tsc`/`vite build`/`cargo build` passing.

## Files changed
- `apps/desktop/src-tauri/src/db.rs`
- `apps/desktop/src-tauri/src/commands.rs`
- `apps/desktop/src-tauri/src/lib.rs`
- `apps/desktop/src/lib/api.ts`
- `apps/desktop/src/components/PromptList.tsx`
- `tasks/TASK-080.md` (new)
- `handoffs/HANDOFF-TASK-080.md` (new, this file)
- `tasks/TASK_QUEUE.md` (updated)
- `state/CANONICAL_STATE.md` (updated)
