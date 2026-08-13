import { useState } from 'react';
import type { CompiledPrompt, RequirementItem, ArchitectureNote } from '@lucid/schema';
import { mergeAnswer, isAnswered } from '@lucid/compiler';
import { KindTag } from './KindTag';
import { CollapsibleSection } from './CollapsibleSection';
import { MetaDisclosure } from './MetaDisclosure';
import { ProvenanceTip } from './ProvenanceTip';
import { formatSource, groupBySource } from './format';

/** Inline free-text answer input + submit action for a single unresolved
 * item (TASK-017 req 1/2). Calls mergeAnswer (pure, headless-testable) and
 * lifts the resulting CompiledPrompt up via onAnswered. */
function UnresolvedItemCard({
  item,
  compiled,
  onAnswered,
}: {
  item: RequirementItem;
  compiled: CompiledPrompt;
  onAnswered: (updated: CompiledPrompt) => void;
}) {
  const [answer, setAnswer] = useState('');

  function submit() {
    const trimmed = answer.trim();
    if (!trimmed) return;
    const updated = mergeAnswer(compiled, item, trimmed);
    onAnswered(updated);
    setAnswer('');
  }

  return (
    <div style={{ padding: 'var(--sv-space-3) 0', borderBottom: '1px solid var(--sv-hairline)' }}>
      <ProvenanceTip item={item}>
        <KindTag kind={item.kind} />
      </ProvenanceTip>
      <div style={{ fontSize: 13, margin: '4px 0' }}>{item.text}</div>
      <MetaDisclosure item={item} />
      <div style={{ display: 'flex', gap: 6, marginTop: 'var(--sv-space-2)' }}>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="Your answer…"
          style={{
            flex: 1,
            fontSize: 12,
            background: 'var(--sv-ivory-dim)',
            border: '1px solid var(--sv-hairline)',
            color: 'inherit',
            padding: '4px 6px',
          }}
        />
        <button type="button" onClick={submit} disabled={!answer.trim()} style={{ fontSize: 11 }}>
          Answer
        </button>
      </div>
    </div>
  );
}

function RequirementCard({ item }: { item: RequirementItem }) {
  return (
    <div style={{ padding: 'var(--sv-space-3) 0', borderBottom: '1px solid var(--sv-hairline)' }}>
      <ProvenanceTip item={item}>
        <KindTag kind={item.kind} />
      </ProvenanceTip>
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

export function DecisionsPanel({
  compiled,
  onAnswered,
  onConfirmRecompile,
  recompiling,
}: {
  compiled: CompiledPrompt | null;
  onAnswered?: (updated: CompiledPrompt) => void;
  /** TASK-030 Part A: fires a full pipeline re-run using the current
   * compiled result's answered items folded into an augmented raw input.
   * Only rendered once at least one answered item exists (see `answered`
   * below). */
  onConfirmRecompile?: () => void;
  /** True while a compile (normal or Confirm & Recompile) is in flight —
   * used to disable the button and show in-progress copy so a second
   * recompile can't be fired mid-run. */
  recompiling?: boolean;
}) {
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

  // Once an item is answered (a matching kind:'user' answer exists), it
  // leaves the unresolved section/count (TASK-017 req 3) — the original
  // unresolved item stays in the historical record untouched, it's just no
  // longer rendered/counted as needing input.
  const unresolvedAll = allRequirements.filter((it) => it.kind === 'unresolved');
  const unresolved = unresolvedAll.filter((it) => !isAnswered(it, compiled));
  const answered = unresolvedAll.filter((it) => isAnswered(it, compiled));
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
          {unresolved.map((it, i) => (
            <UnresolvedItemCard
              key={i}
              item={it}
              compiled={compiled}
              onAnswered={(updated) => onAnswered?.(updated)}
            />
          ))}
        </div>
      )}

      {answered.length > 0 && (
        <div style={{ marginBottom: 'var(--sv-space-5)' }}>
          {/* TASK-030 Part A: visible once at least one answered item exists
              for the current compiled result. Fires a REAL full re-run of the
              currently-selected pipeline mode with the answers folded into an
              augmented raw input — not a merge-only shortcut. */}
          <button
            type="button"
            className="sv-primary"
            onClick={() => onConfirmRecompile?.()}
            disabled={recompiling || !onConfirmRecompile}
            style={{ marginBottom: 'var(--sv-space-3)', width: '100%' }}
          >
            {recompiling ? 'Recompiling…' : `Confirm & Recompile (${answered.length} answered)`}
          </button>
          <CollapsibleSection title="Answered" count={answered.length} defaultOpen={false}>
            {answered.map((it, i) => (
              <RequirementCard key={i} item={it} />
            ))}
          </CollapsibleSection>
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
