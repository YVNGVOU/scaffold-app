# lucid (SINVAUX Prompt Compiler) — Phase 1 Design

## Naming

- **Repo / package codename:** `lucid` (e.g. `@lucid/schema`, `@lucid/compiler`). Used in package.json scopes, repo name, internal module references.
- **In-app displayed brand:** SINVAUX. The desktop app's window title, splash/about, and UI chrome show "SINVAUX" per the SINVAUX visual/brand language. The codename never appears in user-facing UI text.
- This is a new, standalone project. It shares no architecture, files, database, or workflow with any other project (including "Aftermath"). Only the SINVAUX visual/brand language is shared at the design level.

## Scope of this phase

This is Phase 1 of a much larger product (full brief: local-first deterministic prompt compiler with 7 specialist engines, 3 modes, multi-round MASTER deliberation, expandable domain packs, versioning/export system). Building the entire product at once is out of scope for one design/plan cycle. This phase delivers a real, working vertical slice with the full desktop shell around it, per user decision:

- **Modes:** ARCHITECT mode only. QUICK and MASTER are not implemented.
- **Specialists:** ARCHITECT specialist fully implemented with deterministic rules. The other six (TECHNICAL, UX, CREATIVE, QA, SECURITY, CONSTRAINT) exist only as a typed interface + empty registration slot — no rule logic.
- **Domains:** web-development, game-development, branding. Domain module architecture must generalize cleanly to the other ~18 domains named in the full brief, even though only 3 ship now.
- **Pipeline stages:** intent analysis → domain detection → requirement extraction → ambiguity detection → specialist pass (architect only) → synthesis → output validation. Stages from the full brief not yet built (critique, conflict detection/resolution, task decomposition, dependency graph, quality gates) exist as typed no-op passthrough stages, preserving the full pipeline shape so later phases slot in without restructuring the runner.
- **Storage:** SQLite, append-only compile history per prompt. No version diffing or rollback UI yet.
- **UI:** full four-pane desktop workspace (left nav, center editor, right analysis panel, bottom pipeline stepper), SINVAUX visual language.
- **Explicitly excluded from this phase:** the other 6 specialists' logic, critique/conflict/task-graph/quality-gate real logic, export formats beyond JSON + copy-to-clipboard, prompt-target output profiles (Claude/ChatGPT/Gemini/etc. formatting), version diff/rollback, telemetry (none, ever, by default — not just "excluded for now").

## Repository layout

```
lucid/
  apps/
    desktop/                  # Tauri 2 + React + TypeScript shell
      src/                    # React UI
      src-tauri/               # Rust: window mgmt, SQLite access, Tauri commands
  packages/
    schema/                   # Canonical prompt representation types (pure TS)
    compiler/                 # Pipeline, domains, specialists (pure TS, no Tauri dep)
      pipeline/
      domains/
        web/
        game/
        branding/
      specialists/
        architect/
        _stubs/                # interface + empty registration for the other 6
```

`packages/compiler` and `packages/schema` have zero dependency on `apps/desktop` and are unit-testable headless via `vitest`, satisfying the "compiler must be testable without launching the desktop app" principle.

## Canonical prompt schema (`packages/schema`)

A compiled prompt is a TypeScript object with optional sections (sections are omitted, not empty-stringed, when not relevant):

```ts
interface CompiledPrompt {
  mission?: string
  context?: string
  objective?: string
  role?: string
  domain: DomainId | 'unknown'
  userRequirements: RequirementItem[]
  nonNegotiables: RequirementItem[]
  preferences: RequirementItem[]
  constraints: RequirementItem[]
  assumptions: RequirementItem[]
  functionalRequirements: RequirementItem[]
  architecture?: ArchitectureNote[]
  outputFormat?: string
}

interface RequirementItem {
  text: string
  kind: 'user' | 'inferred' | 'default' | 'assumption' | 'recommendation' | 'unresolved' | 'rejected'
  source: string          // e.g. "architect-specialist", "user-input", "domain:web"
  confidence: number      // 0-1
  evidence: string[]
  risk?: 'low' | 'medium' | 'high'
  status: 'accepted' | 'pending' | 'rejected'
}

interface ArchitectureNote {
  component: string
  dependsOn: string[]
  note: string
  source: string
}
```

This directly encodes the brief's rule: an assumption is never silently promoted to a user requirement — the `kind` field is the permanent record of provenance, and `RequirementItem`s are never mutated in place across stages, only appended/superseded with a new item pointing at the old one's `source`.

## Compiler pipeline (`packages/compiler/pipeline`)

A `PipelineState` object flows through an ordered list of stage functions: `(state: PipelineState) => PipelineState`. Each stage is a separate module/file — not one large function, per the brief's explicit instruction.

```ts
type Stage = (state: PipelineState) => PipelineState

const ARCHITECT_MODE_PIPELINE: Stage[] = [
  intentAnalysis,
  domainDetection,
  requirementExtraction,
  ambiguityDetection,
  architectSpecialistPass,   // runs the one implemented specialist
  critiquePassthrough,        // no-op stub, future phase
  conflictPassthrough,        // no-op stub, future phase
  synthesis,
  outputValidation,
]
```

`PipelineState` carries: raw input, detected domain + confidence, extracted requirements, ambiguity flags, specialist decisions accumulated so far, and the in-progress `CompiledPrompt`. Passthrough stub stages are typed to accept and return `PipelineState` unchanged, documented with a one-line comment pointing at the future phase that fills them in.

## Intent analysis, domain detection, requirement extraction, ambiguity detection

- **Intent analysis:** classifies the raw input into a coarse task type (build/create, research, write, design, fix/modify) via keyword and pattern matching. Deterministic, rule-table driven — no ML.
- **Domain detection:** each of the 3 domain modules exports a scoring function `(input: string) => number`. The pipeline runs all three, picks the highest-scoring domain above a confidence floor; below the floor, domain is `'unknown'` and downstream stages fall back to generic (non-domain-specific) requirement templates.
- **Requirement extraction:** pulls explicit requirements out of the input (phrases matching "must", "needs to", "should", named constraints) plus domain-default requirement categories for the detected domain, tagged `kind: 'user'` vs `kind: 'default'` respectively.
- **Ambiguity detection:** for the detected domain, checks a required-fields checklist (e.g. web: platform/purpose/audience; game: platform/genre/engine; branding: audience/deliverables/style). Missing fields become `RequirementItem`s with `kind: 'unresolved'` and are surfaced in the UI's right-hand panel — never silently defaulted in ARCHITECT mode (silent defaulting is a MASTER-mode-only behavior per the brief, out of scope here).

## ARCHITECT specialist (`packages/compiler/specialists/architect`)

Deterministic rule engine, not a stub. Given `PipelineState` (domain, requirements, ambiguities), it:

1. Looks up the domain's component template (e.g. web → {frontend, backend, data layer, deployment}; game → {engine, core loop, assets, platform target}; branding → {logo system, color/type system, deliverable set}).
2. Cross-references user requirements against the template to flag missing architecture pieces.
3. Emits an ordered implementation sequence (topological — e.g. "requirements before architecture before build").
4. Emits one `RequirementItem`/`ArchitectureNote` per decision, each carrying `source: 'architect-specialist'`, a `confidence` derived from a simple rule-weight table (not fabricated), and `evidence` referencing which domain rule or user input triggered it.
5. Never fabricates unstated requirements as `kind: 'user'` — new items it introduces are always `'inferred'`, `'default'`, or `'recommendation'`.

The other 6 specialists share the same `Specialist` interface (`(state: PipelineState) => Decision[]`) so they can be registered later without changing the pipeline runner or synthesis stage. `_stubs/` holds the interface file and an empty `SPECIALIST_REGISTRY` map with commented-out entries for the unbuilt six.

## Synthesis and output validation

- **Synthesis:** merges all specialist decisions (currently just architect's) into the final `CompiledPrompt`, ordering sections per the canonical schema, omitting empty sections.
- **Output validation:** structural checks only for this phase — required fields present, no orphaned `RequirementItem`s referencing a nonexistent source, domain is set. Not the full brief's "never crash on malformed input" fuzz-tested guarantee yet, but the vitest suite (below) covers the malformed/empty/contradictory/long-input cases against this stage.

## Storage (`apps/desktop/src-tauri`, SQLite)

Via `tauri-plugin-sql` (SQLite driver), two tables:

```sql
CREATE TABLE prompts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  raw_input TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE compiles (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL REFERENCES prompts(id),
  mode TEXT NOT NULL DEFAULT 'architect',
  compiled_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

Append-only: each compile run inserts a new `compiles` row, never overwrites. No diffing/rollback logic reads across rows yet — the left nav lists prompts, selecting one lists its compile history newest-first, selecting a compile shows its stored JSON. Local file only, no cloud sync, no telemetry, no account.

## Desktop UI (`apps/desktop`)

Four-pane layout, React + TypeScript, Tauri 2 shell:

- **Left:** prompt list (from SQLite) + "new prompt" action.
- **Center:** raw input textarea (top) + compiled output view (bottom), rendered from the `CompiledPrompt` schema — only non-empty sections shown, each `RequirementItem` displayed with a small kind-tag (user/inferred/assumption/unresolved/etc.).
- **Right:** decisions/assumptions/warnings panel — every `RequirementItem` and `ArchitectureNote` with `kind !== 'user'`, so the user can inspect what the compiler inferred, assumed, or flagged as unresolved, and why (source + evidence), per the brief's inspectability requirement.
- **Bottom:** pipeline stepper — the 9 named stages (including passthrough stubs, visually marked as inactive/no-op) light up in sequence as compilation runs, so the user watches the compile happen.

**Visual language:** warm ivory / near-black / restrained burgundy palette, editorial typography (serif or high-contrast sans for headers, clean sans for body), thin hairline dividers, geometric section breaks, no rounded cards, no chat-bubble UI. Feels like an instrument panel, not a chatbot.

## Testing

`packages/compiler` vitest suite, headless, no Tauri dependency:

- Vague input ("make me a game") → verify ambiguity detection fires and required fields are flagged unresolved, not silently defaulted.
- Highly specific input → verify requirement extraction captures explicit `kind: 'user'` items correctly.
- Contradictory input (e.g. "no budget, needs a AAA game engine") → pipeline completes without throwing; contradiction is not yet actively flagged (constraint/conflict engine is a future phase) but the pipeline must not crash.
- Missing-context / extremely short input ("make an app") → domain detection falls back to `'unknown'` gracefully.
- Extremely long input → pipeline completes within reasonable time, no truncation crash.
- Malformed input (empty string, only whitespace, only symbols) → pipeline returns a valid (if mostly empty/unresolved) `CompiledPrompt`, never throws.
- One test per domain module (web/game/branding) verifying correct detection on a canonical example prompt.
- Cross-domain: an input that could plausibly match two domains → verify the higher-scoring one wins and confidence is reported.

No UI or Tauri integration tests in this phase; UI is verified manually by running the app.

## Out of scope (deferred to later phases, not forgotten)

QUICK/MASTER modes and multi-round deliberation; TECHNICAL/UX/CREATIVE/QA/SECURITY/CONSTRAINT specialist logic; real critique/conflict-detection/conflict-resolution/task-decomposition/dependency-graph/quality-gate stages; the remaining ~18 domain packs; prompt-target output profiles (Claude/ChatGPT/Gemini/coding-agent/image/video/research formatting); version comparison/rollback UI; Markdown/TXT/YAML export beyond JSON; any telemetry (excluded permanently, not just deferred).
