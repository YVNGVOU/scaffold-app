# MASTER Mode — Design

## Context
Made autonomously per explicit user authorization ("keep going, design and build MASTER mode") during an overnight unattended session — normally this would go through interactive brainstorming, but the user is offline and has authorized proceeding. Decisions below are reasoned from the original build brief's own MASTER-mode description (which is unusually specific — a 9-round structure is given verbatim) plus what's already built (4 specialists, critique engine, conflict engine, synthesis, output validation), rather than invented from nothing.

## What the brief specifies
```
ROUND 1  Proposal / expansion
ROUND 2  Independent specialist analysis
ROUND 3  Critique
ROUND 4  Conflict detection
ROUND 5  Alternative generation
ROUND 6  Decision scoring
ROUND 7  Synthesis
ROUND 8  Quality validation
ROUND 9  MASTER COMPILE
```
"The number of rounds should be configurable." MASTER should not simply run each specialist once — it's meant to be a deliberation system, not a single pass with a different label.

## Mapping to existing deterministic building blocks
The system has no LLM to "deliberate" with — deliberation here means: run the deterministic critique/conflict cycle more than once, so that a finding surfaced in round N (e.g. a conflict) can be reflected in what gets scored/synthesized, and so unresolved tension has more than one chance to be caught. This is the honest, non-fake version of "multi-round deliberation" for a rule-based system.

| Brief's round | Implementation |
|---|---|
| 1. Proposal/expansion | New `requirementExpansion` stage — runs after `requirementExtraction`, expands terse user input into related, adjacent requirement categories the domain template implies but the user didn't state (marked `kind: 'inferred'`, never `'user'`). This is new logic, not previously built. |
| 2. Independent specialist analysis | Existing: `architectSpecialistPass`, `technicalSpecialistPass`, `uxSpecialistPass`, `securitySpecialistPass` — reused unchanged. |
| 3. Critique | Existing: `critique` stage, reused unchanged. |
| 4. Conflict detection | Existing: `conflict` stage, reused unchanged. |
| 5. Alternative generation | New `alternativeGeneration` stage — for each unresolved conflict from round 4, generates a named alternative resolution (not auto-applied — recorded as a `recommendation` with `status: 'pending'`, evidence naming the conflict it addresses). |
| 6. Decision scoring | New `decisionScoring` stage — assigns/normalizes a `confidence`-based score to every accumulated decision using existing `confidence`/`evidence`/`status` fields (no new schema needed), and flags the highest-risk unresolved items for a second look. |
| 7. Synthesis | Existing: `synthesis` stage, reused unchanged. |
| 8. Quality validation | Existing: `outputValidation` stage, reused unchanged (already does structural checks per Phase 1 spec). |
| 9. MASTER COMPILE | The final `PipelineState.compiled` result, same shape as ARCHITECT/QUICK — no new type needed, just richer content and a `stagesRun` history showing the full round trail. |

## The "multiple rounds" mechanism
Rounds 3–6 (critique → conflict → alternative generation → decision scoring) form a loop that can genuinely re-run: after round 6, if new conflicts were found as a byproduct of scoring/alternative generation (rare but possible — e.g. an alternative itself gets critiqued), the loop repeats from round 3 up to a configurable `maxRounds` (default 2, per "should be configurable" — matches this project's existing pattern of sensible small defaults, e.g. critique's 0.65 confidence floor). This is a genuine **loop-until-dry** pattern: stop early if a round produces zero new critique/conflict/alternative items, don't force a fixed count of no-op rounds. Round 1–2 and 7–9 run exactly once each (they aren't iterative by nature — expansion happens once, specialists run once, synthesis is a final step).

This means "9 rounds" isn't 9 sequential pipeline stages 1:1 — it's 6 real stages (`requirementExpansion`, 4 specialist passes counted as one "round" since they're independent/parallel-in-spirit, `critique`, `conflict`, `alternativeGeneration`, `decisionScoring`, `synthesis`, `outputValidation`) with rounds 3–6 able to loop. `PipelineState.stagesRun` will show the real executed sequence including repeated entries if the loop runs more than once, so the UI's pipeline stepper reflects genuine work, not a fake fixed 9-step animation.

## Public API
- `MASTER_MODE_PIPELINE` is not a static array like `ARCHITECT_MODE_PIPELINE`/`QUICK_MODE_PIPELINE` (since it loops) — instead `runMasterPipeline(rawInput, options?)` is a function that runs the fixed stages plus the deliberation loop directly, still emitting `onStage` callbacks for every stage execution (including repeated loop iterations, distinguished by a round-number suffix in the emitted stage name, e.g. `"critique (round 2)"`) so the UI stepper still works generically.
- `options` gains `maxRounds?: number` (default 2), passed through from the UI if a control is added, or left as the default otherwise.
- `compileMaster(rawInput, opts?): CompiledPrompt` convenience export, mirroring `compileArchitect`/`compileQuick`.

## What this deliberately does NOT do
- No LLM calls, ever — the "deliberation" is a deterministic re-run of existing rule-based stages, not simulated reasoning.
- No new specialists (CREATIVE/QA/CONSTRAINT) — MASTER mode runs the same 4 specialists ARCHITECT does; adding more specialists is a separate, independent task.
- No auto-resolution of conflicts — round 5's alternatives are recorded as recommendations, never silently applied, same provenance discipline as everywhere else in this system.
- No UI changes required for correctness (a MASTER option in the existing toggle is a reasonable additive follow-up, same risk profile as TASK-008's QUICK toggle, left to the Implementer's judgment same as before).

## Explicitly out of scope for TASK-009
- A UI round-count control (default `maxRounds` is fine for now).
- Persisting round-by-round history to SQLite beyond what's already stored (the final compiled result + `mode: 'master'`).
