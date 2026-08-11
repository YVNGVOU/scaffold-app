# CANONICAL STATE

> Single source of truth for the current project direction.

## Project
- Name: lucid (internal codename) — displayed in-app as SINVAUX
- One-line purpose: Local-first, deterministic desktop prompt compiler that turns vague human intent into structured, verifiable prompts for any AI system, without any AI API dependency.
- Current milestone: Phase 1 — compiler core (ARCHITECT mode, ARCHITECT specialist, 3 domains) + full desktop scaffold
- Last updated: 2026-08-11

## Current active task
- Task ID: TASK-001
- Status: ACTIVE
- Objective: Build the Phase 1 vertical slice per `docs/superpowers/specs/2026-08-11-lucid-compiler-phase1-design.md` — monorepo scaffold, schema package, compiler pipeline, ARCHITECT specialist, 3 domain modules, SQLite storage, 4-pane Tauri desktop UI in SINVAUX visual language.
- Current phase: PLAN → HANDOFF

## Locked decisions
- Project is fully standalone. No shared architecture, files, database, or workflow with any other project (including "Aftermath"). Only SINVAUX visual/brand language is shared.
- Repo/package codename is `lucid`; the app's displayed brand is always "SINVAUX" — codename never appears in user-facing UI text.
- Core compiler intelligence is deterministic, local, rule-based. No OpenAI/Anthropic/Gemini/remote-LLM API calls anywhere in the compiler's core logic.
- Compiler engine (`packages/compiler`, `packages/schema`) is pure TypeScript, framework-agnostic, unit-testable headless without launching the desktop app.
- Stack: Tauri 2 + React + TypeScript (UI) + Rust (thin shell: windowing, SQLite access via Tauri commands).
- Phase 1 scope: ARCHITECT mode only; ARCHITECT specialist only (other 6 specialists are typed interface stubs); 3 domains (web-development, game-development, branding); SQLite persistence now; full 4-pane UI now. Full scope breakdown in the Phase 1 spec.
- No telemetry, ever, by default — not a "Phase 1 only" exclusion.
- Standard project practice going forward: subagent orchestration (Explorer/Researcher/Adversary/Implementer/Verifier pattern) is used for non-trivial implementation and verification work, per user instruction that this be standard on this project.

## Current architecture
- `apps/desktop/` — Tauri 2 + React + TS shell, `src-tauri/` for Rust (window mgmt, SQLite via `tauri-plugin-sql`, Tauri commands)
- `packages/schema/` — canonical `CompiledPrompt` / `RequirementItem` / `ArchitectureNote` types, pure TS
- `packages/compiler/` — pipeline stages, domain modules (`domains/{web,game,branding}`), specialists (`specialists/architect`, `specialists/_stubs`), pure TS, vitest-tested headless

## Current constraints
- No AI API dependency anywhere in core compiler logic (hard constraint, not a preference)
- Local-first: no account, no cloud service required, no telemetry by default
- Windows 11 dev environment (PowerShell primary, Git Bash tool available); no git repo initialized yet at project start

## Known issues
- None yet — Phase 1 implementation not started.

## Completed work
- 2026-08-11: Brainstorming session completed. Design approved by user. Spec written to `docs/superpowers/specs/2026-08-11-lucid-compiler-phase1-design.md`.
- 2026-08-11: Architect skill adopted as project's standing orchestration layer; canonical-state system initialized.

## Next intended work
- Pulled from `tasks/TASK_QUEUE.md` after TASK-001 closes: Phase 2 (remaining specialists, MASTER mode multi-round deliberation, critique/conflict engine) — not yet queued in detail, deferred until Phase 1 verified.

## Change log
- 2026-08-11 Initialized canonical state for lucid/SINVAUX Prompt Compiler.
