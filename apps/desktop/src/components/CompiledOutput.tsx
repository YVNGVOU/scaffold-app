import type { CompiledPrompt, RequirementItem } from '@lucid/schema';
import { KindTag } from './KindTag';
import { CollapsibleSection } from './CollapsibleSection';
import { formatSource, groupBySource } from './format';

function Item({ item }: { item: RequirementItem }) {
  return (
    <li style={{ marginBottom: 'var(--sv-space-2)', listStyle: 'none' }}>
      <KindTag kind={item.kind} />
      <span>{item.text}</span>
    </li>
  );
}

/** Renders a category's items grouped by contributing source (TASK-012 req 1),
 * each group under a small source label so a category with several
 * specialists' worth of items reads as distinct clusters, not one flat list. */
function GroupedItems({ items }: { items: RequirementItem[] }) {
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
              marginBottom: 2,
            }}
          >
            {formatSource(source)}
          </div>
          <ul style={{ margin: 0, padding: 0 }}>
            {groupItems.map((it, i) => (
              <Item key={i} item={it} />
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

function Section({
  title,
  items,
  collapsible = false,
  defaultOpen = true,
  accentColor,
}: {
  title: string;
  items: RequirementItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
  accentColor?: string;
}) {
  if (!items || items.length === 0) return null;

  if (collapsible) {
    return (
      <CollapsibleSection title={title} count={items.length} defaultOpen={defaultOpen} accentColor={accentColor}>
        <GroupedItems items={items} />
      </CollapsibleSection>
    );
  }

  return (
    <div style={{ marginBottom: 'var(--sv-space-5)' }}>
      <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)', color: accentColor }}>
        {title} ({items.length})
      </div>
      <GroupedItems items={items} />
    </div>
  );
}

export function CompiledOutput({ compiled }: { compiled: CompiledPrompt | null }) {
  if (!compiled) {
    return (
      <div style={{ color: 'var(--sv-ink-soft)', fontSize: 13, padding: 'var(--sv-space-4)' }}>
        Compile a prompt to see structured output here.
      </div>
    );
  }

  // Unresolved ambiguities are stored in `compiled.assumptions` (see
  // synthesis.ts) but are high-signal ("needs your input") — split them out
  // so they stay visible/expanded while the rest of Assumptions collapses.
  const unresolved = compiled.assumptions.filter((it) => it.kind === 'unresolved');
  const restAssumptions = compiled.assumptions.filter((it) => it.kind !== 'unresolved');

  return (
    <div style={{ padding: 'var(--sv-space-4)' }}>
      <div style={{ display: 'flex', gap: 'var(--sv-space-4)', alignItems: 'baseline', marginBottom: 'var(--sv-space-4)' }}>
        <h2 style={{ fontSize: 18 }}>Compiled Prompt</h2>
        <span className="sv-label">domain: {compiled.domain}</span>
      </div>

      {compiled.mission && (
        <div style={{ marginBottom: 'var(--sv-space-4)' }}>
          <div className="sv-label">Mission</div>
          <div>{compiled.mission}</div>
        </div>
      )}
      {compiled.context && (
        <div style={{ marginBottom: 'var(--sv-space-4)' }}>
          <div className="sv-label">Context</div>
          <div>{compiled.context}</div>
        </div>
      )}
      {compiled.objective && (
        <div style={{ marginBottom: 'var(--sv-space-4)' }}>
          <div className="sv-label">Objective</div>
          <div>{compiled.objective}</div>
        </div>
      )}
      {compiled.role && (
        <div style={{ marginBottom: 'var(--sv-space-4)' }}>
          <div className="sv-label">Role</div>
          <div>{compiled.role}</div>
        </div>
      )}

      {/* High-signal categories: expanded by default, per TASK-012 req 2. */}
      <Section title="User Requirements" items={compiled.userRequirements} />
      <Section title="Non-Negotiables" items={compiled.nonNegotiables} />
      <Section title="Unresolved — needs your input" items={unresolved} accentColor="var(--sv-burgundy)" />
      <Section title="Constraints" items={compiled.constraints} />
      <Section title="Functional Requirements" items={compiled.functionalRequirements} />

      {/* Secondary/long categories: collapsible, collapsed by default, count shown. */}
      <Section title="Preferences" items={compiled.preferences} collapsible defaultOpen={false} />
      <Section title="Assumptions" items={restAssumptions} collapsible defaultOpen={false} />

      {compiled.architecture && compiled.architecture.length > 0 && (
        <div style={{ marginBottom: 'var(--sv-space-5)' }}>
          <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>Architecture</div>
          {compiled.architecture.map((a, i) => (
            <div key={i} style={{ marginBottom: 'var(--sv-space-3)', borderLeft: '2px solid var(--sv-burgundy)', paddingLeft: 'var(--sv-space-3)' }}>
              <div style={{ fontFamily: 'var(--sv-font-mono)', fontSize: 12 }}>{a.component}</div>
              <div style={{ fontSize: 13, color: 'var(--sv-ink-soft)' }}>{a.note}</div>
              {a.dependsOn.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>depends on: {a.dependsOn.join(', ')}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {compiled.outputFormat && (
        <div>
          <div className="sv-label">Output Format</div>
          <div>{compiled.outputFormat}</div>
        </div>
      )}
    </div>
  );
}
