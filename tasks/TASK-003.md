# TASK-003

- Timestamp: 2026-08-11
- Original request: "keep going, do the TECHNICAL specialist next" — user, fully autonomous mode, offline, no further questions.
- Source/context: Phase 2 starting point already queued in state/CANONICAL_STATE.md's "Next intended work" since TASK-001 closed: prove the `_stubs`/`SPECIALIST_REGISTRY` pattern generalizes beyond ARCHITECT.
- Priority: P1
- Dependencies: TASK-001 (done), TASK-002 (done) — builds on existing pipeline, specialist interface, and NLP layer.
- Status: ACTIVE
- Classification: feature

## Normalized requirements
1. Implement `technicalSpecialist` in `packages/compiler/src/specialists/technical/index.ts`, matching the `Specialist` interface (`(state: PipelineState) => Decision[]`) exactly as `architectSpecialist` does.
2. Real deterministic rule logic per the original brief's TECHNICAL responsibilities: technology requirements, implementation constraints, dependencies, compatibility, performance, scalability, technical risks — scoped realistically to what's inferable from domain + extracted requirements + NLP-parsed input, not fabricated.
3. Per-domain technical rule tables for the 3 existing domains (web, game, branding) — e.g. web: hosting/framework/browser-compat considerations; game: engine/platform/performance considerations; branding: file-format/deliverable/print-vs-digital considerations. Follow the existing domain module pattern (`domains/{web,game,branding}/index.ts`) — add a `technicalConsiderations` (or similarly named) export per domain rather than hardcoding domain logic inside the specialist itself, consistent with the "domain logic lives in domain modules" principle from the Phase 1 spec.
4. Wire `technicalSpecialist` into the actual registry (`SPECIALIST_REGISTRY['technical'] = technicalSpecialist`, uncomment/replace the stub comment) AND into the pipeline so it actually runs in ARCHITECT mode alongside `architectSpecialist` — check `pipeline/index.ts`'s `ARCHITECT_MODE_PIPELINE` and `architectSpecialistPass` stage; either generalize that stage to run all registered specialists for the current mode, or add a `technicalSpecialistPass` stage following the same pattern as `architectSpecialistPass`. Prefer the approach that best matches the existing pipeline architecture — inspect it first before deciding.
5. Same provenance rules as ARCHITECT: TECHNICAL never emits `kind: 'user'` on anything it introduces — only `'inferred' | 'default' | 'recommendation'`.
6. `synthesis.ts` must correctly merge decisions from both specialists into one `CompiledPrompt` without one overwriting the other's output.
7. New vitest coverage: at least one test per domain confirming TECHNICAL emits sensible decisions, plus a test confirming both ARCHITECT and TECHNICAL decisions appear together in the final compiled output for a given input.
8. Must not break any of the existing 32 tests.
9. Update `state/CANONICAL_STATE.md` and task/queue status on completion.

## Explicitly out of scope
- No UX/CREATIVE/QA/SECURITY/CONSTRAINT specialist logic yet (still stubs).
- No new domains, no new modes.
- No UI changes required unless the pipeline API changes in a way that breaks `apps/desktop` (should not happen if additive).
