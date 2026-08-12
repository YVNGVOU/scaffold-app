# TASK-004

- Timestamp: 2026-08-11
- Original request: continuation of autonomous overnight work ("keep going, don't stop till it's done"); this specific task follows the TASK-003 Verifier's recommendation to add a third specialist (UX) next, as the cheapest way to further validate the registry pattern scales past N=2 before investing in the critique/conflict engine or QUICK/MASTER modes.
- Source/context: state/CANONICAL_STATE.md "Next intended work" after TASK-003 verification.
- Priority: P1
- Dependencies: TASK-001, TASK-002, TASK-003 (all done) — mirrors the TECHNICAL specialist's implementation pattern exactly.
- Status: ACTIVE
- Classification: feature

## Normalized requirements
1. Implement `uxSpecialist` in `packages/compiler/src/specialists/ux/index.ts`, same `Specialist` interface as `architectSpecialist`/`technicalSpecialist`.
2. Real deterministic rule logic per the original brief's UX responsibilities: user flow, interaction hierarchy, accessibility, usability, information architecture, edge cases — scoped to what's inferable from domain + extracted requirements + NLP-parsed input.
3. Per-domain UX consideration data added to the 3 domain modules (e.g. `uxConsiderations` export), following the same "data in domain module, logic in specialist" split used for `technicalConsiderations`.
4. Register in `SPECIALIST_REGISTRY` and wire into the actual running pipeline (a `uxSpecialistPass` stage mirroring `technicalSpecialistPass`, inserted into `ARCHITECT_MODE_PIPELINE` and `ARCHITECT_MODE_STAGE_NAMES`).
5. Never emits `kind: 'user'` — only `inferred/default/recommendation`.
6. `source: 'ux-specialist'` consistently on all emitted items.
7. New tests: one per domain confirming sensible UX output, plus an end-to-end test confirming architect + technical + ux sourced items all appear together in one compiled result.
8. Must not break any of the existing 37 tests.
9. Update `state/CANONICAL_STATE.md` and task/queue status on completion.

## Explicitly out of scope
- CREATIVE/QA/SECURITY/CONSTRAINT specialists — still stubs.
- No new domains, no new modes, no UI changes (unless required to not break the build).
