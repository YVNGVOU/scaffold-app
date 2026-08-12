# IMPLEMENTATION HANDOFF — TASK-003

## Mission
Implement the TECHNICAL specialist as the second real, deterministic specialist (after ARCHITECT), wire it into the actual pipeline so it runs in ARCHITECT mode, and prove the `SPECIALIST_REGISTRY` pattern from Phase 1 genuinely generalizes to more than one specialist.

## Canonical context
- Read first: `state/CANONICAL_STATE.md`, `tasks/TASK-003.md`
- Reference implementation to mirror: `packages/compiler/src/specialists/architect/index.ts`
- Stub registry to fill in: `packages/compiler/src/specialists/_stubs/index.ts` (rename/move as appropriate — it no longer holds only stubs once TECHNICAL is real; use your judgment on whether to keep the `_stubs` name for the remaining 5 or restructure slightly, but don't over-refactor)
- Domain modules to extend: `packages/compiler/src/domains/{web,game,branding}/index.ts`
- Pipeline runner to inspect before deciding how to wire in the new specialist: `packages/compiler/src/pipeline/index.ts`, `packages/compiler/src/pipeline/stages/architectSpecialistPass.ts`

## User intent
> "keep going, do the TECHNICAL specialist next" — direct continuation of autonomous overnight work, no further questions expected.

## Objective
Given a raw prompt, ARCHITECT mode now runs both the ARCHITECT and TECHNICAL specialists, and the final `CompiledPrompt` contains both specialists' decisions correctly merged — e.g. for "make me a horror game," TECHNICAL should surface something like engine choice, platform performance considerations, or asset pipeline constraints, distinct from ARCHITECT's structural component breakdown.

## Scope

### In scope
- `packages/compiler/src/specialists/technical/index.ts` — real rule engine.
- Domain modules extended with technical consideration data (not hardcoded in the specialist).
- Pipeline wiring so TECHNICAL actually executes — inspect the existing single-specialist pipeline first; the cleanest fix is likely either (a) generalize `architectSpecialistPass` into a `specialistPasses` stage that iterates a list of active specialists for the mode, or (b) add a second stage. Pick whichever fits the existing code shape better; do not leave TECHNICAL implemented-but-unreachable.
- New tests per domain + a merged-output test.

### Explicitly out of scope
- The other 5 specialists (UX, CREATIVE, QA, SECURITY, CONSTRAINT) — still stubs.
- New domains, new modes, UI changes (unless required to not break the build).

## Current-state findings
- ARCHITECT specialist reads `state.domain`, looks up `DOMAIN_MODULES`, reads an `architectureTemplate` per domain, and emits `Decision[]` (either `{type: 'architectureNote', note: ArchitectureNote}` or `{type: 'requirement', category, item: RequirementItem}`).
- The specialist never emits `kind: 'user'`; only `inferred/default/recommendation`.
- Domain modules currently export detection scoring + an `architectureTemplate` + an ambiguity checklist + (after TASK-002) synonym/lexicon hooks. Follow this same "data lives in the domain module, logic lives in the specialist" split for technical considerations.

## Requirements
1. `technicalSpecialist` has the exact same `Specialist` type signature as `architectSpecialist`.
2. Domain-specific technical data added to each of the 3 domain modules as a new named export (e.g. `technicalConsiderations: TechnicalConsideration[]`), not inline in the specialist file.
3. TECHNICAL never emits `kind: 'user'`.
4. TECHNICAL actually runs as part of `ARCHITECT_MODE_PIPELINE` — verify by writing a test that calls the real public pipeline entry point and asserts TECHNICAL-sourced decisions (`source: 'technical-specialist'` or similar, matching ARCHITECT's `source: 'architect-specialist'` convention) are present in the output.
5. `synthesis.ts` merges both specialists' output without collisions (e.g. if both specialists write to `functionalRequirements`, both sets of items must survive, not overwrite).
6. All 32 existing tests still pass.
7. No AI API calls, no network calls — same hard constraint as always.

## Decisions
| Decision | Choice | Reason |
|---|---|---|
| Pipeline wiring approach | Implementer's judgment after inspecting `pipeline/index.ts` — generalize the stage or add a second one | Whichever avoids awkward duplication; both are architecturally acceptable, this handoff doesn't force one |
| Technical data location | Domain modules, not the specialist file | Matches Phase 1 spec's "domain logic lives in domain packs" principle, keeps specialist logic domain-agnostic |

## Implementation phases

### Phase A — Domain data + specialist logic
- Work: add `technicalConsiderations` (or equivalent) to each of the 3 domain modules; implement `technicalSpecialist` mirroring the architect specialist's structure and provenance rules.
- Files/systems: `packages/compiler/src/domains/*`, `packages/compiler/src/specialists/technical/*`.
- Verification: isolated unit tests for `technicalSpecialist` against each domain pass.
- Exit criteria: specialist produces sensible, domain-appropriate decisions when called directly (not yet wired into the pipeline).

### Phase B — Pipeline wiring + registry + merge verification
- Work: register TECHNICAL, wire it into the actual running pipeline, verify synthesis merges correctly.
- Files/systems: `packages/compiler/src/specialists/_stubs/index.ts` (or renamed), `packages/compiler/src/pipeline/*`.
- Verification: full vitest suite (32 existing + new) passes; a new end-to-end test confirms both specialists' output appears in one compiled result.
- Exit criteria: `runArchitectPipeline("make me a horror game")` (or similar) demonstrably contains both `architect-specialist` and `technical-specialist` sourced items.

## Acceptance criteria
- [ ] `technicalSpecialist` implemented, mirrors ARCHITECT's provenance discipline (never `kind: 'user'`).
- [ ] Technical consideration data lives in domain modules, one export per domain.
- [ ] TECHNICAL is registered and actually executes in the real pipeline (not just callable in isolation).
- [ ] `synthesis.ts` correctly merges both specialists' decisions.
- [ ] New tests: one per domain + one merged-output end-to-end test.
- [ ] All 32 pre-existing tests still pass.
- [ ] `tsc --noEmit` clean.
- [ ] `state/CANONICAL_STATE.md` and `tasks/TASK_QUEUE.md` updated.

## Verification plan
- [ ] Build/compile (`tsc --noEmit`)
- [ ] Automated tests (full vitest suite)
- [ ] Static/type/lint checks
- [ ] Runtime/manual verification (not required to launch desktop app, but confirm `apps/desktop` still typechecks/builds if `packages/compiler`'s public API changed at all)
- [ ] Artifact inspection (test output as evidence)

## Risks and mitigations
- Risk: two specialists writing to the same `CompiledPrompt` section causes one to silently clobber the other.
  - Mitigation: requirement 5 — explicit merge test.
- Risk: scope creep into implementing other specialists "while we're in here."
  - Mitigation: stay to TECHNICAL only, per explicitly-out-of-scope list; queue others as follow-ups instead.

## Stop conditions
Stop and report instead of expanding scope if:
- wiring TECHNICAL into the pipeline requires a breaking change to the public API that would affect `apps/desktop` in a way you can't verify still builds correctly
- a new requirement materially changes architecture or scope

## Final report format
- Summary:
- Files changed:
- Verification:
- Results:
- Known issues:
- Canonical state updated:
- Next task:
