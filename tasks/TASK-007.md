# TASK-007

- Timestamp: 2026-08-11
- Original request: continuation of autonomous overnight work; TASK-005 Verifier recommended a fourth specialist (SECURITY or CONSTRAINT) now that a real critique/conflict engine exists to reason over its output too.
- Priority: P1
- Dependencies: TASK-001 through TASK-006 (all done).
- Status: ACTIVE
- Classification: feature

## Normalized requirements
1. Implement `securitySpecialist` in `packages/compiler/src/specialists/security/index.ts`, same `Specialist` interface as the other three.
2. Real deterministic rule logic per the original brief's SECURITY responsibilities: privacy concerns, authentication, authorization, data exposure, unsafe assumptions, security requirements — scoped to what's inferable from domain + extracted requirements + NLP-parsed input.
3. Per-domain security consideration data added to the 3 domain modules (`securityConsiderations` export), following the exact pattern `technicalConsiderations`/`uxConsiderations` established.
4. Register in `SPECIALIST_REGISTRY` and wire into the pipeline via a `securitySpecialistPass` stage mirroring `technicalSpecialistPass.ts`/`uxSpecialistPass.ts`, inserted into `ARCHITECT_MODE_PIPELINE` and `ARCHITECT_MODE_STAGE_NAMES` after `uxSpecialistPass` (before critique/conflict, so critique/conflict can reason over SECURITY's output too — verify this ordering is correct given critique/conflict already run after all three prior specialists).
5. Never emits `kind: 'user'` — only `inferred/default/recommendation`.
6. `source: 'security-specialist'` consistently on all emitted items.
7. New tests: one per domain confirming sensible SECURITY output, plus an end-to-end test confirming architect + technical + ux + security sourced items all appear together in one compiled result.
8. Bonus (not required, but check): does adding SECURITY's output give the critique/conflict engine (TASK-005) new material to reason over? If a genuine additional conflict-detection rule becomes obviously available (e.g. a security requirement contradicting a UX convenience recommendation), you may add one small additional conflict rule — but this is optional, don't force it if nothing genuine presents itself.
9. Must not break any of the existing 53 tests.
10. No AI API calls, no network calls.
11. Update `state/CANONICAL_STATE.md` and task/queue status on completion.

## Explicitly out of scope
- CREATIVE/QA/CONSTRAINT specialists — still stubs.
- New domains, new modes, UI changes (unless required to not break the build).
- Do not force a new conflict rule if nothing genuine presents itself (see requirement 8).
