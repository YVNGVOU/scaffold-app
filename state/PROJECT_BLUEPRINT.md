# PROJECT BLUEPRINT — lucid / SINVAUX Prompt Compiler

> Long-range product vision. Phase 1 (active) implements a slice of this; later phases expand it. See `state/CANONICAL_STATE.md` for what's actually built right now.

## Product concept
A desktop application that transforms vague human prompts ("make me a horror game") into structured, comprehensive, actionable prompt/execution specifications for any AI system — via a deterministic local compilation pipeline, not by calling an AI API.

## Full pipeline (target state)
```
USER INPUT → INTENT ANALYSIS → DOMAIN DETECTION → TASK CLASSIFICATION →
REQUIREMENT EXTRACTION → AMBIGUITY DETECTION → SPECIALIST PASSES → CRITIQUE →
CONFLICT DETECTION → CONFLICT RESOLUTION → REQUIREMENT EXPANSION →
TASK DECOMPOSITION → DEPENDENCY GRAPH → QUALITY GATES → MASTER COMPILATION →
OUTPUT VALIDATION → FINAL PROMPT PACKAGE
```

## Specialist engines (target: all 7)
ARCHITECT (built, Phase 1), TECHNICAL, UX, CREATIVE, QA, SECURITY, CONSTRAINT — each a deterministic rule-based reviewer, not an LLM call.

## Modes (target: all 3)
QUICK (fast single-pass), ARCHITECT (built, Phase 1 — structured single-pass with one specialist), MASTER (multi-round deliberation across all specialists, flagship feature).

## Domain system (target: ~20 domains)
web-development, software-development, mobile-development, desktop-development, game-development, unity, unreal, roblox, blender, branding, graphic-design, image-generation, video-generation, music, writing, research, business, marketing, product-design, education, data-analysis, automation. Phase 1 builds 3 (web, game, branding) to prove the module interface generalizes.

## Prompt targets (future)
Output formatting profiles: GENERIC AI, CLAUDE, CHATGPT, GEMINI, CODING AGENT, IMAGE MODEL, VIDEO MODEL, RESEARCH MODEL, CUSTOM. Core compiled spec stays provider-independent; profiles only affect formatting.

## Local-first architecture (hard constraint, all phases)
Offline-capable, no account, no cloud service, no AI API, no telemetry by default. SQLite for prompt history, compiled prompts, domain packs, custom rules, templates, preferences, compile history, revisions.

## SINVAUX visual language (all phases)
Warm ivory, near-black, restrained burgundy. Editorial typography, thin hairlines, geometric dividers, precise spacing, subtle paper texture/film grain, sophisticated motion, clean information hierarchy. Editorial system + developer tool + mission control + design instrument. Never generic SaaS, never chat-bubble UI, never default rounded cards.

## Build order (from original brief)
1. Canonical prompt schema
2. Compiler core
3. Intent/domain detection
4. Requirement extraction
5. Ambiguity engine
6. Specialist engines (all 7)
7. Critique + conflict engine
8. Synthesis engine
9. MASTER compiler
10. Quality/validation system
11. Desktop shell
12. Professional SINVAUX interface
13. Domain packs (remaining ~17)
14. Versioning/export/history

Phase 1 (active) covers items 1–6 (partially — ARCHITECT specialist + 3 domains only) and pulls forward 11–12 (desktop shell + UI) per explicit user decision, ahead of full backend completion. This is an accepted deviation from the strict brief ordering, not an oversight.
