# TASK-028

- Timestamp: 2026-08-12
- Request context: part of the user-requested QoL build-out, built via `/workflow-build`.

## Requirements
- In `DecisionsPanel.tsx` / `MetaDisclosure.tsx`, add a lightweight hover tooltip on each requirement item's `KindTag` or text showing a one-line summary (source + confidence) without requiring a click to expand the full `MetaDisclosure`.
- This is a fast at-a-glance option alongside the existing click-to-expand `MetaDisclosure` detail — it does not replace or remove `MetaDisclosure`.
- Pure CSS/title-attribute or a small custom tooltip component — no new dependency.
- Dark SINVAUX/Scaffold visual language, `--sv-*` tokens only, no rounded corners, no new UI component libraries.

## Explicitly out of scope
- Any change to `packages/compiler`/`packages/schema` (pure presentation feature, no new pure-function helper needed).
- Removing or altering the existing click-to-expand `MetaDisclosure` behavior/content.
- Touch-device tap-to-show tooltip handling beyond default browser hover/focus behavior.
- Any change to TASK-019's auth gate or TASK-017's answer-merge flow.
