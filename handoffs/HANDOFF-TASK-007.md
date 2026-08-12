# IMPLEMENTATION HANDOFF — TASK-007

## Mission
Implement the SECURITY specialist as the fourth real, deterministic specialist, wired into the pipeline before the critique/conflict engine so its output is also subject to critique/conflict reasoning.

## Canonical context
- Read first: `state/CANONICAL_STATE.md`, `tasks/TASK-007.md`
- Reference implementations to mirror exactly: `packages/compiler/src/specialists/technical/index.ts` and `packages/compiler/src/specialists/ux/index.ts`
- Registry: `packages/compiler/src/specialists/_stubs/index.ts`
- Domain modules: `packages/compiler/src/domains/{web,game,branding}/index.ts` — add `securityConsiderations`
- Pipeline: `packages/compiler/src/pipeline/index.ts`, `packages/compiler/src/pipeline/stages/uxSpecialistPass.ts` (mirror for `securitySpecialistPass.ts`), and `critique.ts`/`conflict.ts` (read to understand what they consume — you're inserting SECURITY before them)

## User intent
> Continuation of autonomous overnight work per TASK-005 Verifier's recommendation: a fourth specialist now that critique/conflict engine exists to reason over richer cross-specialist output.

## Objective
ARCHITECT mode now runs ARCHITECT + TECHNICAL + UX + SECURITY, in that order, followed by critique and conflict detection which can now reason over all four specialists' output. For a web app prompt, SECURITY should surface something like authentication requirements, data-exposure concerns for any mentioned user data, or unsafe assumptions (e.g. "no login required" stated without any access-control consideration) — distinct from the other three specialists' concerns.

## Scope

### In scope
- `packages/compiler/src/specialists/security/index.ts`.
- `securityConsiderations` domain data in the 3 domain modules.
- `packages/compiler/src/pipeline/stages/securitySpecialistPass.ts`, inserted into `ARCHITECT_MODE_PIPELINE` after `uxSpecialistPass` and before `critique`.
- Registration in `SPECIALIST_REGISTRY`.
- New tests per domain + four-way merged-output test.
- Optional: one new conflict-detection rule only if a genuine security-vs-other-specialist tension is naturally available in the domain data — do not force it.

### Explicitly out of scope
- CREATIVE/QA/CONSTRAINT specialists.
- New domains, new modes, UI changes.

## Current-state findings
- The specialist pattern is now established three times over (ARCHITECT, TECHNICAL, UX) with zero surprises each time — `synthesis.ts` has needed no changes across all of them. Expect the same for SECURITY, but verify with a direct test rather than assuming.
- `critique.ts` and `conflict.ts` (TASK-005) already run after the three existing specialists and read from the same accumulated `PipelineState` arrays (`requirements`, `requirementCategories`, `architectureNotes`, `ambiguities`). Inserting SECURITY before them means their existing rules automatically see SECURITY's output too (e.g. critique's low-confidence-recommendation rule, near-duplicate detection) without any changes to critique.ts/conflict.ts required — verify this is true.
- Domain modules currently export: detection scoring (word-boundary regex matching as of TASK-006's fix — follow this convention for any new keyword data, do not reintroduce bare substring matching), `architectureTemplate`, `technicalConsiderations`, `uxConsiderations`, ambiguity checklist, synonym/lexicon hooks.

## Requirements
1. `securitySpecialist` same `Specialist` type signature as the other three.
2. Domain-specific security data in each of the 3 domain modules as a new named export, not inline in the specialist file.
3. SECURITY never emits `kind: 'user'`.
4. `source: 'security-specialist'` consistently.
5. SECURITY actually runs as part of `ARCHITECT_MODE_PIPELINE`, positioned after `uxSpecialistPass` and before `critique` — verify via a test on the real public pipeline entry point.
6. `synthesis.ts` merges all four specialists' output without collision — verify directly.
7. All 53 existing tests still pass.
8. No AI API calls, no network calls, no bare-substring keyword matching (use word-boundary regex per the TASK-006 fix pattern) if any new domain keyword data is added.

## Decisions
| Decision | Choice | Reason |
|---|---|---|
| Pipeline wiring | Mirror `uxSpecialistPass.ts`, insert before critique/conflict | Established pattern; positioning before critique/conflict lets those stages reason over SECURITY's output for free |
| Security data location | Domain modules, parallel to `technicalConsiderations`/`uxConsiderations` | Consistency |
| New conflict rule | Optional, only if genuine | Don't force decorative rules — TASK-005's verifier explicitly valued one real rule over several shallow ones |

## Implementation phases

### Phase A — Domain data + specialist logic
- Work: add `securityConsiderations` to each of the 3 domain modules (word-boundary-safe keyword data if any); implement `securitySpecialist` mirroring the established structure and provenance rules — privacy, auth, authorization, data exposure, unsafe assumptions, security requirements.
- Files/systems: `packages/compiler/src/domains/*`, `packages/compiler/src/specialists/security/*`.
- Verification: isolated unit tests for `securitySpecialist` against each domain pass.
- Exit criteria: specialist produces sensible, domain-appropriate decisions when called directly.

### Phase B — Pipeline wiring + registry + four-way verification
- Work: register SECURITY, wire `securitySpecialistPass` into the pipeline in the correct position, verify synthesis and critique/conflict correctly incorporate it.
- Files/systems: `packages/compiler/src/specialists/_stubs/index.ts`, `packages/compiler/src/pipeline/*`.
- Verification: full vitest suite (53 existing + new) passes; new end-to-end test confirms all four specialists' output appears together; confirm critique/conflict still function correctly with the new specialist in the mix (no regressions in TASK-005's tests).
- Exit criteria: `compileArchitect(...)` demonstrably contains all four specialists' sourced items, in the correct pipeline order.

## Acceptance criteria
- [ ] `securitySpecialist` implemented, mirrors established provenance discipline.
- [ ] Security consideration data lives in domain modules.
- [ ] SECURITY registered and executes in the real pipeline, correctly positioned before critique/conflict.
- [ ] `synthesis.ts` correctly merges all four specialists' decisions.
- [ ] New tests: one per domain + one four-way merged-output test.
- [ ] All 53 pre-existing tests still pass, including TASK-005's critique/conflict tests.
- [ ] `tsc --noEmit` clean.
- [ ] `state/CANONICAL_STATE.md` and `tasks/TASK_QUEUE.md` updated.

## Verification plan
- [ ] Build/compile (`tsc --noEmit`)
- [ ] Automated tests (full vitest suite)
- [ ] Static/type/lint checks
- [ ] Runtime/manual verification (confirm `apps/desktop` still typechecks/builds)
- [ ] Artifact inspection (test output as evidence)

## Risks and mitigations
- Risk: inserting a fourth specialist before critique/conflict changes critique/conflict's existing test expectations (e.g. count-based assertions).
  - Mitigation: run TASK-005's exact tests and confirm they still pass; if a count assertion breaks because SECURITY legitimately added more items, that's expected — verify the test's intent still holds, don't just loosen the assertion blindly.
- Risk: bare-substring keyword bugs reintroduced.
  - Mitigation: requirement 8, follow TASK-006's word-boundary convention.

## Stop conditions
Stop and report instead of expanding scope if:
- inserting SECURITY breaks critique/conflict in a way that requires redesigning those stages (not just updating a count expectation)
- a new requirement materially changes architecture or scope

## Final report format
- Summary:
- Files changed:
- Verification:
- Results:
- Known issues:
- Canonical state updated:
- Next task:
