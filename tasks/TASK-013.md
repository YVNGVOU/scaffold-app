# TASK-013

- Timestamp: 2026-08-11
- Original request: "make the qa" — user, following up after seeing the running app. Interpreted as: add the QA specialist as the sixth real specialist, continuing the established pattern (QA and CONSTRAINT are the two remaining stubs).
- Priority: P1
- Dependencies: TASK-001 through TASK-010 (all done). Same dual-pipeline-wiring pattern as TASK-010 (must wire into both ARCHITECT_MODE_PIPELINE and runMasterPipeline's round-2 block).
- Status: QUEUED (runs independently of TASK-011/012 — compiler-package-only work, no UI file conflicts)
- Classification: feature

## Normalized requirements
1. Implement `qaSpecialist` in `packages/compiler/src/specialists/qa/index.ts`, same `Specialist` interface as the other five.
2. Real deterministic rule logic per the original brief's QA responsibilities: attempt to break the specification, identify missing requirements, identify contradictions, generate acceptance criteria, generate test cases, identify failure states.
3. Per-domain QA consideration data added to the 3 domain modules (`qaConsiderations` export), following the established pattern.
4. Register in `SPECIALIST_REGISTRY` and wire into BOTH `ARCHITECT_MODE_PIPELINE` (new `qaSpecialistPass` stage, positioned after `creativeSpecialistPass` and before `critique`) AND `runMasterPipeline`'s round-2 block (after the `creativeSpecialistPass` call).
5. Never emits `kind: 'user'` — only `inferred/default/recommendation`.
6. `source: 'qa-specialist'` consistently.
7. New tests: one per domain + ARCHITECT six-way merge test + a separate MASTER six-way merge test (following TASK-010's precedent of testing both pipelines independently).
8. Re-verify MASTER mode's loop dry-check and `maxRounds` cap still function correctly with a 6th specialist contributing to the requirements pool (same check TASK-010 required).
9. Must not break any of the existing 98 tests.
10. No AI API calls, no network calls, word-boundary-safe keyword matching if new domain keyword data is added.
11. Update `state/CANONICAL_STATE.md` and task/queue status on completion.

## Explicitly out of scope
- CONSTRAINT specialist — the last remaining stub, separate task.
- New domains, new modes, UI changes.
- Any change to critique.ts/conflict.ts's `LOOP_STAGE_SOURCES` (QA is a normal specialist, not a loop-meta-stage — do not add it there).
