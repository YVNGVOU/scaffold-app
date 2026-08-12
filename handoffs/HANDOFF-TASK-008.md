# IMPLEMENTATION HANDOFF — TASK-008

## Mission
Add QUICK mode: a fast, minimal-analysis single-pass pipeline that reuses the existing intent/domain/requirement stages but skips all specialist deliberation, critique, and conflict detection — the last of the original three modes to be implemented.

## Canonical context
- Read first: `state/CANONICAL_STATE.md`, `tasks/TASK-008.md`
- Pipeline to extend: `packages/compiler/src/pipeline/index.ts` (currently exports only `ARCHITECT_MODE_PIPELINE`/`runArchitectPipeline`)
- Public API surface: `packages/compiler/src/index.ts` (check for a `compileArchitect` convenience export to mirror)
- Original brief's mode descriptions (for reference, already summarized in the Phase 1 spec and PROJECT_BLUEPRINT.md): QUICK = "User prompt → improved prompt, minimal analysis, fast transformation." ARCHITECT = structured spec with requirements/assumptions/architecture. MASTER (out of scope here) = full multi-pass deliberation.

## User intent
> Continuation of autonomous overnight work per TASK-007 Verifier's recommendation: QUICK mode is the highest-value next step, well-contained, reuses existing plumbing.

## Objective
`runQuickPipeline("make me a horror game")` returns a valid, fast, lightweight `CompiledPrompt` — extracted requirements and detected domain/intent, but no specialist architecture notes, no critique findings, no conflict flags — clearly distinguishable from `runArchitectPipeline`'s much richer output for the same input.

## Scope

### In scope
- `QUICK_MODE_PIPELINE` / `QUICK_MODE_STAGE_NAMES` array in `pipeline/index.ts`, reusing `intentAnalysis`, `domainDetection`, `requirementExtraction` unchanged.
- Decision + implementation of QUICK mode's ambiguity-handling behavior (light defaults vs. skip entirely — see requirement 2 in the task file).
- `runQuickPipeline(rawInput, options?)` public entry point, same signature shape as `runArchitectPipeline`.
- `compileQuick(rawInput): CompiledPrompt` top-level convenience export if `compileArchitect` exists as a pattern to mirror.
- New tests per the task file's requirement 6.
- Optional, implementer's judgment: a minimal QUICK/ARCHITECT mode toggle in `apps/desktop/src/App.tsx` — only if it can be added cleanly without breaking the existing layout/build; otherwise leave as a documented follow-up.

### Explicitly out of scope
- MASTER mode.
- Any change to ARCHITECT mode's existing stages, specialists, critique, or conflict logic.
- A 5th specialist.

## Current-state findings
- `pipeline/index.ts` currently defines only the ARCHITECT-mode pipeline (12 stages: intentAnalysis, domainDetection, requirementExtraction, ambiguityDetection, 4 specialist passes, critique, conflict, synthesis, outputValidation) and one runner, `runArchitectPipeline`.
- `RunPipelineOptions`/`onStage` callback pattern already exists and should be reused identically for the QUICK runner — the UI's `PipelineStepper` component already knows how to render a stage-name sequence generically, so a shorter `QUICK_MODE_STAGE_NAMES` array should "just work" if you choose to wire up UI mode switching.
- `synthesis.ts` and `outputValidation.ts` are generic — they operate on whatever's accumulated in `PipelineState` regardless of which stages ran, so they should be reusable by QUICK mode unchanged. Verify this assumption.
- Every stage function has signature `(state: PipelineState) => PipelineState` and is stateless/composable — QUICK mode is fundamentally "run a subset of the same stage list."

## Requirements
1. `QUICK_MODE_PIPELINE` is a strict subset/reordering of existing stage functions — no new stage logic invented for intent/domain/requirement extraction (reuse verbatim).
2. Ambiguity handling decision is explicit and documented in code comments and the final report — not left ambiguous itself.
3. `runQuickPipeline` never throws, same as `runArchitectPipeline` (test against the same edge-case inputs: empty, whitespace, very long, contradictory).
4. QUICK mode output is measurably lighter than ARCHITECT mode for the same input (fewer requirements/no architecture notes/no critique-conflict items) — proven by a direct comparative test, not just asserted.
5. No `kind: 'user'` fabrication anywhere QUICK mode introduces its own content (e.g. if it applies light defaults per requirement 2's decision).
6. All 61 pre-existing tests still pass, ARCHITECT mode behavior is bit-for-bit unchanged (no shared-stage modifications).
7. No AI API calls, no network calls.
8. If UI is touched, `apps/desktop` must still typecheck and build cleanly, and the SINVAUX four-pane layout must remain intact.

## Decisions
| Decision | Choice | Reason |
|---|---|---|
| Stage reuse | QUICK reuses intentAnalysis/domainDetection/requirementExtraction unchanged | Brief's own "minimal analysis" framing implies lighter processing, not different processing |
| Ambiguity handling | Implementer's judgment, must be explicit and documented | Task file's requirement 2 leaves this open deliberately — reasonable people could choose either "light defaults" or "skip" |
| UI wiring | Optional, implementer's judgment | Compiler-first is safer; UI wiring is a nice-to-have if it can be done cleanly without risk to the working, verified desktop app |

## Implementation phases

### Phase A — QUICK pipeline + entry point
- Work: define `QUICK_MODE_PIPELINE`/`QUICK_MODE_STAGE_NAMES`, implement the ambiguity-handling decision, add `runQuickPipeline`/`compileQuick`.
- Files/systems: `packages/compiler/src/pipeline/index.ts`, `packages/compiler/src/index.ts` (if convenience export pattern exists).
- Verification: unit tests confirming QUICK mode compiles a range of inputs without throwing.
- Exit criteria: `runQuickPipeline(...)` works correctly and predictably.

### Phase B — Comparative tests + optional UI
- Work: add the ARCHITECT-vs-QUICK comparative test, edge-case coverage, and (optional) UI mode toggle.
- Files/systems: `packages/compiler/test/*`, optionally `apps/desktop/src/App.tsx` and related components.
- Verification: full vitest suite (61 existing + new) passes; if UI touched, `tsc --noEmit` + `vite build` clean.
- Exit criteria: QUICK mode is demonstrably lighter/faster-shaped than ARCHITECT mode for identical input, with test evidence.

## Acceptance criteria
- [ ] `QUICK_MODE_PIPELINE`/`runQuickPipeline` implemented, reusing shared stages unchanged.
- [ ] Ambiguity-handling decision made explicit and documented.
- [ ] `compileQuick` added if a convenience-export pattern exists to mirror.
- [ ] QUICK mode never throws on edge-case inputs.
- [ ] QUICK mode output demonstrably lighter than ARCHITECT mode's for the same input (test evidence).
- [ ] No `kind: 'user'` fabrication.
- [ ] All 61 pre-existing tests still pass; ARCHITECT mode unchanged.
- [ ] `tsc --noEmit` clean; `apps/desktop` still builds (whether or not UI was touched).
- [ ] `state/CANONICAL_STATE.md` and `tasks/TASK_QUEUE.md` updated.

## Verification plan
- [ ] Build/compile (`tsc --noEmit`)
- [ ] Automated tests (full vitest suite)
- [ ] Static/type/lint checks
- [ ] Runtime/manual verification (confirm `apps/desktop` still typechecks/builds)
- [ ] Artifact inspection (test output as evidence)

## Risks and mitigations
- Risk: QUICK mode's ambiguity handling accidentally fabricates `kind: 'user'` content or otherwise violates the provenance discipline used everywhere else.
  - Mitigation: requirement 5, explicit test.
- Risk: touching the UI destabilizes the verified, working four-pane app.
  - Mitigation: UI wiring is explicitly optional; if attempted and it introduces any risk/uncertainty, back it out and leave it as a documented follow-up rather than shipping something unverified.

## Stop conditions
Stop and report instead of expanding scope if:
- reusing existing stages for QUICK mode turns out to require modifying their behavior in a way that could affect ARCHITECT mode (that would violate "purely additive")
- a new requirement materially changes architecture or scope

## Final report format
- Summary:
- Files changed:
- Verification:
- Results:
- Known issues:
- Canonical state updated:
- Next task:
