import { useEffect, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { openUrl } from '@tauri-apps/plugin-opener';
import { setSetting } from '../lib/api';
import { supabase } from '../lib/supabase';
import { AUTH_LAST_VERIFIED_KEY } from './AuthGate';
import { UpdateChecker } from './UpdateChecker';

export type CompileMode = 'architect' | 'quick' | 'master';

export const DEFAULT_MODE_KEY = 'default_mode';
export const MAX_ROUNDS_KEY = 'master_max_rounds';
export const DEFAULT_MAX_ROUNDS = 2;
const REPO_URL = 'https://github.com/YVNGVOU/scaffold-app';

interface Props {
  onClose: () => void;
  defaultMode: CompileMode;
  onDefaultModeChange: (mode: CompileMode) => void;
  maxRounds: number;
  onMaxRoundsChange: (n: number) => void;
}

/** Settings modal (TASK-018 sub-feature A) — persisted via the `settings`
 * key/value SQLite table (`get_setting`/`set_setting` Tauri commands),
 * following the same rusqlite + custom-commands pattern as `prompts`/`compiles`. */
export function SettingsPanel({ onClose, defaultMode, onDefaultModeChange, maxRounds, onMaxRoundsChange }: Props) {
  const [version, setVersion] = useState('');

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => setVersion('unknown'));
  }, []);

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

  const [signingOut, setSigningOut] = useState(false);

  // TASK-019 requirement 6: clears both the Supabase session and the
  // locally-cached auth_last_verified_at (so the 7-day offline grace period
  // can't be used to bypass an explicit sign-out) — AuthGate's
  // onAuthStateChange listener picks up the SIGNED_OUT event and returns the
  // user to LoginScreen.
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
          width: 480,
          maxWidth: '90vw',
          maxHeight: '85vh',
          overflowY: 'auto',
          background: 'var(--sv-ivory)',
          border: '1px solid var(--sv-hairline-strong)',
          padding: 'var(--sv-space-5)',
        }}
        className="sv-scrollpane"
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--sv-space-4)' }}>
          <h2 style={{ fontSize: 18 }}>Settings</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div style={{ marginBottom: 'var(--sv-space-5)' }}>
          <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
            Default compile mode
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['architect', 'quick', 'master'] as CompileMode[]).map((m) => (
              <button
                key={m}
                type="button"
                className={defaultMode === m ? 'sv-primary' : ''}
                onClick={() => handleModeChange(m)}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 'var(--sv-space-5)' }}>
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

        <hr className="sv-hairline" style={{ margin: 'var(--sv-space-4) 0' }} />

        <div style={{ marginBottom: 'var(--sv-space-4)' }}>
          <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
            Updates
          </div>
          <UpdateChecker />
        </div>

        <hr className="sv-hairline" style={{ margin: 'var(--sv-space-4) 0' }} />

        <div>
          <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
            About
          </div>
          <div style={{ fontFamily: 'var(--sv-font-head)', fontSize: 16, marginBottom: 4 }}>Scaffold</div>
          <div style={{ fontSize: 12, color: 'var(--sv-ink-soft)', marginBottom: 4 }}>Version {version || '…'}</div>
          <div style={{ fontSize: 12, color: 'var(--sv-ink-soft)', marginBottom: 8 }}>A SINVAUX product</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button type="button" onClick={handleOpenRepo}>
              View on GitHub
            </button>
            <button type="button" onClick={handleSignOut} disabled={signingOut}>
              {signingOut ? 'Signing Out…' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
