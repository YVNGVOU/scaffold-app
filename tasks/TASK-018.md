# TASK-018

- Timestamp: 2026-08-11
- Original request: "no the app is very empty no settings no nothing it should be a real full app" — user feedback after seeing the running app. Clarified via multi-select question: all four of Settings panel, prompt management, export options, and keyboard shortcuts wanted.
- Priority: P1
- Dependencies: TASK-001 through TASK-017 (all done).
- Status: ACTIVE
- Classification: feature

## Scope — four sub-features in one cohesive task

### A. Settings panel
1. A dedicated Settings view/modal, opened via a small gear icon or "Settings" button (implementer's judgment on placement — e.g. near the SINVAUX credit/UpdateChecker area in the left nav footer, or a persistent icon in a corner). Consistent with the dark SINVAUX/Scaffold visual language (`--sv-*` tokens only, no rounded corners, editorial typography, hairline dividers — no native browser `<dialog>` styling defaults, style it to match).
2. Settings to include:
   - Default compile mode (ARCHITECT/QUICK/MASTER) — persisted, used as the initial `mode` state instead of always defaulting to `architect`.
   - MASTER mode's `maxRounds` — currently hardcoded to 2 in `runMasterPipeline`'s default; expose as a user-configurable number (reasonable bounds, e.g. 1-5) passed through to the `runMasterPipeline(rawInput, { maxRounds })` call in `App.tsx`.
   - About section: app name "Scaffold", version (read from `tauri.conf.json`'s version — check how to access this from the frontend, likely via a Tauri command or the `@tauri-apps/api/app` package's `getVersion()`), SINVAUX company credit, link to the GitHub repo (`https://github.com/YVNGVOU/scaffold-app`) opened via Tauri's opener plugin (already a dependency, used by the updater flow) or a plain `<a>` with `target="_blank"` if that's simpler and works in the Tauri webview.
   - Move or duplicate the existing "Check for Updates" button (`UpdateChecker.tsx`, TASK-015) into Settings — implementer's judgment on whether to move it entirely or just add a link/duplicate; don't break the existing update-check functionality either way.
3. Settings persistence: add a small `settings` key-value table to SQLite (mirroring the existing `prompts`/`compiles` table pattern in `db.rs`/`commands.rs` — `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`), with `get_setting`/`set_setting` Tauri commands. Do not introduce a second, different persistence mechanism (e.g. don't add `tauri-plugin-store` alongside the existing hand-rolled `rusqlite` approach — stay consistent with TASK-001's established pattern of direct `rusqlite` + custom commands).

### B. Prompt management
4. **Rename**: an inline rename action on each prompt in the left nav list (`PromptList.tsx`) — click-to-edit the title, or a small edit icon. Requires a new `rename_prompt(id, newTitle)` Tauri command updating the `prompts` table's `title` column (SQLite `UPDATE`, not an append — the `prompts` table is not append-only like `compiles`, updating a title in place is correct here since it's not part of the provenance-tracked compile history).
5. **Delete**: a delete action per prompt (with a confirm step — e.g. a second click/hold, or a simple `window.confirm()`, since Tauri's webview supports it) — requires a new `delete_prompt(id)` Tauri command that deletes the prompt row AND its associated `compiles` rows (foreign key cleanup — check the existing schema's `compiles.prompt_id REFERENCES prompts(id)` and delete children first or rely on `ON DELETE CASCADE` if you add it to the schema, your choice, just don't leave orphaned rows).
6. **Search/filter**: a simple text input at the top of the prompt list that filters the visible list by title (client-side filter over the already-loaded `prompts` array — no new backend query needed for this scale).

### C. Export options
7. In `CompiledOutput.tsx` (or a new small toolbar above it), add: **Copy to clipboard** (the full compiled prompt formatted as readable Markdown — write a `formatAsMarkdown(compiled: CompiledPrompt): string` helper, probably belongs in `packages/compiler` since it's a pure data-to-text transform, exported alongside `mergeAnswer`/`compileArchitect` etc., or in `apps/desktop/src/lib` if it's presentation-specific enough — implementer's judgment, but prefer `packages/compiler` if the formatting is generically useful/testable), using the Tauri clipboard API (`@tauri-apps/plugin-clipboard-manager` — add this dependency) or a plain browser `navigator.clipboard.writeText()` if that works reliably in the Tauri webview (verify which approach is more reliable, don't assume).
8. **Export as file**: save the compiled prompt as a `.md` or `.json` file via Tauri's dialog/fs plugins (`@tauri-apps/plugin-dialog` for a save-file picker, `@tauri-apps/plugin-fs` to write it) — both are standard Tauri 2 plugins, add as dependencies.
9. These export actions should only be enabled/visible when `compiled` is non-null (nothing to export before a compile exists).

### D. Keyboard shortcuts
10. `Ctrl/Cmd+Enter` in the raw-input textarea triggers Compile (same as clicking the Compile button) — respect the existing `disabled={running}` guard, don't allow triggering a second compile while one is running.
11. `Ctrl/Cmd+N` triggers New Prompt (same as the existing button) — but only when not actively typing in a text field that would conflict (careful with browser/OS-reserved shortcuts; if `Ctrl+N` conflicts awkwardly in the Tauri webview, an alternative like `Ctrl+Shift+N` is acceptable — implementer's judgment, document whichever you pick).
12. `Escape` while `running` cancels the compile stepper animation (there's already a `cancelRef` mechanism in `App.tsx`'s `handleCompile` — check if `Escape` can hook into that cleanly, or if it needs a small addition).
13. Document the shortcuts somewhere discoverable — a small hint row near the input area (e.g. "⌘/Ctrl+Enter to compile") is enough, doesn't need a full shortcuts-reference modal.

## Cross-cutting requirements
14. All new Rust/Tauri commands follow the existing `commands.rs` patterns (error handling via `Result<T, String>` or whatever convention TASK-001 established — read the file first, don't invent a new convention).
15. Zero AI API calls anywhere in any of this.
16. All 118 pre-existing tests must still pass. If you add new pure-function helpers to `packages/compiler` (e.g. `formatAsMarkdown`), add tests for them too, following the existing test file conventions in `packages/compiler/test/`.
17. `tsc --noEmit`, `vite build`, AND `cargo build` must all stay clean (this task touches Rust/`src-tauri` for the first time since TASK-015, given the new SQLite table + commands).
18. Visual language: dark SINVAUX/Scaffold theme via `--sv-*` tokens only, no rounded corners, no new UI component libraries.
19. Update `state/CANONICAL_STATE.md` and task/queue status on completion, including the new `settings` table schema so future tasks know it exists.
20. Commit and push to `origin/master` (`https://github.com/YVNGVOU/scaffold-app`) when done — do not touch the updater signing key file or release artifacts.

## Explicitly out of scope
- The "open in Claude/ChatGPT" clipboard-and-launch integration discussed earlier — that's a separate, not-yet-approved feature, don't build it as part of "export options" (export here means copy/save the compiled prompt itself, not launching external sites).
- A full onboarding/tutorial flow.
- Cloud sync / account system (violates the local-first/no-cloud-required principle).
- Light-theme toggle (the app just moved to a single dark theme per explicit user request — don't add theme-switching unless asked).
