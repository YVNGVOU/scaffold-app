import type { ArchitectureNote, CompiledPrompt, RequirementItem } from '@lucid/schema';

/** The requirement-item categories present on every CompiledPrompt. */
const REQUIREMENT_CATEGORIES = [
  'userRequirements',
  'nonNegotiables',
  'preferences',
  'constraints',
  'assumptions',
  'functionalRequirements',
] as const;

export type RequirementCategoryKey = (typeof REQUIREMENT_CATEGORIES)[number];

const SCALAR_FIELDS = ['mission', 'context', 'objective', 'role', 'outputFormat'] as const;

export type ScalarFieldKey = (typeof SCALAR_FIELDS)[number];

export interface CategoryDiff {
  added: RequirementItem[];
  removed: RequirementItem[];
}

export interface ScalarFieldChange {
  field: ScalarFieldKey;
  from: string | undefined;
  to: string | undefined;
}

export interface ArchitectureNoteChange {
  component: string;
  from: ArchitectureNote;
  to: ArchitectureNote;
}

export interface CompiledPromptDiff {
  categories: Record<RequirementCategoryKey, CategoryDiff>;
  fieldChanges: ScalarFieldChange[];
  architecture: {
    added: ArchitectureNote[];
    removed: ArchitectureNote[];
    changed: ArchitectureNoteChange[];
  };
}

function diffCategory(a: RequirementItem[], b: RequirementItem[]): CategoryDiff {
  const aTexts = new Set(a.map((item) => item.text));
  const bTexts = new Set(b.map((item) => item.text));
  return {
    added: b.filter((item) => !aTexts.has(item.text)),
    removed: a.filter((item) => !bTexts.has(item.text)),
  };
}

function architectureNoteEquals(x: ArchitectureNote, y: ArchitectureNote): boolean {
  return (
    x.note === y.note &&
    x.source === y.source &&
    x.dependsOn.length === y.dependsOn.length &&
    x.dependsOn.every((dep, i) => dep === y.dependsOn[i])
  );
}

/**
 * TASK-020 (compile version history / diff view): pure structural diff
 * between two CompiledPrompt versions of the same prompt. Zero AI/inference
 * involved, deterministic, never mutates either input.
 *
 * Requirement-item categories are diffed as a set of `text` values (not a
 * positional/index diff), so reordering items within a category alone never
 * produces false added/removed entries. Architecture notes are matched by
 * `component` name.
 */
export function formatDiff(a: CompiledPrompt, b: CompiledPrompt): CompiledPromptDiff {
  const categories = {} as Record<RequirementCategoryKey, CategoryDiff>;
  for (const key of REQUIREMENT_CATEGORIES) {
    categories[key] = diffCategory(a[key], b[key]);
  }

  const fieldChanges: ScalarFieldChange[] = [];
  for (const field of SCALAR_FIELDS) {
    const from = a[field];
    const to = b[field];
    if (from !== to) {
      fieldChanges.push({ field, from, to });
    }
  }

  const aArch = a.architecture ?? [];
  const bArch = b.architecture ?? [];
  const aByComponent = new Map(aArch.map((n) => [n.component, n]));
  const bByComponent = new Map(bArch.map((n) => [n.component, n]));

  const addedArch: ArchitectureNote[] = [];
  const removedArch: ArchitectureNote[] = [];
  const changedArch: ArchitectureNoteChange[] = [];

  for (const note of bArch) {
    const prior = aByComponent.get(note.component);
    if (!prior) {
      addedArch.push(note);
    } else if (!architectureNoteEquals(prior, note)) {
      changedArch.push({ component: note.component, from: prior, to: note });
    }
  }
  for (const note of aArch) {
    if (!bByComponent.has(note.component)) {
      removedArch.push(note);
    }
  }

  return {
    categories,
    fieldChanges,
    architecture: { added: addedArch, removed: removedArch, changed: changedArch },
  };
}
