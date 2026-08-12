import { useMemo, useState, type MouseEvent } from 'react';
import type { Prompt } from '../lib/api';
import { renamePrompt, deletePrompt, createPrompt } from '../lib/api';

interface Props {
  prompts: Prompt[];
  activeId: string | null;
  onSelect: (p: Prompt) => void;
  onNew: () => void;
  onPromptsChanged: () => void;
  onOpenSettings: () => void;
}

/** A single prompt row with inline rename (click-to-edit) and delete
 * (confirm via window.confirm, TASK-018 sub-feature B). */
function PromptRow({
  p,
  active,
  onSelect,
  onChanged,
}: {
  p: Prompt;
  active: boolean;
  onSelect: (p: Prompt) => void;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(p.title);

  async function commitRename() {
    const trimmed = title.trim();
    setEditing(false);
    if (!trimmed || trimmed === p.title) {
      setTitle(p.title);
      return;
    }
    try {
      await renamePrompt(p.id, trimmed);
      onChanged();
    } catch {
      setTitle(p.title);
    }
  }

  async function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    const ok = window.confirm(`Delete "${p.title}"? This also removes its compile history. This cannot be undone.`);
    if (!ok) return;
    try {
      await deletePrompt(p.id);
      onChanged();
    } catch {
      // leave list as-is; user can retry
    }
  }

  /** TASK-025: fork this prompt into a new, independent row with the same
   * raw_input, titled "<original> (copy)". Reuses the existing createPrompt
   * command — no new backend command needed. The compile history is
   * deliberately NOT copied (a duplicate starts fresh, ready to edit and
   * recompile on its own). Selects the new prompt afterward via onSelect. */
  async function handleDuplicate(e: MouseEvent) {
    e.stopPropagation();
    try {
      const copy = await createPrompt(`${p.title} (copy)`, p.raw_input);
      onChanged();
      onSelect(copy);
    } catch {
      // leave list as-is; user can retry
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        borderBottom: '1px solid var(--sv-hairline)',
      }}
    >
      <button
        onClick={() => !editing && onSelect(p)}
        style={{
          flex: 1,
          minWidth: 0,
          display: 'block',
          textAlign: 'left',
          textTransform: 'none',
          letterSpacing: 'normal',
          border: 'none',
          padding: 'var(--sv-space-3) var(--sv-space-4)',
          background: active ? 'var(--sv-ivory-dim)' : 'transparent',
          color: 'var(--sv-ink)',
        }}
      >
        {editing ? (
          <input
            autoFocus
            value={title}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') {
                setTitle(p.title);
                setEditing(false);
              }
            }}
            style={{ width: '100%', fontSize: 14 }}
          />
        ) : (
          <div style={{ fontFamily: 'var(--sv-font-head)', fontSize: 14, marginBottom: 2 }}>{p.title}</div>
        )}
        <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>{new Date(p.created_at).toLocaleString()}</div>
      </button>
      {!editing && (
        <div style={{ display: 'flex', flexShrink: 0, paddingRight: 'var(--sv-space-2)' }}>
          <button
            type="button"
            title="Rename"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            style={{ padding: '2px 6px', fontSize: 10 }}
          >
            Rename
          </button>
          <button
            type="button"
            title="Duplicate"
            onClick={handleDuplicate}
            style={{ padding: '2px 6px', fontSize: 10, marginLeft: 4 }}
          >
            Duplicate
          </button>
          <button
            type="button"
            title="Delete"
            onClick={handleDelete}
            style={{ padding: '2px 6px', fontSize: 10, marginLeft: 4, color: 'var(--sv-burgundy)', borderColor: 'var(--sv-burgundy)' }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function PromptList({ prompts, activeId, onSelect, onNew, onPromptsChanged, onOpenSettings }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return prompts;
    return prompts.filter(
      (p) => p.title.toLowerCase().includes(q) || p.raw_input.toLowerCase().includes(q),
    );
  }, [prompts, query]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 'var(--sv-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sv-space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 20 }}>Scaffold</h1>
          <button type="button" title="Settings" onClick={onOpenSettings} style={{ padding: '2px 8px', fontSize: 14 }}>
            ⚙
          </button>
        </div>
        <div className="sv-label">Prompt Compiler</div>
        <button className="sv-primary" onClick={onNew} style={{ marginTop: 'var(--sv-space-2)' }}>
          + New Prompt
        </button>
        <input
          type="text"
          placeholder="Search prompts (title or content)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ fontSize: 12 }}
        />
      </div>
      <hr className="sv-hairline" />
      <div className="sv-scrollpane" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--sv-space-4)', color: 'var(--sv-ink-soft)', fontSize: 12 }}>
              {prompts.length === 0 ? 'No prompts yet. Start a new one.' : 'No prompts match your search.'}
            </div>
          )}
          {filtered.map((p) => (
            <PromptRow key={p.id} p={p} active={p.id === activeId} onSelect={onSelect} onChanged={onPromptsChanged} />
          ))}
        </div>
      </div>
      <hr className="sv-hairline" />
      <div
        style={{
          padding: 'var(--sv-space-3) var(--sv-space-4)',
          fontSize: 10,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--sv-ink-soft)',
        }}
      >
        Scaffold — a SINVAUX product
      </div>
    </div>
  );
}
