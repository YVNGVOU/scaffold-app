import type { Prompt } from '../../lib/api';
import type { WorkspaceId } from './WorkspaceShell';

interface HomeWorkspaceProps {
  prompts: Prompt[];
  onOpenPrompt: (p: Prompt) => void;
  onNewPrompt: () => void;
  onNavigate: (w: WorkspaceId) => void;
  onOpenPalette: () => void;
  onOpenImport: () => void;
}

export function HomeWorkspace({ prompts, onOpenPrompt, onNewPrompt, onNavigate, onOpenPalette, onOpenImport }: HomeWorkspaceProps) {
  const recent = prompts.slice(0, 8);
  const favorites = prompts.filter((p) => p.is_favorite).slice(0, 8);
  const projectsInUse = new Set(prompts.map((p) => p.project_id).filter(Boolean)).size;

  return (
    <div className="sv-scrollpane" style={{ flex: 1, minHeight: 0, padding: 'var(--sv-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--sv-space-5)' }}>
      <div>
        <div className="sv-label" style={{ fontSize: 18, marginBottom: 'var(--sv-space-3)' }}>
          Command center
        </div>
        <div style={{ display: 'flex', gap: 'var(--sv-space-2)', flexWrap: 'wrap' }}>
          <button className="sv-primary" type="button" onClick={onNewPrompt}>
            New Prompt
          </button>
          <button type="button" onClick={() => onNavigate('studio')}>
            Compile Prompt
          </button>
          <button type="button" onClick={() => onNavigate('projects')}>
            New Project
          </button>
          <button type="button" onClick={() => onNavigate('templates')}>
            Template Library
          </button>
          <button type="button" onClick={onOpenImport}>
            Import
          </button>
          <button type="button" onClick={onOpenPalette}>
            Search · ⌘K
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sv-space-3)' }}>
        <StatCard label="Prompts" value={prompts.length} />
        <StatCard label="Favorites" value={favorites.length} />
        <StatCard label="Projects in use" value={projectsInUse} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sv-space-5)' }}>
        <div>
          <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
            Recent
          </div>
          {recent.length === 0 && <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>Nothing yet — compile your first prompt.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {recent.map((p) => (
              <PromptRow key={p.id} prompt={p} onClick={() => onOpenPrompt(p)} />
            ))}
          </div>
        </div>
        <div>
          <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
            Favorites
          </div>
          {favorites.length === 0 && <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>None pinned yet.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {favorites.map((p) => (
              <PromptRow key={p.id} prompt={p} onClick={() => onOpenPrompt(p)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: '1px solid var(--sv-hairline)', padding: 'var(--sv-space-3)' }}>
      <div style={{ fontSize: 24, fontWeight: 600 }}>{value}</div>
      <div className="sv-label" style={{ fontSize: 10 }}>
        {label}
      </div>
    </div>
  );
}

function PromptRow({ prompt, onClick }: { prompt: Prompt; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        fontSize: 12,
        padding: 'var(--sv-space-2) var(--sv-space-3)',
        justifyContent: 'flex-start',
        border: '1px solid var(--sv-hairline)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
      title={prompt.title}
    >
      {prompt.title || 'Untitled prompt'}
    </button>
  );
}
