# TASK-005

- Timestamp: 2026-08-11
- Original request: continuation of autonomous overnight work; follows TASK-004 Verifier's explicit recommendation to build the real critique/conflict-detection engine next, now that ARCHITECT+TECHNICAL+UX produce genuine cross-specialist material to reconcile (e.g. a multiplayer-networking constraint from TECHNICAL vs. a pacing/tension-curve recommendation from UX).
- Source/context: `critiquePassthrough.ts` and `conflictPassthrough.ts` have been no-op stub stages since TASK-001; this task replaces them with real logic.
- Priority: P1
- Dependencies: TASK-001 through TASK-004 (all done).
- Status: ACTIVE
- Classification: feature, architecture

## Normalized requirements
1. Replace `critiquePassthrough.ts` with a real `critique.ts` stage: examines all `RequirementItem`s and `ArchitectureNote`s accumulated so far (from all specialists) and flags weaknesses — e.g. low-confidence items, items with no evidence, items whose `kind` is `'recommendation'` but duplicate an existing `'inferred'`/`'default'` item's text closely (near-duplicate detection), or domain-checklist items that remain `'unresolved'` after all specialists ran.
2. Replace `conflictPassthrough.ts` with a real `conflict.ts` stage: detects genuine contradictions between decisions from different specialists — e.g. one specialist's item implies X and another's implies NOT-X for the same concern (a real example the domain data should support: TECHNICAL recommending a performance/scalability constraint that structurally conflicts with a UX recommendation, or an explicit user requirement that contradicts a `nonNegotiables`/`constraints` item). Deterministic rule-based detection — pattern/keyword-based contradiction rules per concern area, not free-form reasoning.
3. Both stages emit their findings as new `RequirementItem`s with a clear `kind` — critique findings should use `kind: 'recommendation'` (never fabricate user intent) with `source: 'critique-engine'`; detected conflicts should be recorded distinctly — either a new `RequirementItem.kind` value or an existing one plus an explicit `status: 'pending'`/`'rejected'` with evidence naming both conflicting sources. Check `packages/schema`'s `RequirementItem.kind` union before deciding whether to extend it (extending the schema is allowed if genuinely needed, but must be backward compatible — additive only, don't remove/rename existing kind values).
4. When a real conflict is detected, the engine must not silently pick a winner — record both sides, mark the conflict `status: 'pending'` (unresolved), and surface it so the UI's existing right-hand panel (which already renders `kind !== 'user'` items) shows it to the user. If a conflict-resolution capability is added, it must be traceable (evidence shows why one side was preferred), never silent overwriting — same provenance discipline as the rest of the system.
5. New vitest coverage: at least one test proving critique fires on a genuinely weak/unresolved item, one proving conflict detection catches a real deterministic contradiction between two specialists' output (construct a domain/input scenario where this is genuinely true, not contrived to trivially pass), and one proving no false-positive conflict is raised on a normal, non-contradictory compiled result.
6. Must not break any of the existing 42 tests.
7. No AI API calls, no network calls — same hard constraint as always. This is pattern/rule-based deterministic logic, not free-form judgment.
8. Update `state/CANONICAL_STATE.md` and task/queue status on completion.

## Explicitly out of scope
- No new specialists this task (QA/SECURITY/CONSTRAINT/CREATIVE still stubs).
- No conflict *auto-resolution* UI or MASTER-mode multi-round deliberation — this task only needs the engine to detect and record conflicts/critique findings, not resolve them interactively.
- No UI changes required unless the schema is extended in a way the existing UI can't render (should not happen if additive and rendered the same way other non-'user' items already are).
