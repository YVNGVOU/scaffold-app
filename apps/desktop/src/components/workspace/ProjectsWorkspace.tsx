import { useEffect, useState } from 'react';
import {
  createProject,
  deleteProject,
  listProjects,
  setPromptProject,
  type Project,
  type Prompt,
} from '../../lib/api';

interface ProjectsWorkspaceProps {
  prompts: Prompt[];
  onOpenPrompt: (p: Prompt) => void;
  onPromptsChanged: () => void;
}

export function ProjectsWorkspace({ prompts, onOpenPrompt, onPromptsChanged }: ProjectsWorkspaceProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      setProjects(await listProjects());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    await createProject(name, '');
    setNewName('');
    await refresh();
  }

  async function handleDelete(id: string) {
    await deleteProject(id);
    if (activeProjectId === id) setActiveProjectId(null);
    await refresh();
    onPromptsChanged();
  }

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const projectPrompts = activeProjectId ? prompts.filter((p) => p.project_id === activeProjectId) : [];
  const unassigned = prompts.filter((p) => !p.project_id);

  if (activeProject) {
    return (
      <div className="sv-scrollpane" style={{ flex: 1, minHeight: 0, padding: 'var(--sv-space-5)' }}>
        <button type="button" onClick={() => setActiveProjectId(null)} style={{ fontSize: 11, marginBottom: 'var(--sv-space-3)' }}>
          ← All Projects
        </button>
        <div className="sv-label" style={{ fontSize: 18, marginBottom: 'var(--sv-space-1)' }}>
          {activeProject.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)', marginBottom: 'var(--sv-space-4)' }}>
          {projectPrompts.length} prompt{projectPrompts.length === 1 ? '' : 's'}
        </div>

        <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
          Prompts in this project
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 'var(--sv-space-4)' }}>
          {projectPrompts.map((p) => (
            <div key={p.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => onOpenPrompt(p)}
                style={{ flex: 1, textAlign: 'left', fontSize: 12, border: '1px solid var(--sv-hairline)' }}
              >
                {p.title || 'Untitled prompt'}
              </button>
              <button
                type="button"
                title="Remove from project"
                onClick={async () => {
                  await setPromptProject(p.id, null);
                  onPromptsChanged();
                }}
                style={{ fontSize: 10 }}
              >
                Remove
              </button>
            </div>
          ))}
          {projectPrompts.length === 0 && <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>No prompts assigned yet.</div>}
        </div>

        {unassigned.length > 0 && (
          <>
            <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
              Add an unassigned prompt
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {unassigned.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={async () => {
                    await setPromptProject(p.id, activeProject.id);
                    onPromptsChanged();
                  }}
                  style={{ textAlign: 'left', fontSize: 12, border: '1px solid var(--sv-hairline)' }}
                >
                  + {p.title || 'Untitled prompt'}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="sv-scrollpane" style={{ flex: 1, minHeight: 0, padding: 'var(--sv-space-5)' }}>
      <div className="sv-label" style={{ fontSize: 18, marginBottom: 'var(--sv-space-3)' }}>
        Projects
      </div>
      <div style={{ display: 'flex', gap: 'var(--sv-space-2)', marginBottom: 'var(--sv-space-4)' }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New project name"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          style={{ flex: 1, fontSize: 12, padding: 'var(--sv-space-2)' }}
        />
        <button className="sv-primary" type="button" onClick={handleCreate} disabled={!newName.trim()}>
          Create
        </button>
      </div>

      {loading && <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>Loading…</div>}
      {!loading && projects.length === 0 && (
        <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>No projects yet — create one to start grouping prompts.</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--sv-space-3)' }}>
        {projects.map((proj) => {
          const count = prompts.filter((p) => p.project_id === proj.id).length;
          return (
            <div key={proj.id} style={{ border: '1px solid var(--sv-hairline)', padding: 'var(--sv-space-3)' }}>
              <button
                type="button"
                onClick={() => setActiveProjectId(proj.id)}
                style={{ textAlign: 'left', width: '100%', border: 'none', padding: 0, fontSize: 13, fontWeight: 600 }}
              >
                {proj.name}
              </button>
              <div style={{ fontSize: 10, color: 'var(--sv-ink-soft)', margin: 'var(--sv-space-1) 0 var(--sv-space-2)' }}>
                {count} prompt{count === 1 ? '' : 's'}
              </div>
              <button type="button" onClick={() => handleDelete(proj.id)} style={{ fontSize: 10 }}>
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
