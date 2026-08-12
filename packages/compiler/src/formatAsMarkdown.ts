import type { CompiledPrompt, RequirementItem } from '@lucid/schema';

/**
 * TASK-018 (export options): renders a CompiledPrompt as readable Markdown,
 * for the desktop app's "copy to clipboard" / "export as file" actions.
 *
 * Pure data-to-text transform, zero AI/inference involved, deterministic —
 * same input always produces the same output string. Lives in
 * `packages/compiler` (not `apps/desktop/src/lib`) because it operates
 * purely on the canonical `CompiledPrompt` shape from `@lucid/schema`, no
 * presentation/DOM concerns, so it is generically useful/testable headless
 * alongside `mergeAnswer`.
 */
export function formatAsMarkdown(compiled: CompiledPrompt): string {
  const lines: string[] = [];

  lines.push('# Compiled Prompt');
  lines.push('');
  lines.push(`- Domain: ${compiled.domain}`);
  lines.push('');

  if (compiled.mission) {
    lines.push('## Mission', '', compiled.mission, '');
  }
  if (compiled.context) {
    lines.push('## Context', '', compiled.context, '');
  }
  if (compiled.objective) {
    lines.push('## Objective', '', compiled.objective, '');
  }
  if (compiled.role) {
    lines.push('## Role', '', compiled.role, '');
  }

  const section = (title: string, items: RequirementItem[]) => {
    if (!items || items.length === 0) return;
    lines.push(`## ${title}`, '');
    for (const item of items) {
      lines.push(`- [${item.kind}] ${item.text}`);
    }
    lines.push('');
  };

  section('User Requirements', compiled.userRequirements);
  section('Non-Negotiables', compiled.nonNegotiables);
  section('Constraints', compiled.constraints);
  section('Functional Requirements', compiled.functionalRequirements);
  section('Preferences', compiled.preferences);
  section('Assumptions', compiled.assumptions);

  if (compiled.architecture && compiled.architecture.length > 0) {
    lines.push('## Architecture', '');
    for (const a of compiled.architecture) {
      lines.push(`- **${a.component}**: ${a.note}${a.dependsOn.length > 0 ? ` (depends on: ${a.dependsOn.join(', ')})` : ''}`);
    }
    lines.push('');
  }

  if (compiled.outputFormat) {
    lines.push('## Output Format', '', compiled.outputFormat, '');
  }

  return lines.join('\n').trim() + '\n';
}
