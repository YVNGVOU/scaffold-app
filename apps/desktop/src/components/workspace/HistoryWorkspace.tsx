import type { Prompt } from '../../lib/api';

interface HistoryWorkspaceProps {
  prompts: Prompt[];
  onOpenPrompt: (p: Prompt) => void;
}

/** Global history — every prompt ever created, newest first. Per-prompt
 * compile version history (the `compiles` table) is still viewed via the
 * existing VersionHistory modal from within Prompt Studio; this workspace is
 * the top-level "everything, in order" browse view the spec asks for. */
export function HistoryWorkspace({ prompts, onOpenPrompt }: HistoryWorkspaceProps) {
  return (
    <div className="sv-scrollpane" style={{ flex: 1, minHeight: 0, padding: 'var(--sv-space-5)' }}>
      <div className="sv-label" style={{ fontSize: 18, marginBottom: 'var(--sv-space-3)' }}>
        History
      </div>
      {prompts.length === 0 && <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>Nothing compiled yet.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {prompts.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onOpenPrompt(p)}
            style={{
              textAlign: 'left',
              fontSize: 12,
              border: '1px solid var(--sv-hairline)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title || 'Untitled prompt'}</span>
            <span style={{ fontSize: 10, color: 'var(--sv-ink-soft)', flexShrink: 0, marginLeft: 8 }}>
              {new Date(p.created_at).toLocaleDateString()}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
