# TASK-001

- Timestamp: 2026-08-11
- Original request: Full SINVAUX Prompt Compiler build brief (standalone desktop app, deterministic local compilation pipeline, no AI API dependency) — see full text preserved in brainstorming session; condensed and scoped via `docs/superpowers/specs/2026-08-11-lucid-compiler-phase1-design.md`.
- Source/context: User-initiated new project, empty directory.
- Priority: P1
- Dependencies: none
- Status: ACTIVE
- Classification: feature, architecture

## Normalized requirements
See `docs/superpowers/specs/2026-08-11-lucid-compiler-phase1-design.md` (approved) for full detail. Summary:
1. Monorepo: `apps/desktop` (Tauri 2 + React + TS), `packages/schema`, `packages/compiler`.
2. Canonical `CompiledPrompt` schema with provenance-tagged `RequirementItem`s.
3. Pipeline runner with 9 named stages (5 real, rest typed passthrough stubs).
4. 3 domain modules: web-development, game-development, branding.
5. ARCHITECT specialist fully implemented; other 6 specialists stubbed via shared interface.
6. SQLite persistence (prompts + append-only compile history).
7. Full 4-pane desktop UI in SINVAUX visual language.
8. Headless vitest suite for `packages/compiler` covering vague/specific/contradictory/malformed/long/empty inputs across all 3 domains.
9. Repo codename `lucid`; in-app brand always "SINVAUX".
