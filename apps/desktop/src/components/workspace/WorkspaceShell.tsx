import type { ReactNode } from 'react';

export type WorkspaceId = 'home' | 'studio' | 'projects' | 'templates' | 'library' | 'history';

const WORKSPACES: { id: WorkspaceId; label: string; hint: string }[] = [
  { id: 'home', label: 'Home', hint: 'Command center' },
  { id: 'studio', label: 'Prompt Studio', hint: 'Compose & compile' },
  { id: 'projects', label: 'Projects', hint: 'Organize by project' },
  { id: 'templates', label: 'Templates', hint: 'Reusable starting points' },
  { id: 'library', label: 'Library', hint: 'Saved resources' },
  { id: 'history', label: 'History', hint: 'Everything, in order' },
];

interface WorkspaceShellProps {
  active: WorkspaceId;
  onNavigate: (w: WorkspaceId) => void;
  onOpenPalette: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
  children: ReactNode;
}

/** Top-level app chrome: left workspace rail + top bar. Individual
 * workspaces render inside `children`; this component owns only navigation
 * chrome, never workspace-specific state. */
export function WorkspaceShell({ active, onNavigate, onOpenPalette, onOpenSettings, onOpenNotifications, unreadCount, children }: WorkspaceShellProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '176px 1fr', height: '100vh', minHeight: 0 }}>
      <nav
        style={{
          borderRight: '1px solid var(--sv-hairline)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          background: 'var(--sv-ivory-dim)',
        }}
      >
        <div style={{ padding: 'var(--sv-space-3) var(--sv-space-3) var(--sv-space-2)' }}>
          <div className="sv-label" style={{ fontSize: 12, letterSpacing: '0.06em' }}>
            SCAFFOLD
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 var(--sv-space-2)' }}>
          {WORKSPACES.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => onNavigate(w.id)}
              title={w.hint}
              className={active === w.id ? 'sv-primary' : ''}
              style={{
                textAlign: 'left',
                fontSize: 11,
                letterSpacing: '0.02em',
                padding: 'var(--sv-space-2) var(--sv-space-3)',
                justifyContent: 'flex-start',
              }}
            >
              {w.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 'auto', padding: 'var(--sv-space-2)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button
            type="button"
            onClick={onOpenPalette}
            title="Search everything (Ctrl/Cmd+K)"
            style={{ textAlign: 'left', fontSize: 10, padding: 'var(--sv-space-2) var(--sv-space-3)', justifyContent: 'flex-start' }}
          >
            Search · ⌘K
          </button>
          <button
            type="button"
            onClick={onOpenNotifications}
            style={{ textAlign: 'left', fontSize: 10, padding: 'var(--sv-space-2) var(--sv-space-3)', display: 'flex', justifyContent: 'space-between' }}
          >
            <span>Notifications</span>
            {unreadCount > 0 && <span style={{ color: 'var(--sv-burgundy)' }}>{unreadCount}</span>}
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            style={{ textAlign: 'left', fontSize: 10, padding: 'var(--sv-space-2) var(--sv-space-3)', justifyContent: 'flex-start' }}
          >
            Settings
          </button>
        </div>
      </nav>
      <div style={{ minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  );
}
