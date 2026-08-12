# TASK-010

- Timestamp: 2026-08-11
- Original request: "keep going, add the CREATIVE specialist next" — user, autonomous mode, offline.
- Priority: P1
- Dependencies: TASK-001 through TASK-009 (all done). Notably depends on TASK-009's MASTER mode, since this is the first specialist added after MASTER mode exists — it must be wired into BOTH pipelines, not just ARCHITECT.
- Status: DONE (2026-08-11) — independently re-verified 2026-08-11, no bugs found
- Classification: feature

## Normalized requirements
1. Implement `creativeSpecialist` in `packages/compiler/src/specialists/creative/index.ts`, same `Specialist` interface as the other four.
2. Real deterministic rule logic per the original brief's CREATIVE responsibilities: visual direction, originality, consistency, composition, style, creative opportunities — scoped to what's inferable from domain + extracted requirements + NLP-parsed input.
3. Per-domain creative consideration data added to the 3 domain modules (`creativeConsiderations` export), following the exact pattern the prior three specialists established.
4. Register in `SPECIALIST_REGISTRY` and wire into BOTH `ARCHITECT_MODE_PIPELINE` (new `creativeSpecialistPass` stage, positioned after `securitySpecialistPass` and before `critique`, per the established pattern) AND `runMasterPipeline`'s "round 2: independent specialist analysis" block in `pipeline/index.ts` (the 5 specialist passes now run there, in the same relative order as ARCHITECT).
5. Never emits `kind: 'user'` — only `inferred/default/recommendation`.
6. `source: 'creative-specialist'` consistently on all emitted items.
7. New tests: one per domain confirming sensible CREATIVE output; an end-to-end ARCHITECT-mode test confirming all 5 specialists' output appears together; an end-to-end MASTER-mode test confirming the same for MASTER mode specifically (MASTER has its own runner, don't assume the ARCHITECT test alone covers it).
8. Check whether adding a 5th specialist changes anything about MASTER mode's deliberation loop dry-check or `critique.ts`'s `LOOP_STAGE_SOURCES` exclusion list — it shouldn't (CREATIVE is a normal specialist like the other four, not a loop-meta-stage), but verify with a test rather than assuming, since the loop mechanism is safety-critical (per TASK-009's known crash history).
9. Must not break any of the existing 92 tests.
10. No AI API calls, no network calls, no bare-substring keyword matching (word-boundary regex per TASK-006's established convention) if new domain keyword data is added.
11. Update `state/CANONICAL_STATE.md` and task/queue status on completion.

## Explicitly out of scope
- QA/CONSTRAINT specialists — still stubs (2 remain after this task).
- New domains, new modes, UI changes (unless required to not break the build).
- Any change to critique.ts/conflict.ts logic itself beyond what's needed to confirm CREATIVE integrates safely (requirement 8 is a verification step, not license to modify those files unless something is genuinely found broken).
