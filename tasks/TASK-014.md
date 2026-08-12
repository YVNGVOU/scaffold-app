# TASK-014

- Timestamp: 2026-08-11
- Original request: "keep going, add CONSTRAINT specialist next" — user, continuing autonomous work.
- Priority: P1
- Dependencies: TASK-001 through TASK-013 (all done). Same dual-pipeline-wiring pattern as TASK-010/013.
- Status: ACTIVE
- Classification: feature

## Normalized requirements
1. Implement `constraintSpecialist` in `packages/compiler/src/specialists/constraint/index.ts`, same `Specialist` interface as the other six.
2. Real deterministic rule logic per the original brief's CONSTRAINT responsibilities: identify impossible combinations, detect conflicting requirements, identify assumptions, distinguish hard requirements from preferences.
3. Note the overlap with the existing `conflict.ts` engine (TASK-005) — CONSTRAINT's brief is about identifying constraint-level tensions (e.g. "no budget" + "needs a custom game engine" is an impossible combination) as part of specialist analysis (round 2 in MASTER terms), which is a different pipeline position/purpose than `conflict.ts`'s cross-specialist-decision conflict detection (round 4). Do not merge or duplicate `conflict.ts`'s logic — CONSTRAINT should look at raw requirements/domain data for infeasibility, while `conflict.ts` looks at specialist decisions for contradictions. Keep the two conceptually and functionally distinct.
4. Per-domain constraint consideration data added to the 3 domain modules (`constraintConsiderations` export), following the established pattern — e.g. per-domain known-impossible or high-risk combinations (budget vs. scope, timeline vs. complexity, platform vs. feature availability).
5. Register in `SPECIALIST_REGISTRY` and wire into BOTH `ARCHITECT_MODE_PIPELINE` (new `constraintSpecialistPass` stage, positioned after `qaSpecialistPass` and before `critique`) AND `runMasterPipeline`'s round-2 block (after the `qaSpecialistPass` call) — this is now the LAST specialist slot in both pipelines, since all 7 from the original brief will be registered after this task.
6. Never emits `kind: 'user'` — only `inferred/default/recommendation`. Note: CONSTRAINT's job of "distinguishing hard requirements from preferences" means it may re-classify an item's understood category (e.g. flag something extracted as a preference that reads like a non-negotiable) — if so, this must be done by emitting a new `recommendation` item pointing at the original, never by mutating the original item in place (same append-only provenance discipline as everywhere else).
7. `source: 'constraint-specialist'` consistently.
8. New tests: one per domain + ARCHITECT seven-way merge test + a separate MASTER seven-way merge test (all 7 specialists now present, following TASK-010/013's precedent).
9. Re-verify MASTER mode's loop dry-check and `maxRounds` cap still function correctly with a 7th specialist contributing to the requirements pool.
10. Must not break any of the existing tests (105 as of TASK-013, plus TASK-012's UI work which shouldn't have touched compiler tests).
11. No AI API calls, no network calls, word-boundary-safe keyword matching if new domain keyword data is added.
12. Update `state/CANONICAL_STATE.md` and task/queue status on completion — this closes out the full 7-specialist roster from the original brief, worth noting as a milestone.

## Explicitly out of scope
- Any modification to `conflict.ts`'s existing logic (requirement 3 — keep them distinct, don't consolidate).
- New domains, new modes, further UI changes (TASK-012 already reorganized the UI to scale to more specialists — CONSTRAINT's output should just flow through that existing grouping/collapsing scheme without further changes).
