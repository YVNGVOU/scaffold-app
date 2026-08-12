# TASK-022

- Timestamp: 2026-08-12
- Request context: part of the user-requested QoL build-out, built via `/workflow-build`.

## Requirements
- Add a small set of clickable example/starter prompts (2-3 per domain: web, game, branding) shown when the raw-input textarea is empty, in `App.tsx`'s center pane.
- Clicking an example populates the textarea with that example's text.
- Pure frontend, no compiler changes needed.
- Dark SINVAUX/Scaffold visual language via `--sv-*` tokens only, no rounded corners, no new UI component libraries.
- Starters must disappear once the textarea has content (typed or populated), so they don't clutter the compile flow.

## Explicitly out of scope
- Any change to `packages/compiler` or `packages/schema` (no compiler changes needed per brief).
- Domain-detection logic changes (this is example text only, not wired into ambiguityDetection or any pipeline).
- Persisting starter usage/analytics.
- Starters for modes beyond the three existing domains (web, game, branding).
- Any change to TASK-019's auth gate or TASK-017's answer-merge flow.
