# TASK-008

- Timestamp: 2026-08-11
- Original request: continuation of autonomous overnight work; TASK-007 Verifier recommended QUICK mode as the highest-value next step — the last unbuilt piece of the original three-mode design, well-contained (reuses existing pipeline plumbing), and now has real specialist/critique output to differentiate against.
- Priority: P1
- Dependencies: TASK-001 through TASK-007 (all done).
- Status: ACTIVE
- Classification: feature

## Normalized requirements
1. Add a `QUICK_MODE_PIPELINE` (and matching `QUICK_MODE_STAGE_NAMES`) in `packages/compiler/src/pipeline/index.ts`: a fast, minimal-analysis single pass — per the original brief, "User prompt → improved prompt" with "minimal analysis." Reuse `intentAnalysis`, `domainDetection`, `requirementExtraction` stages as-is (no changes to those stages). Do NOT run any specialist passes, critique, or conflict — QUICK mode's defining characteristic is that it skips the multi-specialist deliberation entirely.
2. Ambiguity handling in QUICK mode: per the original brief, QUICK mode should not surface unresolved ambiguities the way ARCHITECT mode does (that's an ARCHITECT-mode behavior) — instead QUICK mode should apply light, clearly-marked defaults where ARCHITECT would flag unresolved (kind: 'default', never kind: 'user'), OR skip ambiguity detection entirely and just extract+synthesize what's stated. Decide based on what best matches "fast transformation, minimal analysis" from the brief; document the choice.
3. Add a new public entry point `runQuickPipeline(rawInput, options?)` in `packages/compiler/src/pipeline/index.ts`, mirroring `runArchitectPipeline`'s signature and `RunPipelineOptions` (onStage callback), returning the same `PipelineState` shape so downstream consumers (UI, tests) don't need a different result type.
4. Also add a top-level convenience export mirroring `compileArchitect` if one exists in `packages/compiler/src/index.ts` — check that file first; add `compileQuick(rawInput): CompiledPrompt` analogously if such a pattern exists.
5. QUICK mode must be dramatically faster / lighter output than ARCHITECT mode for the same input — verify with a test comparing stage count and/or output size between the two modes for the same input.
6. New tests: QUICK mode runs successfully end-to-end without throwing on the same edge cases ARCHITECT mode is tested against (empty/whitespace/very long/contradictory input); a test confirming QUICK mode's output for a given input is meaningfully lighter/simpler than ARCHITECT mode's output for the same input; a test confirming QUICK mode never emits kind: 'user' on anything it introduces itself, same provenance discipline as everywhere else.
7. Must not break any of the existing 61 tests, and must not change ARCHITECT mode's behavior at all (purely additive).
8. No AI API calls, no network calls.
9. UI consideration: the brief describes three selectable modes. Check `apps/desktop/src/App.tsx` — if there's no mode selector yet (likely, since only ARCHITECT mode existed), you may add a minimal mode toggle (QUICK / ARCHITECT) wired to the two pipeline entry points, OR leave the UI untouched and treat this as compiler-only work with UI wiring as a follow-up task — your judgment, document which you chose and why. If you do touch the UI, it must not break the existing four-pane layout or SINVAUX visual language, and `apps/desktop`'s build/typecheck must stay clean.
10. Update `state/CANONICAL_STATE.md` and task/queue status on completion.

## Explicitly out of scope
- MASTER mode (multi-round deliberation) — separate, larger task.
- No changes to ARCHITECT mode's stages, specialists, or critique/conflict engine.
- A 5th specialist — not part of this task.
