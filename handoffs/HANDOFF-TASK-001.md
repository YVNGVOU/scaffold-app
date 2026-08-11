# IMPLEMENTATION HANDOFF — TASK-001

## Mission
Build the Phase 1 vertical slice of the lucid/SINVAUX Prompt Compiler: a monorepo with a pure-TypeScript deterministic compiler engine (schema, pipeline, one specialist, three domains) and a Tauri 2 + React + TypeScript desktop shell with SQLite persistence and a four-pane SINVAUX-styled UI. No AI API calls anywhere in the compiler's core logic.

## Canonical context
- Read first: `state/CANONICAL_STATE.md`
- Project blueprint: `state/PROJECT_BLUEPRINT.md`
- Task: `tasks/TASK-001.md`
- Full approved spec (authoritative for all technical detail): `docs/superpowers/specs/2026-08-11-lucid-compiler-phase1-design.md`

## User intent
> Build SINVAUX as a standalone desktop prompt-compiler product, completely separate from any other project, using its own repo/codebase (internal codename "lucid," in-app brand always "SINVAUX"). Core intelligence must be deterministic and local — zero AI API dependency. Full target architecture is a large multi-specialist, multi-mode compiler with a professional editorial/mission-control desktop UI; this task builds the first real vertical slice with the full desktop shell around it (per explicit user scoping decisions), not the whole product.

## Objective
A working, launchable Tauri desktop app where a user types a raw prompt, selects ARCHITECT mode (the only mode this phase implements), watches a 9-stage pipeline run, and sees a structured `CompiledPrompt` with inspectable decisions/assumptions in the right panel — persisted to SQLite and listed in the left nav.

## Scope

### In scope
- Monorepo scaffold: `apps/desktop/`, `packages/schema/`, `packages/compiler/` per the spec's repository layout.
- `packages/schema`: `CompiledPrompt`, `RequirementItem`, `ArchitectureNote` types exactly as specified.
- `packages/compiler/pipeline`: 9-stage runner (`intentAnalysis, domainDetection, requirementExtraction, ambiguityDetection, architectSpecialistPass, critiquePassthrough, conflictPassthrough, synthesis, outputValidation`); passthrough stages are typed no-ops with a comment pointing at their future phase.
- `packages/compiler/domains/{web,game,branding}`: detection scoring function + requirement-category defaults + ambiguity checklist per domain, as specified.
- `packages/compiler/specialists/architect`: full deterministic rule engine per spec section "ARCHITECT specialist."
- `packages/compiler/specialists/_stubs`: shared `Specialist` interface + empty `SPECIALIST_REGISTRY` with commented entries for TECHNICAL/UX/CREATIVE/QA/SECURITY/CONSTRAINT.
- `apps/desktop/src-tauri`: SQLite via `tauri-plugin-sql`, `prompts` and `compiles` tables exactly as specified, Tauri commands to create/list/read.
- `apps/desktop/src`: four-pane React UI (left nav, center editor/output, right decisions panel, bottom pipeline stepper), SINVAUX visual language (ivory/near-black/burgundy, editorial type, hairlines, no rounded cards, no chat-bubble UI).
- vitest suite for `packages/compiler` covering all cases listed in the spec's Testing section.
- Root `package.json` workspace config wiring the packages together; codename `lucid` used in package names/scopes, never surfaced in UI text (UI always says "SINVAUX").

### Explicitly out of scope
- QUICK and MASTER modes, multi-round deliberation.
- TECHNICAL/UX/CREATIVE/QA/SECURITY/CONSTRAINT specialist rule logic (interface stubs only).
- Real critique/conflict-detection/resolution/task-decomposition/dependency-graph/quality-gate logic (typed passthroughs only).
- Domains beyond web/game/branding.
- Export formats beyond JSON + copy-to-clipboard.
- Prompt-target output profiles (Claude/ChatGPT/Gemini/etc. formatting).
- Version diff/rollback UI.
- Any telemetry, any AI API call, any account/cloud requirement.

## Current-state findings
- Project directory was empty at task start (confirmed via `ls`). No existing code, no git repo. This is a from-scratch build.

## Requirements
1. `packages/compiler` and `packages/schema` must have zero dependency on `apps/desktop` or Tauri, and must be runnable/testable via `vitest` from the command line alone.
2. Every stage function has the signature `(state: PipelineState) => PipelineState` and lives in its own file/module — do not collapse stages into one function.
3. `RequirementItem`s are never mutated in place across stages to change `kind` — provenance is permanent; superseding an item means adding a new one whose `source` references the old.
4. Ambiguity detection in ARCHITECT mode surfaces unresolved required fields to the user; it must never silently default them (that's MASTER-mode-only behavior, not built here).
5. The ARCHITECT specialist must never emit `kind: 'user'` on anything it introduces itself — only `'inferred' | 'default' | 'recommendation'`.
6. The pipeline must never throw on empty, whitespace-only, symbol-only, contradictory, or very long input — it must return a valid (possibly mostly-unresolved) `CompiledPrompt`.
7. SQLite writes are append-only for `compiles` — never update/overwrite an existing compile row.
8. UI text must never display the codename "lucid" — always "SINVAUX".

## Decisions
| Decision | Choice | Reason |
|---|---|---|
| Engine language | Pure TypeScript for `packages/compiler`/`schema` | User-approved; faster iteration on rule-heavy deterministic logic than Rust; still testable headless |
| Specialist scope | ARCHITECT only, real logic | User-approved; matches brief's own "prove one specialist end-to-end first" build order |
| Mode scope | ARCHITECT mode only | User-approved; QUICK/MASTER deferred |
| Domain count | 3 (web, game, branding) | User-approved; different enough to prove the module interface generalizes |
| Persistence | SQLite now, append-only | User-approved; left nav is meaningless without it |
| UI scope | Full 4-pane workspace now | User-approved, overriding the assistant's initial narrower recommendation |
| Repo codename | `lucid` | User-approved after rejecting "compilr" and "forge" |

## Implementation phases

### Phase A — Monorepo scaffold + schema package
- Work: Initialize git repo. Create workspace root (`package.json` with workspaces), `packages/schema` with the three types, `packages/compiler` skeleton (empty pipeline/domains/specialists dirs), `apps/desktop` Tauri 2 + React + TS scaffold (via `create-tauri-app` or manual, React variant).
- Files/systems: repo root, `packages/schema/*`, `apps/desktop/*` scaffold only.
- Verification: `npm install` succeeds at root; `apps/desktop` dev build launches an empty Tauri window; `packages/schema` compiles with `tsc --noEmit`.
- Exit criteria: empty but structurally complete monorepo, app window opens.

### Phase B — Compiler pipeline + domains + ARCHITECT specialist
- Work: Implement pipeline runner, all 9 stages (5 real + 4 stubs — note spec lists critique/conflict as 2 of the passthroughs explicitly; the others are folded into requirementExpansion/taskDecomposition/etc. per spec's stage list — implement exactly the stage list given in the spec's Pipeline section, do not add stages not listed), 3 domain modules, ARCHITECT specialist, `_stubs` specialist interface/registry.
- Files/systems: `packages/compiler/pipeline/*`, `packages/compiler/domains/*`, `packages/compiler/specialists/*`.
- Verification: vitest suite (write per spec's Testing section) passes; `tsc --noEmit` clean.
- Exit criteria: `compileArchitect(rawInput: string): CompiledPrompt` (or equivalent public entry point) works correctly end-to-end for at least one example per domain, verified by tests.

### Phase C — SQLite persistence
- Work: Add `tauri-plugin-sql`, create `prompts`/`compiles` tables via migration, Tauri commands for create-prompt/list-prompts/save-compile/list-compiles/get-compile.
- Files/systems: `apps/desktop/src-tauri/*`.
- Verification: manual — create a prompt via a temporary test command or minimal UI stub, confirm row appears in SQLite file (inspect via `sqlite3` CLI or a quick script), confirm compiles append rather than overwrite.
- Exit criteria: persistence layer works, callable from the frontend via Tauri's invoke.

### Phase D — Desktop UI
- Work: Build the four-pane layout, wire it to the compiler package (Phase B) and persistence (Phase C), apply SINVAUX visual language (define a small design-token set: colors, type scale, spacing, hairline style — consistent with ivory/near-black/burgundy, editorial typography, no rounded cards).
- Files/systems: `apps/desktop/src/*`.
- Verification: manual run of the app — type a vague prompt in each domain, confirm pipeline stepper animates through stages, confirm compiled output renders with correctly tagged sections, confirm right panel shows assumptions/unresolved items, confirm left nav lists and reopens past compiles from SQLite.
- Exit criteria: full user flow works end-to-end in the running app, screenshots taken to confirm visual language.

### Phase E — Verification pass
- Work: Independent verifier (separate agent/pass) re-runs the test suite, re-checks the malformed/edge-case inputs manually against the running app, confirms no AI API calls exist anywhere in `packages/compiler` (grep for API client imports), confirms no "lucid" string appears in any user-facing UI text.
- Files/systems: whole repo.
- Verification: `grep -ri "openai\|anthropic\|api.anthropic\|generativelanguage" packages/compiler apps/desktop/src` returns nothing; `grep -ri "lucid" apps/desktop/src` returns nothing (codename should only appear in package.json/repo metadata).
- Exit criteria: all checks pass, findings (if any) reported and fixed before closing TASK-001.

## Acceptance criteria
- [ ] Monorepo builds and the desktop app launches.
- [ ] `packages/compiler` vitest suite passes, covering all cases in the spec's Testing section.
- [ ] ARCHITECT mode compiles a raw prompt end-to-end for web, game, and branding domains, producing correctly provenance-tagged output.
- [ ] Ambiguous input surfaces unresolved fields instead of silently defaulting.
- [ ] SQLite persists prompts and append-only compile history; left nav reflects it.
- [ ] Four-pane UI renders in SINVAUX visual language (verified by screenshot).
- [ ] No AI API dependency anywhere in `packages/compiler`.
- [ ] No user-facing UI text shows "lucid"; app displays "SINVAUX".

## Verification plan
- [ ] Build/compile (`tsc --noEmit` on both packages, Tauri build)
- [ ] Automated tests (vitest suite in `packages/compiler`)
- [ ] Static/type/lint checks
- [ ] Runtime/manual verification (launch app, exercise full flow across 3 domains)
- [ ] Artifact inspection (screenshot of UI, grep checks per Phase E)

## Risks and mitigations
- Risk: Tauri 2 + `tauri-plugin-sql` setup friction on Windows.
  - Mitigation: verify Rust toolchain and Tauri CLI prerequisites early in Phase A before deeper work.
- Risk: Scope creep into other specialists/modes since the full brief is large and tempting to over-build.
  - Mitigation: implementer must follow this handoff's explicit in/out-of-scope lists; new scope discovered mid-build gets queued in `tasks/TASK_QUEUE.md`, not built.
- Risk: SINVAUX visual language is subjective — "not generic SaaS" is a qualitative bar.
  - Mitigation: exit criteria requires a screenshot review step; iterate once against the spec's palette/typography description before calling Phase D done.

## Stop conditions
Stop and report instead of expanding scope if:
- a required dependency (Tauri, Rust toolchain, tauri-plugin-sql) is unavailable in this environment
- acceptance criteria become impossible under current constraints
- a new requirement materially changes architecture or scope (e.g. user asks mid-build to add another specialist — queue it, don't build it)

## Final report format
- Summary:
- Files changed:
- Verification:
- Results:
- Known issues:
- Canonical state updated:
- Next task:
