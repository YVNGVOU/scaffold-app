import { useEffect, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { openUrl } from '@tauri-apps/plugin-opener';
import { setSetting, getSetting, getStorageInfo, type StorageInfo } from '../lib/api';
import { supabase } from '../lib/supabase';
import { AUTH_LAST_VERIFIED_KEY } from './AuthGate';
import { UpdateChecker } from './UpdateChecker';
import type { AppearanceSettings, ThemeChoice, AccentChoice, DensityChoice } from '../lib/appearance';
import type { NotificationCategory, NotificationSettings } from '../lib/notifications';
import { getEntitlement, startCheckout, type Entitlement, type PaidTier } from '../lib/cloud';
import { runSync, LAST_SYNC_KEY } from '../lib/sync';

export type CompileMode = 'architect' | 'quick' | 'master';

export const DEFAULT_MODE_KEY = 'default_mode';
export const MAX_ROUNDS_KEY = 'master_max_rounds';
export const DEFAULT_MAX_ROUNDS = 2;
const REPO_URL = 'https://github.com/YVNGVOU/scaffold-app';

type Category = 'general' | 'appearance' | 'compiler' | 'notifications' | 'privacy' | 'shortcuts' | 'account' | 'updates';

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'compiler', label: 'Compiler' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'privacy', label: 'Privacy & Storage' },
  { key: 'shortcuts', label: 'Keyboard Shortcuts' },
  { key: 'account', label: 'Account' },
  { key: 'updates', label: 'Updates' },
];

const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  compilation: 'Compilation complete / failed',
  system: 'Background tasks',
  project: 'Project changes',
  updates: 'App updates',
  errors: 'Errors',
};

interface Props {
  onClose: () => void;
  defaultMode: CompileMode;
  onDefaultModeChange: (mode: CompileMode) => void;
  maxRounds: number;
  onMaxRoundsChange: (n: number) => void;
  appearance: AppearanceSettings;
  onAppearanceChange: (next: AppearanceSettings) => void;
  notificationSettings: NotificationSettings;
  onNotificationSettingsChange: (next: NotificationSettings) => void;
  onClearLocalData: () => Promise<void>;
  startWorkspace: string;
  onStartWorkspaceChange: (w: string) => void;
  confirmDestructive: boolean;
  onConfirmDestructiveChange: (v: boolean) => void;
}

/** Full multi-page settings app (per the desktop UI/UX spec) — persisted via
 * the `settings` key/value SQLite table. Only real, wired settings are
 * shown; sections from the spec with no honest backing implementation
 * (AI/Connections — this product never calls an AI API; full shortcut
 * remapping) are either omitted or explicitly marked as reference-only. */
export function SettingsPanel({
  onClose,
  defaultMode,
  onDefaultModeChange,
  maxRounds,
  onMaxRoundsChange,
  appearance,
  onAppearanceChange,
  notificationSettings,
  onNotificationSettingsChange,
  onClearLocalData,
  startWorkspace,
  onStartWorkspaceChange,
  confirmDestructive,
  onConfirmDestructiveChange,
}: Props) {
  const [version, setVersion] = useState('');
  const [category, setCategory] = useState<Category>('general');
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [clearing, setClearing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [entitlementError, setEntitlementError] = useState<string | null>(null);
  const [checkingOutTier, setCheckingOutTier] = useState<PaidTier | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => setVersion('unknown'));
    supabase.auth
      .getUser()
      .then(({ data }) => setUserEmail(data.user?.email ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (category === 'privacy') {
      getStorageInfo()
        .then(setStorage)
        .catch(() => setStorage(null));
    }
    if (category === 'account') {
      setEntitlementError(null);
      getEntitlement()
        .then(setEntitlement)
        .catch((e) => setEntitlementError(e instanceof Error ? e.message : String(e)));
      getSetting(LAST_SYNC_KEY).then(setLastSync).catch(() => {});
    }
  }, [category]);

  async function handleUpgrade(tier: PaidTier) {
    setCheckingOutTier(tier);
    try {
      const result = await startCheckout(tier);
      try {
        await openUrl(result.redirectUrl);
      } catch {
        window.open(result.redirectUrl, '_blank');
      }
      if (result.devMode) {
        // Dev-mode checkout activates instantly server-side — re-read
        // entitlement now rather than waiting for the user to come back.
        const fresh = await getEntitlement();
        setEntitlement(fresh);
      }
    } catch (e) {
      setEntitlementError(e instanceof Error ? e.message : String(e));
    } finally {
      setCheckingOutTier(null);
    }
  }

  async function handleSyncNow() {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const summary = await runSync();
      setLastSync(summary.serverTime);
      setSyncStatus(`Synced — ${summary.pushed} pushed, ${summary.pulled} pulled.`);
    } catch (e) {
      setSyncStatus('Sync failed: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSyncing(false);
    }
  }

  async function handleModeChange(mode: CompileMode) {
    onDefaultModeChange(mode);
    try {
      await setSetting(DEFAULT_MODE_KEY, mode);
    } catch {
      // best-effort persistence; UI state already reflects the choice
    }
  }

  async function handleMaxRoundsChange(n: number) {
    const clamped = Math.min(5, Math.max(1, n));
    onMaxRoundsChange(clamped);
    try {
      await setSetting(MAX_ROUNDS_KEY, String(clamped));
    } catch {
      // best-effort persistence
    }
  }

  async function handleOpenRepo() {
    try {
      await openUrl(REPO_URL);
    } catch {
      window.open(REPO_URL, '_blank');
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
    } catch {
      // proceed regardless — still clear the local grace-period cache below
    }
    try {
      await setSetting(AUTH_LAST_VERIFIED_KEY, '');
    } catch {
      // best-effort
    }
    setSigningOut(false);
  }

  async function handleClearLocalData() {
    if (!window.confirm('This permanently deletes every prompt, compile, project, and template stored locally. This cannot be undone. Continue?')) {
      return;
    }
    setClearing(true);
    try {
      await onClearLocalData();
      const info = await getStorageInfo();
      setStorage(info);
    } finally {
      setClearing(false);
    }
  }

  function updateAppearance(patch: Partial<AppearanceSettings>) {
    onAppearanceChange({ ...appearance, ...patch });
  }

  function updateNotification(cat: NotificationCategory, value: boolean) {
    onNotificationSettingsChange({ ...notificationSettings, [cat]: value });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 680,
          maxWidth: '92vw',
          height: 560,
          maxHeight: '85vh',
          background: 'var(--sv-ivory)',
          border: '1px solid var(--sv-hairline-strong)',
          display: 'grid',
          gridTemplateColumns: '160px 1fr',
        }}
      >
        <div style={{ borderRight: '1px solid var(--sv-hairline)', padding: 'var(--sv-space-3)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
            Settings
          </div>
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              className={category === c.key ? 'sv-primary' : ''}
              onClick={() => setCategory(c.key)}
              style={{ textAlign: 'left', fontSize: 11, padding: 'var(--sv-space-2)', justifyContent: 'flex-start' }}
            >
              {c.label}
            </button>
          ))}
          <button type="button" onClick={onClose} style={{ marginTop: 'auto', fontSize: 11 }}>
            Close
          </button>
        </div>

        <div className="sv-scrollpane" style={{ overflowY: 'auto', padding: 'var(--sv-space-5)' }}>
          {category === 'general' && (
            <div>
              <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
                Startup workspace
              </div>
              <select value={startWorkspace} onChange={(e) => onStartWorkspaceChange(e.target.value)} style={{ fontSize: 12, padding: 'var(--sv-space-2)' }}>
                <option value="home">Home</option>
                <option value="studio">Prompt Studio</option>
                <option value="projects">Projects</option>
                <option value="templates">Templates</option>
                <option value="library">Library</option>
                <option value="history">History</option>
              </select>
              <div style={{ fontSize: 10, color: 'var(--sv-ink-soft)', marginTop: 4, marginBottom: 'var(--sv-space-4)' }}>
                Which workspace opens when Scaffold launches.
              </div>

              <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
                Confirm destructive actions
              </div>
              <label style={{ display: 'flex', gap: 6, fontSize: 12, alignItems: 'center' }}>
                <input type="checkbox" checked={confirmDestructive} onChange={(e) => onConfirmDestructiveChange(e.target.checked)} />
                Ask before deleting prompts, projects, or templates
              </label>

              <div style={{ marginTop: 'var(--sv-space-5)' }}>
                <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
                  Autosave
                </div>
                <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>
                  Always on — in-progress prompt text is saved automatically as you type, per prompt. Nothing to configure.
                </div>
              </div>
            </div>
          )}

          {category === 'appearance' && (
            <div>
              <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
                Theme
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--sv-space-4)' }}>
                {(['dark', 'light', 'system'] as ThemeChoice[]).map((t) => (
                  <button key={t} type="button" className={appearance.theme === t ? 'sv-primary' : ''} onClick={() => updateAppearance({ theme: t })}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
                Accent color
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--sv-space-4)' }}>
                {(['burgundy', 'teal'] as AccentChoice[]).map((a) => (
                  <button key={a} type="button" className={appearance.accent === a ? 'sv-primary' : ''} onClick={() => updateAppearance({ accent: a })}>
                    {a[0].toUpperCase() + a.slice(1)}
                  </button>
                ))}
              </div>

              <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
                UI density
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--sv-space-4)' }}>
                {(['comfortable', 'compact'] as DensityChoice[]).map((d) => (
                  <button key={d} type="button" className={appearance.density === d ? 'sv-primary' : ''} onClick={() => updateAppearance({ density: d })}>
                    {d[0].toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>

              <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
                Font size ({Math.round(appearance.fontScale * 100)}%)
              </div>
              <input
                type="range"
                min={0.85}
                max={1.3}
                step={0.05}
                value={appearance.fontScale}
                onChange={(e) => updateAppearance({ fontScale: Number(e.target.value) })}
                style={{ width: 200, marginBottom: 'var(--sv-space-4)' }}
              />

              <div>
                <label style={{ display: 'flex', gap: 6, fontSize: 12, alignItems: 'center' }}>
                  <input type="checkbox" checked={appearance.reduceMotion} onChange={(e) => updateAppearance({ reduceMotion: e.target.checked })} />
                  Reduce motion (skips the compile stepper's step-by-step animation)
                </label>
              </div>
            </div>
          )}

          {category === 'compiler' && (
            <div>
              <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
                Default compile mode
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--sv-space-5)' }}>
                {(['architect', 'quick', 'master'] as CompileMode[]).map((m) => (
                  <button key={m} type="button" className={defaultMode === m ? 'sv-primary' : ''} onClick={() => handleModeChange(m)}>
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
                MASTER mode — max deliberation rounds
              </div>
              <input
                type="number"
                min={1}
                max={5}
                value={maxRounds}
                onChange={(e) => handleMaxRoundsChange(Number(e.target.value) || DEFAULT_MAX_ROUNDS)}
                style={{ width: 80 }}
              />
              <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)', marginTop: 4 }}>
                Bounds: 1–5. Passed through to runMasterPipeline's maxRounds option.
              </div>
            </div>
          )}

          {category === 'notifications' && (
            <div>
              <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
                Notify me about
              </div>
              {(Object.keys(NOTIFICATION_CATEGORY_LABELS) as NotificationCategory[]).map((cat) => (
                <label key={cat} style={{ display: 'flex', gap: 6, fontSize: 12, alignItems: 'center', marginBottom: 'var(--sv-space-2)' }}>
                  <input type="checkbox" checked={notificationSettings[cat]} onChange={(e) => updateNotification(cat, e.target.checked)} />
                  {NOTIFICATION_CATEGORY_LABELS[cat]}
                </label>
              ))}
              <div style={{ fontSize: 10, color: 'var(--sv-ink-soft)', marginTop: 'var(--sv-space-2)' }}>
                Unchecked categories are never added to the notification bell — not just hidden.
              </div>
            </div>
          )}

          {category === 'privacy' && (
            <div>
              <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
                Local data
              </div>
              <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)', marginBottom: 'var(--sv-space-4)' }}>
                Scaffold runs entirely on your machine. Prompts, compiles, projects, and templates are stored in a local SQLite
                database only — nothing is uploaded except your own explicit export actions. No telemetry, crash reporting, or
                usage analytics are collected by this app.
              </div>

              <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
                Storage
              </div>
              {storage ? (
                <div style={{ fontSize: 12, marginBottom: 'var(--sv-space-4)' }}>
                  <div>Database size: {(storage.db_size_bytes / 1024).toFixed(1)} KB</div>
                  <div>{storage.prompt_count} prompts · {storage.compile_count} compiles</div>
                  <div>{storage.project_count} projects · {storage.template_count} templates</div>
                </div>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)', marginBottom: 'var(--sv-space-4)' }}>Loading…</div>
              )}

              <button type="button" onClick={handleClearLocalData} disabled={clearing}>
                {clearing ? 'Clearing…' : 'Clear all local data'}
              </button>
            </div>
          )}

          {category === 'shortcuts' && (
            <div>
              <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
                Keyboard shortcuts
              </div>
              <div style={{ fontSize: 10, color: 'var(--sv-ink-soft)', marginBottom: 'var(--sv-space-3)' }}>
                Reference only — full remapping isn't built yet, shown honestly rather than as a fake customization UI.
              </div>
              {[
                ['Ctrl/Cmd + Enter', 'Compile'],
                ['Ctrl/Cmd + Shift + N', 'New prompt'],
                ['Ctrl/Cmd + K', 'Command palette'],
                ['Escape', 'Cancel a running compile'],
              ].map(([keys, action]) => (
                <div key={keys} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: 'var(--sv-space-2) 0', borderBottom: '1px solid var(--sv-hairline)' }}>
                  <span>{action}</span>
                  <span style={{ fontFamily: 'var(--sv-font-mono)', color: 'var(--sv-ink-soft)' }}>{keys}</span>
                </div>
              ))}
            </div>
          )}

          {category === 'account' && (
            <div>
              <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
                Profile
              </div>
              <div style={{ fontSize: 13, marginBottom: 'var(--sv-space-4)' }}>{userEmail ?? 'Not signed in'}</div>
              <button type="button" onClick={handleSignOut} disabled={signingOut}>
                {signingOut ? 'Signing Out…' : 'Sign Out'}
              </button>

              <hr className="sv-hairline" style={{ margin: 'var(--sv-space-4) 0' }} />

              <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
                Plan
              </div>
              {entitlementError && <div style={{ fontSize: 11, color: 'var(--sv-burgundy)', marginBottom: 'var(--sv-space-3)' }}>{entitlementError}</div>}
              {!entitlementError && !entitlement && <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>Loading…</div>}
              {entitlement && (
                <div style={{ fontSize: 13, marginBottom: 'var(--sv-space-3)' }}>
                  <strong>{entitlement.tier}</strong>
                  {entitlement.tier !== 'Free' && (
                    <span style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>
                      {' '}
                      · renews/expires {new Date(entitlement.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--sv-space-4)' }}>
                {(['Plus', 'Pro', 'Max'] as PaidTier[]).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    className={entitlement?.tier === tier ? 'sv-primary' : ''}
                    onClick={() => handleUpgrade(tier)}
                    disabled={checkingOutTier !== null}
                  >
                    {checkingOutTier === tier ? 'Opening checkout…' : `Upgrade to ${tier}`}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 10, color: 'var(--sv-ink-soft)', marginBottom: 'var(--sv-space-4)' }}>
                Opens checkout in your browser. If no live payment is configured yet, the order activates instantly for testing —
                nothing is ever charged from inside the app itself.
              </div>

              <hr className="sv-hairline" style={{ margin: 'var(--sv-space-4) 0' }} />

              <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
                Cloud sync
              </div>
              <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)', marginBottom: 'var(--sv-space-2)' }}>
                {lastSync ? `Last synced ${new Date(lastSync).toLocaleString()}` : 'Never synced.'}
              </div>
              <button type="button" onClick={handleSyncNow} disabled={syncing}>
                {syncing ? 'Syncing…' : 'Sync Now'}
              </button>
              {syncStatus && <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)', marginTop: 'var(--sv-space-2)' }}>{syncStatus}</div>}
              <div style={{ fontSize: 10, color: 'var(--sv-ink-soft)', marginTop: 'var(--sv-space-2)' }}>
                Pushes your prompts, projects, and templates to your account and pulls anything newer from other devices.
                Deleting something locally doesn't yet delete it on other devices — delete it on each device separately for now.
              </div>
            </div>
          )}

          {category === 'updates' && (
            <div>
              <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
                Updates
              </div>
              <UpdateChecker />
              <hr className="sv-hairline" style={{ margin: 'var(--sv-space-4) 0' }} />
              <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
                About
              </div>
              <div style={{ fontFamily: 'var(--sv-font-head)', fontSize: 16, marginBottom: 4 }}>Scaffold</div>
              <div style={{ fontSize: 12, color: 'var(--sv-ink-soft)', marginBottom: 4 }}>Version {version || '…'}</div>
              <div style={{ fontSize: 12, color: 'var(--sv-ink-soft)', marginBottom: 8 }}>A SINVAUX product</div>
              <button type="button" onClick={handleOpenRepo}>
                View on GitHub
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
