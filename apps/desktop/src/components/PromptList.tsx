import type { Prompt } from '../lib/api';
import { UpdateChecker } from './UpdateChecker';

interface Props {
  prompts: Prompt[];
  activeId: string | null;
  onSelect: (p: Prompt) => void;
  onNew: () => void;
}

export function PromptList({ prompts, activeId, onSelect, onNew }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 'var(--sv-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sv-space-3)' }}>
        <h1 style={{ fontSize: 20 }}>Scaffold</h1>
        <div className="sv-label">Prompt Compiler</div>
        <button className="sv-primary" onClick={onNew} style={{ marginTop: 'var(--sv-space-2)' }}>
          + New Prompt
        </button>
      </div>
      <hr className="sv-hairline" />
      <div className="sv-scrollpane" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          {prompts.length === 0 && (
            <div style={{ padding: 'var(--sv-space-4)', color: 'var(--sv-ink-soft)', fontSize: 12 }}>
              No prompts yet. Start a new one.
            </div>
          )}
          {prompts.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                textTransform: 'none',
                letterSpacing: 'normal',
                border: 'none',
                borderBottom: '1px solid var(--sv-hairline)',
                padding: 'var(--sv-space-3) var(--sv-space-4)',
                background: p.id === activeId ? 'var(--sv-ivory-dim)' : 'transparent',
                color: 'var(--sv-ink)',
              }}
            >
              <div style={{ fontFamily: 'var(--sv-font-head)', fontSize: 14, marginBottom: 2 }}>{p.title}</div>
              <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>
                {new Date(p.created_at).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      </div>
      <hr className="sv-hairline" />
      <div style={{ padding: 'var(--sv-space-3) var(--sv-space-4)' }}>
        <UpdateChecker />
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
