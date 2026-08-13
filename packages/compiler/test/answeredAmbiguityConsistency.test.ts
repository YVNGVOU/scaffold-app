import { describe, it, expect } from 'vitest';
import { runArchitectPipeline, mergeAnswer, resumeAndRecompile, formatAsMarkdown, getExportWarnings } from '../src/index.js';

/**
 * Regression coverage for a real user-reported bug: after answering every
 * unresolved checklist item inline (mergeAnswer) and recompiling, the
 * compiled output kept claiming those SAME fields were "unspecified" —
 * directly contradicting the answers sitting right there in
 * userRequirements — and every additional recompile stacked a fresh,
 * uncleared round of specialist/critique output on top of the last,
 * duplicating requirement counts with zero new information.
 *
 * Root causes (both fixed in resumeAndRecompile.ts / isAnswered.ts):
 * 1. CompiledOutput.tsx/formatAsMarkdown/getExportWarnings read
 *    `compiled.assumptions` for kind:'unresolved' items without excluding
 *    ones already answered (DecisionsPanel.tsx alone did this filtering) —
 *    fixed by a single shared `isAnswered`/`unresolvedUnanswered`.
 * 2. critique-engine's own synthesized "Unresolved ambiguity survived..."
 *    findings (kind: 'recommendation', not 'unresolved') were carried
 *    forward into every subsequent recompile's input pool forever, since
 *    they don't match kind:'unresolved' filtering at all — fixed by
 *    excluding ANALYSIS_STAGE_SOURCES from reconstructStateFromCompiled.
 * 3. No specialist checked whether it had already emitted a given finding
 *    in a prior compile (they're stateless over domain+rawInput only), so
 *    every recompile re-added every specialist's full consideration set as
 *    fresh duplicates — fixed by a dedup pass after the specialist stages
 *    in resumeAndRecompile.
 */
describe('answered-ambiguity consistency across recompiles', () => {
  function answerAllUnresolved(compiled: ReturnType<typeof runArchitectPipeline>['compiled'], answers: Record<string, string>) {
    let result = compiled;
    for (const item of compiled.assumptions.filter((a) => a.kind === 'unresolved')) {
      const answer = answers[item.text];
      if (answer) result = mergeAnswer(result, item, answer);
    }
    return result;
  }

  it('exported markdown never claims an answered field is unspecified, and export warnings reflect it', () => {
    const state = runArchitectPipeline('design a menu for my new cafe');
    const answered = answerAllUnresolved(state.compiled, {
      'Whether the menu is print, digital/QR-code, or both is unspecified': 'digital',
      'Target price tier (budget, mid-range, premium) is unspecified': 'mid',
      'How often the menu changes (static, seasonal rotation, daily specials) is unspecified': 'static',
      'Whether dietary/allergen labeling is required, and to what standard, is unspecified': 'yes',
      'Whether the menu includes food photography or is text-only is unspecified': 'will get photos',
    });

    const recompiled = resumeAndRecompile(answered, 'design a menu for my new cafe', 'architect').compiled;

    expect(formatAsMarkdown(recompiled)).not.toMatch(/is unspecified/i);
    expect(getExportWarnings(recompiled).unresolvedCount).toBe(0);
  });

  it('repeated recompiles do not duplicate specialist findings', () => {
    const state = runArchitectPipeline('design a menu for my new cafe');
    const answered = answerAllUnresolved(state.compiled, {
      'Whether the menu is print, digital/QR-code, or both is unspecified': 'digital',
    });

    const first = resumeAndRecompile(answered, 'design a menu for my new cafe', 'architect').compiled;
    const second = resumeAndRecompile(first, 'design a menu for my new cafe', 'architect').compiled;
    const third = resumeAndRecompile(second, 'design a menu for my new cafe', 'architect').compiled;

    expect(second.functionalRequirements.length).toBe(first.functionalRequirements.length);
    expect(second.preferences.length).toBe(first.preferences.length);
    expect(third.functionalRequirements.length).toBe(first.functionalRequirements.length);
    expect(third.preferences.length).toBe(first.preferences.length);
  });

  it('repeated recompiles do not duplicate architecture notes (separate array, same bug)', () => {
    const state = runArchitectPipeline('design a menu for my new cafe');
    const first = resumeAndRecompile(state.compiled, 'design a menu for my new cafe', 'architect').compiled;
    const second = resumeAndRecompile(first, 'design a menu for my new cafe', 'architect').compiled;

    expect(first.architecture?.length).toBe(state.compiled.architecture?.length);
    expect(second.architecture?.length).toBe(state.compiled.architecture?.length);
  });
});
