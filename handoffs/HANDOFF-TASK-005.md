# IMPLEMENTATION HANDOFF — TASK-005

## Mission
Replace the no-op `critiquePassthrough`/`conflictPassthrough` pipeline stages with real, deterministic, rule-based critique and conflict-detection logic that examines the accumulated output of ARCHITECT, TECHNICAL, and UX and surfaces weaknesses and genuine contradictions — without fabricating user intent or silently resolving anything.

## Canonical context
- Read first: `state/CANONICAL_STATE.md`, `tasks/TASK-005.md`
- Stages to replace: `packages/compiler/src/pipeline/stages/critiquePassthrough.ts`, `packages/compiler/src/pipeline/stages/conflictPassthrough.ts`
- Pipeline wiring: `packages/compiler/src/pipeline/index.ts` (these stages are already in `ARCHITECT_MODE_PIPELINE` between the specialist passes and `synthesis` — you're replacing their implementation, not their position, unless you find a strong reason to move them; document if so)
- State/types: `packages/compiler/src/pipeline/state.ts` (`Decision`, `PipelineState`, `RequirementCategory`), `packages/schema/src/index.ts` (`RequirementItem`, its `kind` union)
- Specialists whose output you're now cross-referencing: `packages/compiler/src/specialists/{architect,technical,ux}/index.ts`

## User intent
> Continuation of autonomous overnight build. TASK-004's Verifier explicitly recommended this as the next highest-value item: "There's now genuine cross-specialist material to reason about... the longer critique/conflict detection is deferred while more specialists are added, the more surface area accumulates unreconciled."

## Objective
After all specialists run, a new critique stage flags weak/unresolved/low-confidence items, and a new conflict stage detects genuine deterministic contradictions between different specialists' output (or between an explicit user requirement and a specialist-introduced constraint), recording both sides with evidence rather than silently picking a winner. The user-facing right panel (unchanged, already renders `kind !== 'user'` items) now shows real critique/conflict findings instead of nothing.

## Scope

### In scope
- `packages/compiler/src/pipeline/stages/critique.ts` (rename from `critiquePassthrough.ts`, update all references) — real logic per TASK-005.md requirement 1.
- `packages/compiler/src/pipeline/stages/conflict.ts` (rename from `conflictPassthrough.ts`) — real logic per requirement 2.
- Possible additive extension to `packages/schema`'s `RequirementItem.kind` union if genuinely needed to represent a "conflict" distinctly from existing kinds — inspect the current union first (`'user' | 'inferred' | 'default' | 'assumption' | 'recommendation' | 'unresolved' | 'rejected'` per the original Phase 1 spec, verify against the actual current type) before deciding whether a new kind is warranted or whether existing kinds + `status`/`evidence` fields are sufficient. Prefer NOT extending the schema if the existing fields can represent this — simpler is better — but don't force-fit if it genuinely doesn't work.
- At least one concrete, deterministic conflict-detection rule that's real, not decorative — e.g.: TECHNICAL's `game` domain considerations include multiplayer/networking items; UX's `game` domain considerations include pacing/tension-curve items for horror-specific flow. If a genuine structural tension exists in the domain data as currently written, encode a rule that catches it. If the current domain data doesn't naturally produce a detectable conflict, you may need to add ONE small, clearly-justified additional considerration to a domain module (documented, not silently invented) specifically to make the conflict-detection rule meaningfully testable — but don't restructure existing domain data just to manufacture a conflict.
- New tests per TASK-005.md requirement 5.

### Explicitly out of scope
- Auto-resolution of conflicts, MASTER-mode deliberation, new specialists, UI changes beyond what's needed if the schema changes.

## Current-state findings
- `PipelineState.decisions: Decision[]` holds every specialist's raw output in order; `requirements`/`requirementCategories`/`architectureNotes` are the flattened accumulated form `synthesis.ts` reads from. Critique/conflict stages should read from these accumulated arrays (post-specialist-passes, pre-synthesis) since that's the pipeline position they already occupy.
- `synthesis.ts` needed zero changes across TASK-003 and TASK-004 because it merges by iterating full arrays — new critique/conflict-emitted `RequirementItem`s should follow the exact same shape (`{type: 'requirement', category, item}` pushed the same way specialists do) so synthesis picks them up for free. Verify this assumption; don't assume it works without a test proving it.
- `RequirementItem` has a `status: 'accepted' | 'pending' | 'rejected'` field already (per the Phase 1 spec) — likely sufficient to mark unresolved conflicts as `'pending'` without needing a new `kind`.

## Requirements
1. Both new stages are pure functions `(state: PipelineState) => PipelineState`, one file each, same shape as every other stage.
2. Critique findings: `source: 'critique-engine'`, `kind: 'recommendation'`, real evidence referencing which item(s)/specialist(s) triggered the finding.
3. Conflict findings: clearly attributable to both conflicting sources in `evidence` (e.g. `["technical-specialist: <text>", "ux-specialist: <text>"]`), `status: 'pending'`, never silently dropped or auto-resolved.
4. No fabricated `kind: 'user'` anywhere in either new stage.
5. Deterministic, rule-based only — explicit pattern/keyword rules per concern area, documented in code comments as to what real-world tension each rule is meant to catch. No vague/unfalsifiable "detects conflicts" claims — each rule must be testable and tested.
6. All 42 pre-existing tests still pass unmodified.
7. No AI API calls, no network calls, no unbounded-complexity parsing.
8. If `packages/schema` is touched, `apps/desktop`'s `tsc --noEmit`/`vite build` must still succeed (schema changes are the most likely thing to ripple into the UI, since `CompiledOutput`/`DecisionsPanel` render `RequirementItem` fields directly).

## Decisions
| Decision | Choice | Reason |
|---|---|---|
| Stage file naming | Rename `*Passthrough.ts` → `critique.ts`/`conflict.ts` | They're no longer passthroughs; keep code honest about what it does |
| Schema extension | Implementer's judgment, prefer NOT extending `RequirementItem.kind` if existing fields suffice | Simpler is better; only extend if genuinely needed, and only additively |
| Conflict rule scope | At least one real, testable, deterministic rule; more if natural | Depth over breadth — one genuine catch beats five decorative ones |

## Implementation phases

### Phase A — Critique stage
- Work: implement `critique.ts`, replacing `critiquePassthrough.ts` in the pipeline wiring.
- Files/systems: `packages/compiler/src/pipeline/stages/critique.ts`, `pipeline/index.ts` (update import/reference), delete or repurpose `critiquePassthrough.ts`.
- Verification: unit test(s) proving critique fires on a deliberately weak/unresolved input scenario.
- Exit criteria: critique stage produces real, evidenced findings; all existing tests still pass.

### Phase B — Conflict stage
- Work: implement `conflict.ts`, replacing `conflictPassthrough.ts`, with at least one genuine deterministic contradiction rule spanning two specialists.
- Files/systems: `packages/compiler/src/pipeline/stages/conflict.ts`, `pipeline/index.ts`, domain modules if a small additive tweak is genuinely needed to make a rule testable (document why).
- Verification: test proving the rule fires on a real contradictory scenario, and a negative-control test proving it does NOT fire on a normal non-contradictory input (avoid false positives).
- Exit criteria: conflict findings correctly reference both sides with evidence, `status: 'pending'`, and synthesis correctly includes them in the final `CompiledPrompt` without silently resolving them.

## Acceptance criteria
- [ ] `critique.ts` implemented, real logic, `source: 'critique-engine'`.
- [ ] `conflict.ts` implemented, real logic, at least one genuine deterministic cross-specialist contradiction rule.
- [ ] Conflicts recorded with evidence naming both sides, `status: 'pending'`, never silently resolved.
- [ ] New tests: critique-fires case, conflict-fires case, conflict-does-not-false-positive case.
- [ ] All 42 pre-existing tests still pass.
- [ ] `tsc --noEmit` clean on all packages; `apps/desktop` still builds.
- [ ] `state/CANONICAL_STATE.md` and `tasks/TASK_QUEUE.md` updated.

## Verification plan
- [ ] Build/compile (`tsc --noEmit`)
- [ ] Automated tests (full vitest suite)
- [ ] Static/type/lint checks
- [ ] Runtime/manual verification (confirm `apps/desktop` still typechecks/builds)
- [ ] Artifact inspection (test output as evidence)

## Risks and mitigations
- Risk: conflict rules are contrived/decorative and don't catch anything real, or worse, produce false positives on normal input.
  - Mitigation: requirement 5 (testable, documented rules) + explicit negative-control test.
- Risk: schema extension breaks the UI.
  - Mitigation: requirement 8 — verify `apps/desktop` build after any schema change; prefer not extending schema if avoidable.

## Stop conditions
Stop and report instead of expanding scope if:
- a schema change needed for correct conflict representation would require nontrivial UI rework beyond what the existing `DecisionsPanel`/`CompiledOutput` components already handle generically
- a new requirement materially changes architecture or scope

## Final report format
- Summary:
- Files changed:
- Verification:
- Results:
- Known issues:
- Canonical state updated:
- Next task:
