# TASK-006

- Timestamp: 2026-08-11
- Original request: continuation of autonomous overnight work; follows the TASK-005 Verifier's finding: `domains/game/index.ts`'s `KEYWORDS` list includes the bare word `'multiplayer'`, causing non-game inputs like "Build a horror-themed multiplayer chat website" to misclassify as `domain: 'game'`. Same class of bug as the TASK-002 `PLATFORM_LEXICON` web-bucket overlap, already fixed once with this exact pattern.
- Priority: P2 (small, low-risk, well-scoped)
- Dependencies: TASK-001 through TASK-005 (all done).
- Status: DONE (independently verified; see state/CANONICAL_STATE.md TASK-006 verification entries)
- Classification: bug

## Requirements
1. Inspect `packages/compiler/src/domains/game/index.ts`'s `KEYWORDS` (or equivalent detection-scoring list) and `packages/compiler/src/domains/web/index.ts`'s equivalent, to understand the actual overlap.
2. Remove or narrow the offending bare keyword(s) so genuinely non-game inputs (e.g. websites/apps that happen to mention "multiplayer" in a non-game context) don't misclassify as `game` domain, while genuinely game-related inputs still correctly classify as `game`.
3. This is domain-scoring data, not the conflict-engine logic from TASK-005 — do not touch `conflict.ts`/`critique.ts` unless the fix here changes their behavior in a way that needs re-verification (the conflict rule's `domain === 'game'` guard depends on this).
4. Add a regression test: an input that previously misclassified (or similar) now classifies correctly as non-game, AND existing game-domain test cases still classify as `game`.
5. Must not break any of the existing 48 tests.
6. Fix must be small and targeted — this is a keyword-list adjustment, not a domain-detection algorithm rewrite.
7. Update `state/CANONICAL_STATE.md` and task/queue status on completion.

## Explicitly out of scope
- Rewriting domain detection scoring logic wholesale.
- Any other domain's keyword list unless the same bare-word-overlap pattern is found there too during investigation (if found, fix it too and note it, but don't go hunting exhaustively beyond the game/web overlap already identified).
