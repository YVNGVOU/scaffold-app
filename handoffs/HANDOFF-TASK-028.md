# HANDOFF-TASK-028

## Mission
Give each requirement item a fast, hover-only, at-a-glance provenance summary (source + confidence) so the user doesn't have to click into the full `MetaDisclosure` detail just to see where a decision came from and how confident it is.

## Scope
- New small presentational component, `apps/desktop/src/components/ProvenanceTip.tsx`: wraps a piece of inline content (the `KindTag`) in a hover/focus-triggered tooltip bubble showing a one-line `source · confidence%` summary (plus risk when present). Pure CSS-driven visibility (`:hover`/`:focus-within`), no JS state, no new dependency.
- CSS additions in `apps/desktop/src/theme.css`: `.sv-tip` (positioning wrapper) and `.sv-tip-bubble` (the bubble itself) — `--sv-*` tokens only, no rounded corners, absolutely positioned bubble hidden by default (`opacity: 0; pointer-events: none`), shown via `:hover`/`:focus-within`.
- Wiring in `apps/desktop/src/components/DecisionsPanel.tsx`: `RequirementCard` and `UnresolvedItemCard` wrap their `<KindTag>` in `<ProvenanceTip item={item}>`.
- `MetaDisclosure.tsx` itself is left functionally unchanged — the click-to-expand full detail (source/confidence/risk/status/evidence) remains exactly as-is; the tooltip is a strict addition alongside it, not a replacement.

## Acceptance criteria
1. Hovering (or keyboard-focusing) a requirement item's `KindTag` shows a small tooltip bubble with `source · confidence%` (and risk if present), with no click required.
2. The existing click-to-expand `MetaDisclosure` `<details>` still works unchanged and still shows the full source/confidence/risk/status/evidence block.
3. Tooltip styling uses `--sv-*` tokens only, no rounded corners, no new UI component library, no new runtime dependency.
4. Tooltip is implemented as a reusable component so it can be attached to future item types without duplicating markup.
5. `packages/compiler` vitest suite: pre-existing tests still pass unchanged (no new pure-function helper — this is a pure UI feature).
6. `tsc --noEmit` clean on `packages/schema`, `packages/compiler`, `apps/desktop`; `vite build` clean on `apps/desktop`.
7. No stray `&amp;amp;` entity artifacts or hardcoded hex colors outside `--sv-*` tokens in new/changed files.
8. No Rust/`src-tauri` changes; `apps/desktop/src-tauri/scaffold-updater.key` and `Scaffold-Release/`/`bundle/` untouched.

## Explicitly out of scope
See `tasks/TASK-028.md`.
