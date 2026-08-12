import { useState } from 'react';
import type { CompiledPrompt } from '@lucid/schema';
import { SECTION_GROUPS, type SectionGroupKey } from '@lucid/compiler';

/** Real item/word count backing each group, for the panel's "(n)" badges —
 * mirrors the field mapping in packages/compiler/src/formatAsMarkdown.ts's
 * `renderGroup`, so what the panel shows always matches what reordering it
 * actually changes in the exported text. */
function groupCount(compiled: CompiledPrompt | null, key: SectionGroupKey): number {
  if (!compiled) return 0;
  switch (key) {
    case 'objective':
      return compiled.objective ? 1 : 0;
    case 'role':
      return compiled.role ? 1 : 0;
    case 'context':
      return (compiled.mission ? 1 : 0) + (compiled.context ? 1 : 0);
    case 'constraints':
      return compiled.nonNegotiables.length + compiled.constraints.length;
    case 'process':
      return compiled.architecture?.length ?? 0;
    case 'requirements':
      return (
        compiled.userRequirements.length +
        compiled.functionalRequirements.length +
        compiled.preferences.length +
        compiled.assumptions.length
      );
    case 'outputFormat':
      return compiled.outputFormat ? 1 : 0;
    case 'examples':
    case 'evaluation':
      return 0;
  }
}

interface ArchitecturePanelProps {
  compiled: CompiledPrompt | null;
  order: SectionGroupKey[];
  onReorder: (order: SectionGroupKey[]) => void;
}

/** Visual, functional prompt-architecture tree. Drag a row to move it — the
 * new order is persisted and fed straight into CompiledOutput's rendering
 * AND formatAsMarkdown's export, so this is a real structural control, not a
 * decorative diagram. */
export function ArchitecturePanel({ compiled, order, onReorder }: ArchitecturePanelProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const metaByKey = Object.fromEntries(SECTION_GROUPS.map((g) => [g.key, g]));

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...order];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    onReorder(next);
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <div style={{ padding: 'var(--sv-space-3)' }}>
      <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
        Architecture
      </div>
      <div style={{ fontSize: 10, color: 'var(--sv-ink-soft)', marginBottom: 'var(--sv-space-3)' }}>
        Drag to reorder. This is the real section order used in the output above and in every export.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {order.map((key, i) => {
          const meta = metaByKey[key];
          const count = groupCount(compiled, key);
          return (
            <div
              key={key}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(i);
              }}
              onDrop={() => handleDrop(i)}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sv-space-2)',
                padding: 'var(--sv-space-2) var(--sv-space-2)',
                border: '1px solid var(--sv-hairline)',
                background: overIndex === i ? 'var(--sv-ivory-dim)' : 'transparent',
                cursor: 'grab',
                opacity: dragIndex === i ? 0.4 : 1,
                fontSize: 12,
              }}
            >
              <span style={{ color: 'var(--sv-ink-soft)', fontSize: 10 }}>⠿</span>
              <span style={{ flex: 1 }}>{meta.label}</span>
              {meta.hasBackingData ? (
                <span style={{ fontSize: 10, color: 'var(--sv-ink-soft)' }}>{count}</span>
              ) : (
                <span style={{ fontSize: 9, color: 'var(--sv-ink-soft)', fontStyle: 'italic' }}>not yet built</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
