import { useState } from 'react';
import type { CompiledPrompt, RequirementItem } from '@lucid/schema';
import { formatAsMarkdown, type PromptProfile } from '@lucid/compiler';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { KindTag } from './KindTag';
import { CollapsibleSection } from './CollapsibleSection';
import { formatSource, groupBySource } from './format';

/** Export toolbar (TASK-018 sub-feature C): copy the compiled prompt as
 * Markdown to the clipboard, or save it to a file. Only rendered when
 * `compiled` is non-null — nothing to export before a compile exists. */
const PROFILE_OPTIONS: { value: PromptProfile; label: string }[] = [
  { value: 'generic', label: 'Generic AI' },
  { value: 'claude', label: 'Claude' },
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'coding-agent', label: 'Coding Agent' },
  { value: 'image-model', label: 'Image Model' },
];

function ExportToolbar({ compiled }: { compiled: CompiledPrompt }) {
  const [status, setStatus] = useState<string | null>(null);
  const [profile, setProfile] = useState<PromptProfile>('generic');

  async function handleCopy() {
    const md = formatAsMarkdown(compiled, profile);
    try {
      await writeText(md);
      setStatus('Copied to clipboard.');
    } catch {
      // Fallback to the browser clipboard API if the Tauri plugin call fails
      // for any reason (e.g. permission not granted in this build).
      try {
        await navigator.clipboard.writeText(md);
        setStatus('Copied to clipboard.');
      } catch {
        setStatus('Copy failed.');
      }
    }
    setTimeout(() => setStatus(null), 2500);
  }

  async function handleExportMarkdown() {
    await exportToFile('md');
  }

  async function handleExportJson() {
    await exportToFile('json');
  }

  async function exportToFile(format: 'md' | 'json') {
    try {
      const path = await save({
        defaultPath: `compiled-prompt.${format}`,
        filters: [{ name: format === 'md' ? 'Markdown' : 'JSON', extensions: [format] }],
      });
      if (!path) return;
      const content = format === 'md' ? formatAsMarkdown(compiled, profile) : JSON.stringify(compiled, null, 2);
      await writeTextFile(path, content);
      setStatus('Exported.');
    } catch {
      setStatus('Export failed.');
    }
    setTimeout(() => setStatus(null), 2500);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sv-space-2)', marginBottom: 'var(--sv-space-4)' }}>
      <select
        value={profile}
        onChange={(e) => setProfile(e.target.value as PromptProfile)}
        aria-label="Output target profile"
        style={{
          fontSize: 10,
          padding: 'var(--sv-space-1) var(--sv-space-2)',
          background: 'var(--sv-ivory)',
          color: 'var(--sv-ink)',
          border: '1px solid var(--sv-hairline-strong)',
          borderRadius: 0,
        }}
      >
        {PROFILE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button type="button" onClick={handleCopy} style={{ fontSize: 10, padding: 'var(--sv-space-1) var(--sv-space-3)' }}>
        Copy Markdown
      </button>
      <button type="button" onClick={handleExportMarkdown} style={{ fontSize: 10, padding: 'var(--sv-space-1) var(--sv-space-3)' }}>
        Export .md
      </button>
      <button type="button" onClick={handleExportJson} style={{ fontSize: 10, padding: 'var(--sv-space-1) var(--sv-space-3)' }}>
        Export .json
      </button>
      {status && <span style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>{status}</span>}
    </div>
  );
}

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

      <ExportToolbar compiled={compiled} />

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
