# TASK-021

**Timestamp**: 2026-08-12
**Request context**: part of the user-requested QoL build-out, built via /workflow-build

## Title
Prompt-target output profiles

## Requirements
- Extend `formatAsMarkdown(compiled, profile?)` in `packages/compiler` to accept an optional output-target profile that changes only Markdown formatting/conventions (headers, tone framing, structure) of the rendered text — never the underlying `CompiledPrompt` data.
- 4-5 profiles per the original product brief's target list: Generic AI, Claude, ChatGPT, Coding Agent, Image Model. Each is a plain, deterministic formatting convention (e.g. different heading style/section order/framing sentence) — no per-profile AI calls, no network calls.
- A `PromptProfile` type/union exported from `packages/compiler` (and re-exported via `packages/compiler/src/index.ts`) so the desktop app can share it.
- UI: a profile selector in `apps/desktop/src/components/CompiledOutput.tsx`'s `ExportToolbar`, defaulting to Generic AI, used for both "Copy Markdown" and "Export .md" (JSON export is unaffected — it must remain the raw `CompiledPrompt` regardless of profile).
- Dark SINVAUX/Scaffold visual language via `--sv-*` tokens only, no rounded corners, no new UI component libraries.
- Unit tests for the profile-aware `formatAsMarkdown` covering each profile's distinguishing output and confirming the underlying data/content is never altered, only its formatting.

## Explicitly out of scope
- Any AI API call to actually tailor/rewrite content per target model (formatting-convention differences only, per the brief).
- Persisting a user's chosen profile as a default setting (session-only selection; no new `settings` table key).
- New export formats beyond the existing Markdown/JSON (no per-profile file extension, no image-model-specific binary output).
- Any change to `formatDiff`, `mergeAnswer`, or other existing compiler helpers.
- Any change to the underlying `CompiledPrompt` schema in `packages/schema`.
