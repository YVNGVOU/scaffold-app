# IMPLEMENTATION HANDOFF — TASK-004

## Mission
Implement the UX specialist as the third real, deterministic specialist (after ARCHITECT and TECHNICAL), wire it into the actual pipeline alongside the other two, and further validate the `SPECIALIST_REGISTRY` pattern at N=3.

## Canonical context
- Read first: `state/CANONICAL_STATE.md`, `tasks/TASK-004.md`
- Reference implementations to mirror exactly: `packages/compiler/src/specialists/architect/index.ts` AND `packages/compiler/src/specialists/technical/index.ts` (the second one is closer in spirit — UX should follow the same "registered specialist, own pass stage" shape TECHNICAL established)
- Registry: `packages/compiler/src/specialists/_stubs/index.ts`
- Domain modules to extend: `packages/compiler/src/domains/{web,game,branding}/index.ts` (add `uxConsiderations`, following the `technicalConsiderations` precedent)
- Pipeline: `packages/compiler/src/pipeline/index.ts`, `packages/compiler/src/pipeline/stages/technicalSpecialistPass.ts` (mirror this file's shape for `uxSpecialistPass.ts`)

## User intent
> Continuation of "keep going, don't stop till it's done" — this specific task follows the TASK-003 Verifier's own recommendation to add a third specialist next before investing in the conflict engine.

## Objective
ARCHITECT mode now runs ARCHITECT + TECHNICAL + UX, and the final `CompiledPrompt` contains all three specialists' decisions correctly merged. For "make me a horror game," UX should surface something like control scheme/onboarding flow, pacing/tension curve as an information-architecture concern, or accessibility considerations (colorblind-safe jump-scare cues, subtitle options) — distinct from ARCHITECT's structural breakdown and TECHNICAL's engine/performance concerns.

## Scope

### In scope
- `packages/compiler/src/specialists/ux/index.ts` — real rule engine, same shape as `technicalSpecialist`.
- Domain modules extended with `uxConsiderations` data (data in domain module, logic in specialist — same split as TECHNICAL).
- `packages/compiler/src/pipeline/stages/uxSpecialistPass.ts`, inserted into `ARCHITECT_MODE_PIPELINE` and `ARCHITECT_MODE_STAGE_NAMES` right after `technicalSpecialistPass` (mirror the exact pattern TECHNICAL used — this is now an established, verified pattern, don't reinvent it).
- Registration in `SPECIALIST_REGISTRY`.
- New tests per domain + a three-way merged-output test (architect + technical + ux all present together).

### Explicitly out of scope
- CREATIVE/QA/SECURITY/CONSTRAINT specialists — still stubs.
- New domains, new modes, UI changes (unless required to not break the build).

## Current-state findings
- The TECHNICAL specialist (TASK-003) established and verified a working pattern: `technicalSpecialist` in its own directory, `technicalSpecialistPass.ts` stage mirroring `architectSpecialistPass.ts`, both stages included in `ARCHITECT_MODE_PIPELINE` in sequence, `synthesis.ts` required NO changes because it already merges by iterating full accumulated arrays — this same "no synthesis changes needed" outcome is expected for UX too, but verify it, don't just assume.
- Domain modules now export: detection scoring, `architectureTemplate`, `technicalConsiderations`, ambiguity checklist, synonym/lexicon hooks. Add `uxConsiderations` following the same typed-array-of-considerations shape as `technicalConsiderations` (check `domains/types.ts` for the `TechnicalConsideration` type and add a parallel `UxConsideration` type, or reuse/generalize if it makes sense — implementer's judgment, don't over-abstract for a single additional field shape).

## Requirements
1. `uxSpecialist` has the exact same `Specialist` type signature as the other two.
2. Domain-specific UX data added to each of the 3 domain modules as a new named export, not inline in the specialist file.
3. UX never emits `kind: 'user'` — only `inferred/default/recommendation`.
4. `source: 'ux-specialist'` consistently on all emitted items.
5. UX actually runs as part of `ARCHITECT_MODE_PIPELINE` — verify with a test calling the real public pipeline entry point.
6. `synthesis.ts` merges all three specialists' output without collisions — verify directly (don't just assume it still works because it worked for two).
7. All 37 existing tests still pass.
8. No AI API calls, no network calls.

## Decisions
| Decision | Choice | Reason |
|---|---|---|
| Pipeline wiring approach | Mirror `technicalSpecialistPass.ts` exactly | Pattern is now established and verified twice (architect, technical) — no reason to deviate |
| UX data location | Domain modules, parallel to `technicalConsiderations` | Consistency with the established data/logic split |

## Implementation phases

### Phase A — Domain data + specialist logic
- Work: add `uxConsiderations` to each of the 3 domain modules; implement `uxSpecialist` mirroring `technicalSpecialist`'s structure and provenance rules, covering user flow, interaction hierarchy, accessibility, usability, information architecture, edge cases as appropriate per domain.
- Files/systems: `packages/compiler/src/domains/*`, `packages/compiler/src/specialists/ux/*`.
- Verification: isolated unit tests for `uxSpecialist` against each domain pass.
- Exit criteria: specialist produces sensible, domain-appropriate decisions when called directly.

### Phase B — Pipeline wiring + registry + three-way merge verification
- Work: register UX, wire `uxSpecialistPass` into the pipeline after `technicalSpecialistPass`, verify synthesis merges all three correctly.
- Files/systems: `packages/compiler/src/specialists/_stubs/index.ts`, `packages/compiler/src/pipeline/*`.
- Verification: full vitest suite (37 existing + new) passes; a new end-to-end test confirms architect + technical + ux sourced items all appear together in one compiled result.
- Exit criteria: `compileArchitect("make me a horror game")` (or similar) demonstrably contains all three specialists' sourced items.

## Acceptance criteria
- [ ] `uxSpecialist` implemented, mirrors established provenance discipline (never `kind: 'user'`).
- [ ] UX consideration data lives in domain modules, one export per domain.
- [ ] UX is registered and actually executes in the real pipeline.
- [ ] `synthesis.ts` correctly merges all three specialists' decisions (verified directly, not assumed).
- [ ] New tests: one per domain + one three-way merged-output end-to-end test.
- [ ] All 37 pre-existing tests still pass.
- [ ] `tsc --noEmit` clean.
- [ ] `state/CANONICAL_STATE.md` and `tasks/TASK_QUEUE.md` updated.

## Verification plan
- [ ] Build/compile (`tsc --noEmit`)
- [ ] Automated tests (full vitest suite)
- [ ] Static/type/lint checks
- [ ] Runtime/manual verification (confirm `apps/desktop` still typechecks/builds)
- [ ] Artifact inspection (test output as evidence)

## Risks and mitigations
- Risk: three specialists writing to the same `CompiledPrompt` section causes clobbering that didn't show up at N=2.
  - Mitigation: requirement 6 — explicit three-way merge test, not just reuse of the two-way test.
- Risk: scope creep into implementing other specialists "while we're in here."
  - Mitigation: stay to UX only, per explicitly-out-of-scope list.

## Stop conditions
Stop and report instead of expanding scope if:
- wiring UX into the pipeline requires a breaking change to the public API that would affect `apps/desktop` in a way you can't verify still builds correctly
- a new requirement materially changes architecture or scope

## Final report format
- Summary:
- Files changed:
- Verification:
- Results:
- Known issues:
- Canonical state updated:
- Next task:
