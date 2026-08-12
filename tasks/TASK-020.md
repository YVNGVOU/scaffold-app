# TASK-020

**Timestamp**: 2026-08-12
**Request context**: part of the user-requested QoL build-out, built via /workflow-build

## Title
Compile version history / diff view

## Requirements
- Pure `formatDiff(a: CompiledPrompt, b: CompiledPrompt)` helper in `packages/compiler`, tested, returning a structured result: added/removed/changed `RequirementItem`s per category (`userRequirements`, `nonNegotiables`, `preferences`, `constraints`, `assumptions`, `functionalRequirements`), plus changed top-level fields (`mission`/`context`/`objective`/`role`/`outputFormat`) and changed `architecture` notes.
- No AI calls, deterministic, does not mutate its inputs.
- UI way to browse a prompt's past compiles: a version list/dropdown (new panel or addition to `PromptList.tsx`/`CompiledOutput.tsx`), backed by the existing `listCompiles` Tauri command (already append-only SQLite from TASK-001/018).
- Simple diff view rendering `formatDiff`'s structured output for two selected versions — added/removed/changed requirement items per category, changed architecture notes, changed top-level text fields.
- Dark SINVAUX/Scaffold visual language via `--sv-*` tokens only, no rounded corners, no new UI component libraries.

## Explicitly out of scope
- Any AI-generated diff summary/explanation.
- Merging/reverting to a prior version (read-only browsing + diff only).
- Diffing across different prompts (same-prompt versions only).
- Word-level/character-level text diffing inside a single requirement's text (item-level added/removed/changed only, changed meaning "same text different metadata" is out — changed means item present in both but with different `text`, matched by best-effort index/text pairing; see handoff for exact matching rule).
