import type { AppNotification, NotificationCategory } from '../lib/notifications';

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  compilation: 'Compilation',
  system: 'System',
  project: 'Project',
  updates: 'Updates',
  errors: 'Errors',
};

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClear: () => void;
  onClose: () => void;
}

export function NotificationCenter({ notifications, onMarkRead, onMarkAllRead, onClear, onClose }: NotificationCenterProps) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 90 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 44,
          right: 12,
          width: 340,
          maxHeight: '70vh',
          overflowY: 'auto',
          background: 'var(--sv-ivory)',
          border: '1px solid var(--sv-hairline-strong)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
        }}
        className="sv-scrollpane"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--sv-space-3)', borderBottom: '1px solid var(--sv-hairline)' }}>
          <div className="sv-label">Notifications</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button type="button" onClick={onMarkAllRead} style={{ fontSize: 9 }}>
              Mark all read
            </button>
            <button type="button" onClick={onClear} style={{ fontSize: 9 }}>
              Clear
            </button>
          </div>
        </div>
        {notifications.length === 0 && (
          <div style={{ padding: 'var(--sv-space-3)', fontSize: 11, color: 'var(--sv-ink-soft)' }}>Nothing yet.</div>
        )}
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => !n.read && onMarkRead(n.id)}
            style={{
              padding: 'var(--sv-space-2) var(--sv-space-3)',
              borderBottom: '1px solid var(--sv-hairline)',
              fontSize: 11,
              cursor: n.read ? 'default' : 'pointer',
              background: n.read ? 'transparent' : 'var(--sv-ivory-dim)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span className="sv-label" style={{ fontSize: 9 }}>
                {CATEGORY_LABELS[n.category]}
              </span>
              <span style={{ fontSize: 9, color: 'var(--sv-ink-soft)' }}>{new Date(n.createdAt).toLocaleTimeString()}</span>
            </div>
            <div>{n.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
