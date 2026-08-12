import type { CompiledPrompt, RequirementItem, ArchitectureNote } from '@lucid/schema';
import { KindTag } from './KindTag';
import { CollapsibleSection } from './CollapsibleSection';
import { MetaDisclosure } from './MetaDisclosure';
import { formatSource, groupBySource } from './format';

function RequirementCard({ item }: { item: RequirementItem }) {
  return (
    <div style={{ padding: 'var(--sv-space-3) 0', borderBottom: '1px solid var(--sv-hairline)' }}>
      <KindTag kind={item.kind} />
      <div style={{ fontSize: 13, margin: '4px 0' }}>{item.text}</div>
      <MetaDisclosure item={item} />
    </div>
  );
}

/** Groups requirement cards by contributing source, each under a small label
 * (TASK-012 req 1) instead of one undifferentiated list. */
function GroupedCards({ items }: { items: RequirementItem[] }) {
  const groups = groupBySource(items);
  return (
    <>
      {groups.map(({ source, items: groupItems }) => (
        <div key={source} style={{ marginBottom: 'var(--sv-space-3)' }}>
          <div
            style={{
              fontFamily: 'var(--sv-font-mono)',
              fontSize: 10,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--sv-ink-soft)',
              margin: '2px 0',
            }}
          >
            {formatSource(source)} ({groupItems.length})
          </div>
          {groupItems.map((it, i) => (
            <RequirementCard key={i} item={it} />
          ))}
        </div>
      ))}
    </>
  );
}

function ArchNoteCard({ note }: { note: ArchitectureNote }) {
  return (
    <div style={{ padding: 'var(--sv-space-3) 0', borderBottom: '1px solid var(--sv-hairline)' }}>
      <div style={{ fontFamily: 'var(--sv-font-mono)', fontSize: 12 }}>{note.component}</div>
      <div style={{ fontSize: 13, margin: '4px 0' }}>{note.note}</div>
      <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>source: {formatSource(note.source)}</div>
    </div>
  );
}

/** Compact counts strip (TASK-012 req 4) — total requirements, unresolved,
 * conflicts, and which specialists contributed, so the user can tell at a
 * glance whether anything needs attention before scrolling. */
function SummaryStrip({
  total,
  unresolvedCount,
  conflictCount,
  specialists,
}: {
  total: number;
  unresolvedCount: number;
  conflictCount: number;
  specialists: string[];
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--sv-space-4)',
        padding: 'var(--sv-space-3) 0',
        marginBottom: 'var(--sv-space-4)',
        borderBottom: '1px solid var(--sv-hairline)',
      }}
    >
      <div>
        <div className="sv-label">Requirements</div>
        <div style={{ fontFamily: 'var(--sv-font-head)', fontSize: 18 }}>{total}</div>
      </div>
      <div>
        <div className="sv-label" style={{ color: unresolvedCount > 0 ? 'var(--sv-burgundy)' : undefined }}>
          Unresolved
        </div>
        <div
          style={{
            fontFamily: 'var(--sv-font-head)',
            fontSize: 18,
            color: unresolvedCount > 0 ? 'var(--sv-burgundy)' : undefined,
          }}
        >
          {unresolvedCount}
        </div>
      </div>
      <div>
        <div className="sv-label" style={{ color: conflictCount > 0 ? 'var(--sv-alert)' : undefined }}>
          Conflicts
        </div>
        <div style={{ fontFamily: 'var(--sv-font-head)', fontSize: 18, color: conflictCount > 0 ? 'var(--sv-alert)' : undefined }}>
          {conflictCount}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 120 }}>
        <div className="sv-label">Specialists</div>
        <div style={{ fontSize: 12, color: 'var(--sv-ink-soft)' }}>
          {specialists.length > 0 ? specialists.map(formatSource).join(', ') : '—'}
        </div>
      </div>
    </div>
  );
}

export function DecisionsPanel({ compiled }: { compiled: CompiledPrompt | null }) {
  if (!compiled) {
    return (
      <div style={{ padding: 'var(--sv-space-4)', color: 'var(--sv-ink-soft)', fontSize: 13 }}>
        Decisions, assumptions, and unresolved items will appear here after compiling.
      </div>
    );
  }

  const allRequirements: RequirementItem[] = [
    ...compiled.userRequirements,
    ...compiled.nonNegotiables,
    ...compiled.preferences,
    ...compiled.constraints,
    ...compiled.assumptions,
    ...compiled.functionalRequirements,
  ].filter((it) => it.kind !== 'user');

  const unresolved = allRequirements.filter((it) => it.kind === 'unresolved');
  // Conflict findings (source: 'conflict-engine') get their own distinct
  // section (TASK-012 req 3), separate from routine recommendations, so a
  // genuine two-sided disagreement doesn't blend into the general bucket.
  const conflicts = allRequirements.filter((it) => it.kind !== 'unresolved' && it.source === 'conflict-engine');
  const other = allRequirements.filter((it) => it.kind !== 'unresolved' && it.source !== 'conflict-engine');

  const specialists = Array.from(
    new Set(allRequirements.map((it) => it.source).filter((s) => s.endsWith('-specialist')))
  );

  return (
    <div style={{ padding: 'var(--sv-space-4)' }}>
      <h2 style={{ fontSize: 16, marginBottom: 'var(--sv-space-2)' }}>Inspectability</h2>

      <SummaryStrip
        total={allRequirements.length}
        unresolvedCount={unresolved.length}
        conflictCount={conflicts.length}
        specialists={specialists}
      />

      {unresolved.length > 0 && (
        <div style={{ marginBottom: 'var(--sv-space-5)' }}>
          <div className="sv-label" style={{ color: 'var(--sv-burgundy)', marginBottom: 'var(--sv-space-2)' }}>
            Unresolved — needs your input ({unresolved.length})
          </div>
          <GroupedCards items={unresolved} />
        </div>
      )}

      {conflicts.length > 0 && (
        <div style={{ marginBottom: 'var(--sv-space-5)' }}>
          <div
            className="sv-label"
            style={{ color: 'var(--sv-alert)', marginBottom: 'var(--sv-space-2)', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span
              style={{
                fontFamily: 'var(--sv-font-mono)',
                fontSize: 10,
                border: '1px solid var(--sv-alert)',
                padding: '1px 6px',
              }}
            >
              conflict
            </span>
            Conflicts ({conflicts.length})
          </div>
          {conflicts.map((it, i) => (
            <RequirementCard key={i} item={it} />
          ))}
        </div>
      )}

      {other.length > 0 && (
        <CollapsibleSection title="Decisions & Assumptions" count={other.length} defaultOpen={false}>
          <GroupedCards items={other} />
        </CollapsibleSection>
      )}

      {compiled.architecture && compiled.architecture.length > 0 && (
        <CollapsibleSection title="Architecture Notes" count={compiled.architecture.length} defaultOpen={true}>
          {compiled.architecture.map((n, i) => (
            <ArchNoteCard key={i} note={n} />
          ))}
        </CollapsibleSection>
      )}

      {allRequirements.length === 0 && (!compiled.architecture || compiled.architecture.length === 0) && (
        <div style={{ color: 'var(--sv-ink-soft)', fontSize: 13 }}>Nothing inferred beyond what you stated.</div>
      )}
    </div>
  );
}
