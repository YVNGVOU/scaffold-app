# IMPLEMENTATION HANDOFF — TASK-002

## Mission
Replace the shallow keyword/regex-only English parsing in `packages/compiler`'s early pipeline stages with a real, deterministic, offline NLP layer — grammar-aware intent classification, negation-aware requirement extraction, and synonym-normalized domain/requirement matching — without breaking the existing pipeline API or its 16 passing tests.

## Canonical context
- Read first: `state/CANONICAL_STATE.md`, `state/PROJECT_BLUEPRINT.md`
- Task: `tasks/TASK-002.md`
- Original Phase 1 spec (for schema/pipeline conventions to follow): `docs/superpowers/specs/2026-08-11-lucid-compiler-phase1-design.md`
- Existing code to build on, do not fork/rewrite wholesale: `packages/compiler/src/pipeline/stages/{intentAnalysis,requirementExtraction,ambiguityDetection}.ts`, `packages/compiler/src/domains/*`

## User intent
> "well now its research time teach it the english shit idc how long it takes code it" — build real English-language understanding into the deterministic compiler. User is offline, fully autonomous mode, no further questions.

## Objective
The pipeline correctly handles negation ("must NOT include ads"), recognizes stated synonyms as satisfying domain checklist fields (e.g. "for iPhone" satisfies the web/game "platform" ambiguity field), and classifies intent from actual sentence grammar rather than only substring keyword hits — all fully offline, deterministic, zero AI API calls, and covered by new automated tests.

## Scope

### In scope
- Add `compromise` (or an equivalent pure-JS, zero-network, deterministic NLP library — document the choice if different) as a dependency of `packages/compiler` only.
- New module `packages/compiler/src/nlp/` — thin wrapper around the chosen library exposing exactly what the pipeline needs: `parseSentences(text)`, `getMainVerbPhrase(sentence)`, `isNegated(phrase)`, `extractModalClauses(text)` (must/should/needs to + their object, negation-aware), and a `synonymNormalize(text, lexicon)` helper.
- New module `packages/compiler/src/nlp/lexicon.ts` — synonym tables per concept (platform terms, app/website/game terms, etc.), used by domain modules and ambiguity detection instead of literal-string-only checklists.
- Rework `intentAnalysis.ts` to use `nlp` for verb/object extraction as the primary signal, falling back to the existing keyword table if parsing yields nothing usable (never throw, never regress to worse-than-current behavior on inputs the old version handled).
- Rework `requirementExtraction.ts` to use `extractModalClauses` for correct subject/negation attribution on "must/should/needs to" style sentences.
- Extend `ambiguityDetection.ts` and the 3 domain modules' checklists to consult the lexicon for synonym matches before flagging a field unresolved.
- New vitest cases added to `packages/compiler/test/` (existing file or a new `nlp.test.ts` — implementer's choice) covering: negated requirement correctly excluded/flagged as a negative constraint rather than a positive one; a synonym-only mention (no literal checklist string) resolving an ambiguity field; grammar-based intent classification on a sentence with no obvious keyword match; and confirmation all 16 original tests still pass unmodified in behavior (same inputs, same expected outputs) unless a change is a deliberate, documented bug fix.

### Explicitly out of scope
- No new AI API integration of any kind.
- No new specialists, domains, or modes.
- No UI changes (only touch `apps/desktop` if something breaks due to an API change, which should not happen).
- No attempt to build a general-purpose NLU/semantic-similarity system — scope is bounded to what intent analysis, requirement extraction, and ambiguity detection actually need.

## Current-state findings
- `packages/compiler` is pure TS, framework-agnostic, vitest-tested (16 tests passing as of TASK-001 close). Pipeline stages are one function per file, chained via a runner in `pipeline/index.ts` that also supports an optional `onStage` callback (added in TASK-001, do not remove).
- `requirementExtraction.ts` currently uses bounded regex quantifiers (`{0,200}`) after a Phase-E perf fix — any new implementation must not reintroduce unbounded/quadratic regex behavior on large input.
- Domain checklists (`domains/{web,game,branding}/index.ts`) currently do literal substring/keyword matching for ambiguity resolution.

## Requirements
1. Zero AI API calls, zero network calls, anywhere in the new `nlp/` module or its dependency (`compromise` and similar libraries are static/offline — verify the chosen library does not phone home).
2. `packages/compiler` remains testable headless via vitest alone; no new dependency on Tauri/apps/desktop.
3. All 16 pre-existing tests still pass (re-run and show output as evidence) unless a specific test's expected value is a deliberate, documented correctness fix — in which case note it explicitly in the final report.
4. New NLP-driven logic must degrade gracefully: if the parser produces nothing useful for a given input, fall back to prior keyword-based behavior rather than throwing or returning worse results than before.
5. No unbounded-complexity regex or parsing loops — test with a large input (e.g. 50k+ chars) and confirm sub-second completion, consistent with the Phase-E perf fix precedent.
6. Negation handling is the concrete, testable proof this task delivers real value: a test must demonstrate that "must not include microtransactions" produces a different (negated/excluded) requirement than "must include microtransactions" would — the old regex-only version could not reliably distinguish these.

## Decisions
| Decision | Choice | Reason |
|---|---|---|
| NLP library | `compromise` (npm), or a documented equivalent if unavailable/unsuitable | Pure JS, deterministic, offline, no native bindings, widely used for exactly this kind of lightweight grammar tagging — fits the "deterministic, no AI API" hard constraint |
| Scope | Intent/requirement/ambiguity stages only | Matches user's "teach it the english" request without ballooning into a full NLU rewrite of the whole pipeline |
| Fallback strategy | Keyword-based fallback preserved, not deleted | Existing tests and behavior must not regress; NLP layer augments, not replaces, until proven reliable |

## Implementation phases

### Phase A — NLP wrapper + lexicon
- Work: add dependency, build `nlp/index.ts` and `nlp/lexicon.ts` with the functions listed above, unit-test the wrapper module directly (not yet wired into the pipeline).
- Files/systems: `packages/compiler/src/nlp/*`, `packages/compiler/package.json`.
- Verification: new isolated tests for the wrapper functions pass; `tsc --noEmit` clean.
- Exit criteria: `parseSentences`, `extractModalClauses`, `isNegated`, `synonymNormalize` all work correctly on hand-written example sentences in tests.

### Phase B — Wire into pipeline stages
- Work: rework `intentAnalysis.ts`, `requirementExtraction.ts`, `ambiguityDetection.ts`, and domain checklist consultation to use the NLP layer with keyword fallback.
- Files/systems: `packages/compiler/src/pipeline/stages/{intentAnalysis,requirementExtraction,ambiguityDetection}.ts`, `packages/compiler/src/domains/*`.
- Verification: full vitest suite (old 16 + new cases) passes; large-input perf test passes; `tsc --noEmit` clean.
- Exit criteria: negation test, synonym test, and grammar-based-intent test all pass and demonstrably could not have passed against the old implementation (implementer should be able to explain why in the final report).

## Acceptance criteria
- [ ] `compromise` (or documented equivalent) added, zero network/API calls confirmed by source read.
- [ ] All 16 original tests still pass.
- [ ] New negation test passes and demonstrates a real behavior difference from pre-TASK-002 code.
- [ ] New synonym-resolves-ambiguity test passes.
- [ ] New grammar-based intent classification test passes.
- [ ] Large-input (50k+ char) test completes sub-second.
- [ ] `tsc --noEmit` clean across affected packages.
- [ ] `state/CANONICAL_STATE.md` and `tasks/TASK_QUEUE.md` updated on completion.

## Verification plan
- [ ] Build/compile (`tsc --noEmit`)
- [ ] Automated tests (full vitest suite, old + new)
- [ ] Static/type/lint checks
- [ ] Runtime/manual verification (not required to launch the desktop app for this task, since it's compiler-only — but if time permits, a quick `npm run tauri dev` smoke test that the app still builds/launches is good practice since `apps/desktop` depends on `packages/compiler`)
- [ ] Artifact inspection (test output shown as evidence)

## Risks and mitigations
- Risk: `compromise` or similar library significantly increases bundle size or has a transitive dependency doing something unexpected.
  - Mitigation: verify package contents/dependencies before committing to it; if unsuitable, document why and pick a lighter alternative (even a small hand-rolled tokenizer/POS heuristic is acceptable if a full library proves problematic — the requirement is "real grammar-aware parsing," not "must use this exact library").
- Risk: NLP-driven changes silently regress existing behavior on inputs the old keyword version handled correctly.
  - Mitigation: requirement 3/4 — all 16 original tests must still pass; fallback path preserved.
- Risk: Scope creep into building a much larger NLU system since "idc how long it takes" invites over-engineering.
  - Mitigation: stick to the Explicitly-out-of-scope list; this task ends at intent/requirement/ambiguity quality, not a general semantic engine.

## Stop conditions
Stop and report instead of expanding scope if:
- no suitable offline/deterministic NLP library is available in this environment and a hand-rolled alternative cannot meet the negation/synonym/grammar requirements credibly
- a fix would require breaking the existing public API in a way that cascades into `apps/desktop` — pause, document, and note it as a follow-up rather than pushing a breaking change through unreviewed (user is offline; breaking changes to a "finished" product should not ship unreviewed)

## Final report format
- Summary:
- Files changed:
- Verification:
- Results:
- Known issues:
- Canonical state updated:
- Next task:
