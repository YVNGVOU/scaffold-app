import { useEffect, useMemo, useState } from 'react';
import { listProjects, listTemplates, type Prompt, type Project, type Template } from '../../lib/api';
import type { WorkspaceId } from './WorkspaceShell';

interface Command {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
}

interface CommandPaletteProps {
  prompts: Prompt[];
  onClose: () => void;
  onNavigate: (w: WorkspaceId) => void;
  onNewPrompt: () => void;
  onCompile: () => void;
  onOpenPrompt: (p: Prompt) => void;
  onOpenSettings: () => void;
  onOpenImport: () => void;
  onUseTemplate: (body: string) => void;
}

/** Real Ctrl/Cmd+K command palette: static app commands + fuzzy-ish substring
 * match over prompt titles, one flat keyboard-navigable list. */
export function CommandPalette({ prompts, onClose, onNavigate, onNewPrompt, onCompile, onOpenPrompt, onOpenSettings, onOpenImport, onUseTemplate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    listProjects().then(setProjects).catch(() => {});
    listTemplates().then(setTemplates).catch(() => {});
  }, []);

  const staticCommands: Command[] = useMemo(
    () => [
      { id: 'new-prompt', label: 'New Prompt', run: onNewPrompt },
      { id: 'compile', label: 'Compile', run: onCompile },
      { id: 'go-home', label: 'Go to Home', run: () => onNavigate('home') },
      { id: 'go-studio', label: 'Go to Prompt Studio', run: () => onNavigate('studio') },
      { id: 'go-projects', label: 'Go to Projects', run: () => onNavigate('projects') },
      { id: 'go-templates', label: 'Go to Templates', run: () => onNavigate('templates') },
      { id: 'go-library', label: 'Go to Library', run: () => onNavigate('library') },
      { id: 'go-history', label: 'Go to History', run: () => onNavigate('history') },
      { id: 'settings', label: 'Open Settings', run: onOpenSettings },
      { id: 'import', label: 'Import…', run: onOpenImport },
    ],
    [onNavigate, onNewPrompt, onCompile, onOpenSettings, onOpenImport],
  );

  const promptCommands: Command[] = useMemo(
    () =>
      prompts.slice(0, 30).map((p) => ({
        id: `prompt-${p.id}`,
        label: p.title || 'Untitled prompt',
        hint: 'Prompt',
        run: () => onOpenPrompt(p),
      })),
    [prompts, onOpenPrompt],
  );

  const projectCommands: Command[] = useMemo(
    () =>
      projects.slice(0, 20).map((p) => ({
        id: `project-${p.id}`,
        label: p.name,
        hint: 'Project',
        run: () => onNavigate('projects'),
      })),
    [projects, onNavigate],
  );

  const templateCommands: Command[] = useMemo(
    () =>
      templates.slice(0, 20).map((t) => ({
        id: `template-${t.id}`,
        label: t.title,
        hint: 'Template',
        run: () => onUseTemplate(t.body),
      })),
    [templates, onUseTemplate],
  );

  const allCommands = useMemo(
    () => [...staticCommands, ...promptCommands, ...projectCommands, ...templateCommands],
    [staticCommands, promptCommands, projectCommands, templateCommands],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCommands;
    return allCommands.filter((c) => c.label.toLowerCase().includes(q));
  }, [allCommands, query]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = filtered[selected];
        if (cmd) {
          cmd.run();
          onClose();
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [filtered, selected, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520,
          maxWidth: '90vw',
          background: 'var(--sv-ivory)',
          border: '1px solid var(--sv-hairline-strong)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
        }}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command or search prompts…"
          style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--sv-hairline)', padding: 'var(--sv-space-3)', fontSize: 13 }}
        />
        <div style={{ maxHeight: '50vh', overflowY: 'auto' }} className="sv-scrollpane">
          {filtered.length === 0 && (
            <div style={{ padding: 'var(--sv-space-3)', fontSize: 11, color: 'var(--sv-ink-soft)' }}>No matches</div>
          )}
          {filtered.map((c, i) => (
            <div
              key={c.id}
              onMouseEnter={() => setSelected(i)}
              onClick={() => {
                c.run();
                onClose();
              }}
              style={{
                padding: 'var(--sv-space-2) var(--sv-space-3)',
                fontSize: 12,
                cursor: 'pointer',
                background: i === selected ? 'var(--sv-ivory-dim)' : 'transparent',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{c.label}</span>
              {c.hint && <span style={{ fontSize: 10, color: 'var(--sv-ink-soft)' }}>{c.hint}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
