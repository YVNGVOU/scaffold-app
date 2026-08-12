# TASK-002

- Timestamp: 2026-08-11
- Original request: "well now its research time teach it the english shit idc how long it takes code it" — user request (verbatim, informal), interpreted as: give the compiler real English-language understanding instead of shallow keyword/regex matching, so intent analysis, requirement extraction, and ambiguity detection actually parse grammar (sentence structure, negation, synonyms, phrase chunking) rather than pattern-matching literal substrings.
- Source/context: User is offline overnight, explicitly authorized full autonomous operation ("no computer input off limit" earlier, "keep going don't stop till it's done"), no further questions to be asked.
- Priority: P1
- Dependencies: TASK-001 (done) — builds on existing `packages/compiler` pipeline, must not break its public API or the 16 existing tests.
- Status: DONE (2026-08-11) — independently re-verified 2026-08-11; one real bug found and fixed during verification (see CANONICAL_STATE.md Known issues)
- Classification: feature, research

## Normalized requirements
1. Add a real, deterministic, offline NLP layer to `packages/compiler` — no AI API, no remote calls. Use a mature local NLP library (e.g. `compromise` — pure JS, deterministic, no network, no native deps) for: sentence splitting, tokenization, part-of-speech tagging, noun/verb phrase chunking, negation detection.
2. Rework `intentAnalysis` to classify task type (build/create, research, write, design, fix/modify) from actual grammatical structure (main verb + object) instead of only keyword substring matching, while keeping it a fallback-safe deterministic function (no throwing, no false confidence claims).
3. Rework `requirementExtraction` to use phrase chunking to correctly attribute "must/should/needs to" modal requirements to their real subject/object (e.g. "it must NOT use tracking" should extract a negated requirement, not a positive one) — this fixes a real correctness gap (negation) the current regex-only version cannot handle.
4. Add a synonym/lexicon normalization layer so domain detection and requirement extraction recognize common synonyms (e.g. "app"/"application", "toon"/"cartoon" for game/branding domains, "site"/"website"/"webpage" for web domain) without hand-listing every literal string per domain module.
5. Extend ambiguity detection to use the parsed grammar to reduce false-unresolved flags (e.g. if platform is stated as "for iPhone", recognize this satisfies the "platform" required field even though the domain module's checklist doesn't literally contain the string "iPhone").
6. Must not break the existing public API (`compileArchitect`, `runArchitectPipeline`) or any of the 16 existing tests without a deliberate, documented, justified change — additive preferred.
7. New behavior must be covered by new deterministic tests (negation handling, synonym normalization, grammar-based intent classification) added to the existing vitest suite, not a separate ad hoc script.
8. Update `state/CANONICAL_STATE.md` and this task's status on completion.

## Explicitly out of scope
- No AI API / LLM calls of any kind, ever (hard constraint, unchanged from TASK-001).
- No new specialists, no new domains, no MASTER/QUICK modes — this task is scoped purely to improving the linguistic quality of the existing ARCHITECT-mode pipeline's early stages (intent/requirement/ambiguity).
- No UI changes required unless something in the UI breaks due to a pipeline API change (should not happen — keep changes additive).
