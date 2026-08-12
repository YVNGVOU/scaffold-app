import { useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

type Status = { kind: 'idle' } | { kind: 'checking' } | { kind: 'message'; text: string };

export function UpdateChecker() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function handleCheck() {
    setStatus({ kind: 'checking' });
    try {
      const update = await check();
      if (update?.available) {
        const shouldInstall = window.confirm(
          `Update available: v${update.version} — Restart to install?`,
        );
        if (shouldInstall) {
          setStatus({ kind: 'message', text: `Downloading v${update.version}...` });
          await update.downloadAndInstall();
          try {
            await relaunch();
          } catch {
            setStatus({ kind: 'message', text: 'Update installed. Please restart Scaffold.' });
          }
        } else {
          setStatus({ kind: 'message', text: `Update v${update.version} available (not installed).` });
        }
      } else {
        setStatus({ kind: 'message', text: 'You are up to date.' });
      }
    } catch (err) {
      setStatus({ kind: 'message', text: 'Update check failed (offline or no release found).' });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <button
        onClick={handleCheck}
        disabled={status.kind === 'checking'}
        style={{
          width: '100%',
          fontSize: 10,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          padding: 'var(--sv-space-2) var(--sv-space-3)',
        }}
      >
        {status.kind === 'checking' ? 'Checking…' : 'Check for Updates'}
      </button>
      {status.kind === 'message' && (
        <div style={{ fontSize: 10, color: 'var(--sv-ink-soft)', padding: '0 var(--sv-space-1)' }}>
          {status.text}
        </div>
      )}
    </div>
  );
}
