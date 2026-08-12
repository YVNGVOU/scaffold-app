# HANDOFF-TASK-021

## Mission
Let the user pick an output-target profile (Generic AI, Claude, ChatGPT, Coding Agent, Image Model) that changes only how the compiled prompt is rendered to Markdown for copy/export — never the underlying compiled data.

## Scope
- `packages/compiler/src/formatAsMarkdown.ts`: add an exported `PromptProfile` union type (`'generic' | 'claude' | 'chatgpt' | 'coding-agent' | 'image-model'`) and extend `formatAsMarkdown(compiled: CompiledPrompt, profile: PromptProfile = 'generic'): string` to vary only formatting conventions per profile (e.g. heading style/title line, an optional leading framing sentence, section ordering/labels appropriate to that target). The set of underlying facts rendered (mission/context/objective/role/requirement categories/architecture/output format) must remain identical in substance across profiles — this is presentation-only.
- Export `PromptProfile` from `packages/compiler/src/index.ts` alongside `formatAsMarkdown`.
- `apps/desktop/src/components/CompiledOutput.tsx`'s `ExportToolbar`: add a `<select>` for profile (defaulting to Generic AI), styled with `--sv-*` tokens, no rounded corners. "Copy Markdown" and "Export .md" both pass the selected profile into `formatAsMarkdown`. "Export .json" is unaffected — always raw `JSON.stringify(compiled, null, 2)` regardless of profile.
- Read `packages/compiler/src/formatAsMarkdown.ts` and `apps/desktop/src/components/CompiledOutput.tsx` in full before editing (both are short, single-purpose files).

## Acceptance criteria
1. `formatAsMarkdown` remains a pure function with no side effects and no AI/network calls; profile parameter only changes string formatting, never which facts are included from `compiled`.
2. 4-5 profiles implemented, each with a genuinely distinct, deterministic formatting convention (not just a renamed title — e.g. distinguishable output content per test).
3. New/updated unit tests in `packages/compiler/test/formatAsMarkdown.test.ts` cover each profile's distinguishing formatting output, plus a check that switching profiles never changes which requirement/architecture/text content is present (only how it's formatted).
4. UI selector wired into `ExportToolbar`, default Generic AI, affects Copy Markdown + Export .md only; Export .json unaffected.
5. Dark SINVAUX/Scaffold visual language, `--sv-*` tokens only, no rounded corners, no new UI component libraries.
6. `packages/compiler` vitest suite: 129 pre-existing tests still pass, plus new profile tests, zero regressions.
7. `tsc --noEmit` clean on `packages/schema`, `packages/compiler`, `apps/desktop`; `vite build` clean on `apps/desktop`.
8. No stray `&amp;amp;` entity artifacts or hardcoded hex colors outside `--sv-*` tokens in new/changed files.
9. No Rust/`src-tauri` changes required (pure client-side formatting feature); `apps/desktop/src-tauri/scaffold-updater.key` and `Scaffold-Release/`/`bundle/` untouched.

## Explicitly out of scope
See `tasks/TASK-021.md`.
