import type { CompiledPrompt, RequirementItem } from '@lucid/schema';

/**
 * TASK-021 (output-target profiles): which formatting convention
 * `formatAsMarkdown` should render with. This ONLY changes presentation
 * (headings, an optional leading framing line, section ordering/labels) —
 * it never changes which facts from `CompiledPrompt` are included. No
 * profile makes an AI/network call; all are plain deterministic string
 * templates, per the original product brief's target list.
 */
export type PromptProfile = 'generic' | 'claude' | 'chatgpt' | 'coding-agent' | 'image-model';

const PROFILE_LABELS: Record<PromptProfile, string> = {
  generic: 'Generic AI',
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  'coding-agent': 'Coding Agent',
  'image-model': 'Image Model',
};

/** Optional one-line framing sentence rendered right under the title, tuned
 * per target's typical prompting convention. Purely cosmetic — the facts
 * below are identical regardless of profile. */
function framingLine(profile: PromptProfile): string | null {
  switch (profile) {
    case 'claude':
      return '_Structured for a Claude conversation — treat the sections below as your operating brief._';
    case 'chatgpt':
      return '_Paste this into ChatGPT as your system/instructions message._';
    case 'coding-agent':
      return '_Task specification for an autonomous coding agent. Treat non-negotiables and constraints as hard requirements._';
    case 'image-model':
      return '_Prompt brief for an image-generation model. Treat requirements below as visual/style directives._';
    case 'generic':
    default:
      return null;
  }
}

/**
 * TASK-018 (export options): renders a CompiledPrompt as readable Markdown,
 * for the desktop app's "copy to clipboard" / "export as file" actions.
 * TASK-021: extended with an optional `profile` parameter (defaults to
 * `'generic'`) that changes ONLY formatting/conventions (headings, an
 * optional framing sentence, section ordering) for a chosen output target
 * (Generic AI, Claude, ChatGPT, Coding Agent, Image Model). The underlying
 * `CompiledPrompt` data rendered is identical across all profiles.
 *
 * Pure data-to-text transform, zero AI/inference involved, deterministic —
 * same input always produces the same output string. Lives in
 * `packages/compiler` (not `apps/desktop/src/lib`) because it operates
 * purely on the canonical `CompiledPrompt` shape from `@lucid/schema`, no
 * presentation/DOM concerns, so it is generically useful/testable headless
 * alongside `mergeAnswer`.
 */
export function formatAsMarkdown(compiled: CompiledPrompt, profile: PromptProfile = 'generic'): string {
  const lines: string[] = [];

  const isCodingAgent = profile === 'coding-agent';
  const isImageModel = profile === 'image-model';

  const title = isCodingAgent
    ? '# Task Specification'
    : isImageModel
      ? '# Image Prompt Brief'
      : '# Compiled Prompt';
  lines.push(title);
  lines.push('');

  const framing = framingLine(profile);
  if (framing) {
    lines.push(framing, '');
  }

  lines.push(`- Target profile: ${PROFILE_LABELS[profile]}`);
  lines.push(`- Domain: ${compiled.domain}`);
  lines.push('');

  if (compiled.mission) {
    lines.push(isCodingAgent ? '## Objective (Mission)' : '## Mission', '', compiled.mission, '');
  }
  if (compiled.context) {
    lines.push('## Context', '', compiled.context, '');
  }
  if (compiled.objective) {
    lines.push('## Objective', '', compiled.objective, '');
  }
  if (compiled.role) {
    lines.push(isImageModel ? '## Style / Role' : '## Role', '', compiled.role, '');
  }

  const section = (title: string, items: RequirementItem[]) => {
    if (!items || items.length === 0) return;
    lines.push(`## ${title}`, '');
    for (const item of items) {
      lines.push(`- [${item.kind}] ${item.text}`);
    }
    lines.push('');
  };

  // Coding-agent profile surfaces hard requirements first, since they're
  // the ones an autonomous agent must never violate.
  if (isCodingAgent) {
    section('Non-Negotiables (must satisfy)', compiled.nonNegotiables);
    section('User Requirements', compiled.userRequirements);
    section('Constraints', compiled.constraints);
    section('Functional Requirements', compiled.functionalRequirements);
    section('Preferences', compiled.preferences);
    section('Assumptions', compiled.assumptions);
  } else {
    section('User Requirements', compiled.userRequirements);
    section('Non-Negotiables', compiled.nonNegotiables);
    section('Constraints', compiled.constraints);
    section('Functional Requirements', compiled.functionalRequirements);
    section('Preferences', compiled.preferences);
    section('Assumptions', compiled.assumptions);
  }

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
