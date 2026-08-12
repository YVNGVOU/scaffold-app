# IMPLEMENTATION HANDOFF — TASK-010

## Mission
Implement the CREATIVE specialist as the fifth real, deterministic specialist, wired into BOTH `ARCHITECT_MODE_PIPELINE` and `runMasterPipeline` — the first specialist added since MASTER mode was built, so this task also validates that the specialist-addition pattern generalizes across both pipeline runners, not just one.

## Canonical context
- Read first: `state/CANONICAL_STATE.md`, `tasks/TASK-010.md`
- Reference implementations to mirror: `packages/compiler/src/specialists/{technical,ux,security}/index.ts`
- Registry: `packages/compiler/src/specialists/_stubs/index.ts`
- Domain modules: `packages/compiler/src/domains/{web,game,branding}/index.ts` — add `creativeConsiderations`
- Pipeline: `packages/compiler/src/pipeline/index.ts` — has TWO places to update this time: `ARCHITECT_MODE_PIPELINE`/`ARCHITECT_MODE_STAGE_NAMES` (static arrays) AND `runMasterPipeline`'s "round 2" block (imperative `runStage` calls)
- `critique.ts`'s `LOOP_STAGE_SOURCES` — read this to understand what it excludes and confirm CREATIVE doesn't need to be added there (it shouldn't; that list is for the deliberation loop's own meta-stages, not specialists)

## User intent
> "keep going, add the CREATIVE specialist next" — direct continuation, no further questions expected.

## Objective
Both `compileArchitect(...)` and `compileMaster(...)` now include CREATIVE's output alongside the other four specialists. For a branding-domain prompt, CREATIVE should surface something like visual-direction/style-consistency recommendations distinct from ARCHITECT's structural breakdown, TECHNICAL's file-format concerns, UX's usability concerns, and SECURITY's licensing/data concerns.

## Scope

### In scope
- `packages/compiler/src/specialists/creative/index.ts`.
- `creativeConsiderations` domain data in the 3 domain modules.
- `packages/compiler/src/pipeline/stages/creativeSpecialistPass.ts`, mirroring `securitySpecialistPass.ts`.
- Wiring into `ARCHITECT_MODE_PIPELINE` (insert after `securitySpecialistPass`, before `critique`) — static array + stage-names array.
- Wiring into `runMasterPipeline`'s round-2 block (insert `runStage(creativeSpecialistPass, 'creativeSpecialistPass')` after the `securitySpecialistPass` call, before the deliberation loop starts).
- Registration in `SPECIALIST_REGISTRY`.
- New tests per domain + ARCHITECT five-way merge test + a SEPARATE MASTER-mode five-way merge test (MASTER has its own runner and its own test suite precedent — TASK-009 added dedicated MASTER tests rather than assuming ARCHITECT coverage was sufficient; follow that precedent).

### Explicitly out of scope
- QA/CONSTRAINT specialists.
- New domains, new modes, UI changes.
- Modifying critique.ts/conflict.ts unless verification genuinely uncovers a problem (see requirement 8 in the task file).

## Current-state findings
- The specialist pattern is now established four times over (ARCHITECT, TECHNICAL, UX, SECURITY) with zero surprises in ARCHITECT mode. This is the first time a specialist is being added AFTER MASTER mode exists, so `runMasterPipeline` also needs the new specialist wired into its round-2 block — this is a new wrinkle relative to TASK-003/004/007's handoffs, which only had one pipeline to update.
- `runMasterPipeline` is NOT a static array (unlike `ARCHITECT_MODE_PIPELINE`/`QUICK_MODE_PIPELINE`) — it's an imperative function using a local `runStage` helper. Read the actual current file content before editing; don't assume the array-based pattern applies there.
- `critique.ts`'s `LOOP_STAGE_SOURCES` exclusion list (added in TASK-009) only excludes the loop's own meta-stage sources (`critique-engine`, `conflict-engine`, `alternative-generation`, `decision-scoring`) from being re-critiqued in later loop rounds — CREATIVE's `source: 'creative-specialist'` should NOT be added there, since CREATIVE is a normal specialist whose output SHOULD be subject to critique, same as the other four.

## Requirements
1. `creativeSpecialist` same `Specialist` type signature as the other four.
2. Domain-specific creative data in each of the 3 domain modules as a new named export.
3. CREATIVE never emits `kind: 'user'`.
4. `source: 'creative-specialist'` consistently.
5. CREATIVE runs in BOTH `ARCHITECT_MODE_PIPELINE` and `runMasterPipeline` — verify each independently with its own test.
6. `synthesis.ts` merges all five specialists' output without collision in both modes — verify directly.
7. All 92 existing tests still pass, including TASK-009's MASTER-mode-specific tests (loop dry-check, maxRounds cap) — confirm these still behave correctly with a 5th specialist contributing to the requirements pool the loop's dry-check tracks.
8. No AI API calls, no network calls, word-boundary-safe keyword data if any is added.

## Decisions
| Decision | Choice | Reason |
|---|---|---|
| Pipeline wiring | Mirror `securitySpecialistPass.ts` for the stage file; update BOTH `ARCHITECT_MODE_PIPELINE` array AND `runMasterPipeline`'s imperative round-2 block | First specialist added post-MASTER-mode — both call sites must be updated, this is the key new risk in this task |
| `LOOP_STAGE_SOURCES` | Do NOT add `creative-specialist` to it | CREATIVE is a normal specialist, its output should be critiqued like the other four, unlike the loop's own meta-stages |
| Creative data location | Domain modules, parallel to existing considerations exports | Consistency |

## Implementation phases

### Phase A — Domain data + specialist logic
- Work: add `creativeConsiderations` to each of the 3 domain modules; implement `creativeSpecialist` mirroring the established structure and provenance rules — visual direction, originality, consistency, composition, style, creative opportunities.
- Files/systems: `packages/compiler/src/domains/*`, `packages/compiler/src/specialists/creative/*`.
- Verification: isolated unit tests for `creativeSpecialist` against each domain pass.
- Exit criteria: specialist produces sensible, domain-appropriate decisions when called directly.

### Phase B — Dual pipeline wiring + verification
- Work: register CREATIVE, wire `creativeSpecialistPass` into BOTH `ARCHITECT_MODE_PIPELINE` and `runMasterPipeline`'s round-2 block, verify synthesis merges correctly in both modes, verify MASTER's loop mechanism (dry-check, maxRounds cap) still functions correctly with the additional specialist's output in the requirements pool.
- Files/systems: `packages/compiler/src/specialists/_stubs/index.ts`, `packages/compiler/src/pipeline/index.ts`.
- Verification: full vitest suite (92 existing + new) passes; new ARCHITECT five-way merge test; new MASTER five-way merge test; re-run of TASK-009's loop-specific tests confirming continued correctness.
- Exit criteria: both `compileArchitect(...)` and `compileMaster(...)` demonstrably contain all five specialists' sourced items.

## Acceptance criteria
- [ ] `creativeSpecialist` implemented, mirrors established provenance discipline.
- [ ] Creative consideration data lives in domain modules.
- [ ] CREATIVE registered and executes in BOTH ARCHITECT and MASTER pipelines, correctly positioned in each.
- [ ] `synthesis.ts` correctly merges all five specialists' decisions in both modes.
- [ ] New tests: one per domain + ARCHITECT five-way merge + MASTER five-way merge.
- [ ] MASTER mode's loop dry-check and maxRounds cap still function correctly (re-verified, not just assumed).
- [ ] All 92 pre-existing tests still pass.
- [ ] `tsc --noEmit` clean.
- [ ] `state/CANONICAL_STATE.md` and `tasks/TASK_QUEUE.md` updated.

## Verification plan
- [ ] Build/compile (`tsc --noEmit`)
- [ ] Automated tests (full vitest suite)
- [ ] Static/type/lint checks
- [ ] Runtime/manual verification (confirm `apps/desktop` still typechecks/builds)
- [ ] Artifact inspection (test output as evidence)

## Risks and mitigations
- Risk: CREATIVE is added to ARCHITECT mode but forgotten in MASTER mode's imperative round-2 block (or vice versa), since they're two different code shapes (array vs. function calls).
  - Mitigation: requirement 5 — separate explicit tests for each mode, not just one shared test.
- Risk: a 5th specialist's output subtly changes MASTER's loop dry-check behavior (e.g. more items now cross some incidental threshold in critique's rules).
  - Mitigation: requirement 7 — explicitly re-run and confirm TASK-009's loop-specific tests.

## Stop conditions
Stop and report instead of expanding scope if:
- adding CREATIVE reveals a genuine problem in critique.ts/conflict.ts's loop-safety (not just an expected count change) that would require modifying those files
- a new requirement materially changes architecture or scope

## Final report format
- Summary:
- Files changed:
- Verification:
- Results:
- Known issues:
- Canonical state updated:
- Next task:
