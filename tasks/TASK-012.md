# TASK-012

- Timestamp: 2026-08-11
- Original request: "way to much info thats unorganized keep the info but make the users life easy" — user feedback after seeing the running app. With 6 specialists now real (as of TASK-013), the right-hand DecisionsPanel and center CompiledOutput both flatly dump every item in one long list with no grouping — confirmed by reading the current source: `DecisionsPanel.tsx` concatenates all requirement categories into one undifferentiated "Decisions & Assumptions" list, `CompiledOutput.tsx` dumps every item in a category (now potentially 6 specialists' worth) as a flat `<ul>` with no grouping by source.
- Priority: P1
- Dependencies: TASK-011 (rebrand, done — avoid conflicting edits, this task runs after it). TASK-013 (QA specialist, done) is why this became urgent — 6 specialists' worth of output makes the flat-list problem much worse than it was at Phase 1 (1 specialist).
- Status: QUEUED
- Classification: design, feature

## Requirements — keep all info, reduce apparent density
1. **Group by source, not just by category.** In both `CompiledOutput` and `DecisionsPanel`, items within a category (e.g. "Functional Requirements") should be visually grouped by which specialist/source produced them (architect-specialist, technical-specialist, ux-specialist, security-specialist, creative-specialist, qa-specialist, critique-engine, conflict-engine, requirement-extraction/user-input, etc.), not presented as one undifferentiated list. A short source label or icon per group beats a `source: x` line repeated on every single item.
2. **Collapse by default, expand on demand.** Categories/groups that are typically long or secondary (Assumptions, Preferences, the "Decisions & Assumptions" bucket in DecisionsPanel) should be collapsible and collapsed by default, showing just a count (e.g. "Assumptions (14)"). Categories that are usually short and high-signal (Unresolved/needs-your-input, User Requirements, Non-Negotiables, Conflicts) stay expanded by default.
3. **Surface conflicts distinctly.** Per TASK-005/007's design, conflict findings (`source: 'conflict-engine'`) currently render as an undifferentiated recommendation, indistinguishable from a normal specialist suggestion (this was an accepted known limitation at the time — now worth fixing since it's part of "unorganized"). Give conflicts their own small labeled section/badge in DecisionsPanel so a genuine two-sided disagreement is visually distinct from routine recommendations.
4. **At-a-glance summary.** Add a compact summary strip (e.g. above DecisionsPanel or near the top of CompiledOutput) showing counts: total requirements, unresolved count, conflict count, specialists that contributed — so the user can tell at a glance whether there's anything that needs their attention before scrolling.
5. **Reduce per-item visual noise.** Confidence percentage, risk, and evidence text currently render as dense small-type metadata on every single card. Keep this information (nothing is deleted per the user's "keep the info" instruction) but make it progressive-disclosure — e.g. visible on hover/expand, or condensed into a compact inline format, rather than three lines of 11px gray text under every item by default.
6. **MASTER mode awareness.** MASTER mode's output has even more items (post-deliberation-loop) than ARCHITECT's — the grouping/collapsing scheme must scale gracefully to MASTER's typically-larger result sets, not just look fine on ARCHITECT's smaller output.
7. **Preserve the SINVAUX/Scaffold visual language.** No rounded cards, no drop shadows, no chat-bubble UI, ivory/near-black/burgundy palette, editorial typography, hairline dividers — this is a density/organization fix, not a redesign of the visual identity.
8. **No information loss.** Every field currently shown (text, kind, source, confidence, risk, evidence, status) must still be accessible somewhere in the UI — collapsed/grouped/progressive-disclosure is fine, deleted is not.
9. Must not break the existing SQLite persistence flow, mode toggle, or pipeline stepper — this is scoped to `CompiledOutput.tsx` and `DecisionsPanel.tsx` (and shared helper components like `KindTag.tsx` if useful), not `App.tsx`'s data flow.
10. `tsc --noEmit` and `vite build` must stay clean in `apps/desktop`.
11. Update `state/CANONICAL_STATE.md` and task/queue status on completion.

## Explicitly out of scope
- No changes to the compiler package (`packages/compiler`) — this is a pure presentation-layer task.
- No new pipeline stages, no new specialists (CONSTRAINT remains the last stub, separate task).
- No changes to the left nav (PromptList) beyond what TASK-011 already did for branding.
