# TASK-009

- Timestamp: 2026-08-11
- Original request: "keep going, design and build MASTER mode" — explicit user authorization to both design and implement autonomously, user offline.
- Priority: P1
- Dependencies: TASK-001 through TASK-008 (all done).
- Status: ACTIVE
- Classification: feature, architecture

## Design
See `docs/superpowers/specs/2026-08-11-master-mode-design.md` — authoritative for this task. Summary: MASTER mode maps the brief's 9-round structure onto existing building blocks (4 specialists, critique, conflict, synthesis, output validation) plus two new stages (`requirementExpansion` for round 1, `alternativeGeneration` for round 5, `decisionScoring` for round 6), with rounds 3–6 (critique/conflict/alternatives/scoring) forming a genuine loop-until-dry deliberation cycle, capped by a configurable `maxRounds` (default 2).

## Normalized requirements
1. New stage `packages/compiler/src/pipeline/stages/requirementExpansion.ts` — expands terse input into domain-implied adjacent requirement categories, `kind: 'inferred'` only, never `'user'`.
2. New stage `packages/compiler/src/pipeline/stages/alternativeGeneration.ts` — for each `status: 'pending'` conflict from the `conflict` stage, generates a named alternative resolution as a `kind: 'recommendation'`, `status: 'pending'` item, evidence naming the conflict addressed. Never auto-resolves.
3. New stage `packages/compiler/src/pipeline/stages/decisionScoring.ts` — normalizes/re-scores accumulated decisions using existing `confidence`/`evidence`/`status` fields; flags highest-risk unresolved items.
4. `runMasterPipeline(rawInput, options?)` in `pipeline/index.ts` — runs requirementExpansion → 4 specialist passes → deliberation loop (critique → conflict → alternativeGeneration → decisionScoring, repeat while new items found, capped at `options.maxRounds ?? 2`) → synthesis → outputValidation. `onStage` callback fires for every stage execution including repeated loop rounds (stage name suffixed with round number on repeats).
5. `compileMaster(rawInput, opts?): CompiledPrompt` convenience export in `packages/compiler/src/index.ts`, mirroring `compileArchitect`/`compileQuick`.
6. Loop-until-dry: if a round of critique/conflict/alternativeGeneration/decisionScoring produces zero new items compared to the prior round, stop looping early rather than forcing `maxRounds` iterations.
7. All existing 71 tests must still pass unchanged; ARCHITECT and QUICK modes' behavior must be bit-for-bit unaffected (MASTER is purely additive, reusing but never modifying shared stages).
8. New tests: MASTER mode compiles successfully end-to-end without throwing (same edge cases as ARCHITECT/QUICK); MASTER mode's output is demonstrably richer than ARCHITECT's for an input that has a genuine conflict (e.g. the existing horror+multiplayer game scenario) — should include alternative-generation output ARCHITECT mode doesn't produce; a test proving the deliberation loop actually stops early on a dry round rather than always running `maxRounds` times; a test proving `maxRounds` is respected as a cap.
9. No AI API calls, no network calls, no unbounded loop (the `maxRounds` cap is a hard backstop even if loop-until-dry logic has a bug).
10. UI: optional MASTER option added to the existing mode toggle, same risk-tolerant judgment call as TASK-008's QUICK toggle — implementer's discretion, document the decision either way. If added, confirm the SQLite `mode` column correctly records `'master'`.
11. Update `state/CANONICAL_STATE.md` and task/queue status on completion.

## Explicitly out of scope
- New specialists (CREATIVE/QA/CONSTRAINT).
- UI round-count control.
- Auto-resolution of conflicts.
- Persisting round-by-round history beyond the final compiled result.
