import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getSetting, setSetting } from '../lib/api';
import { LoginScreen } from './LoginScreen';

// TASK-019: settings key reusing the existing get_setting/set_setting Tauri
// commands + `settings` SQLite table from TASK-018 — no second persistence
// mechanism is introduced for the offline grace period.
export const AUTH_LAST_VERIFIED_KEY = 'auth_last_verified_at';
const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, locked decision

type GateState =
  | { status: 'checking' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; session: Session; offline: boolean };

async function recordVerified() {
  try {
    await setSetting(AUTH_LAST_VERIFIED_KEY, String(Date.now()));
  } catch {
    // best-effort — offline grace just won't extend past whatever was last recorded
  }
}

async function withinGracePeriod(): Promise<boolean> {
  try {
    const raw = await getSetting(AUTH_LAST_VERIFIED_KEY);
    if (!raw) return false;
    const last = Number(raw);
    if (!Number.isFinite(last)) return false;
    return Date.now() - last < GRACE_PERIOD_MS;
  } catch {
    return false;
  }
}

// Heuristic: distinguish "server explicitly said this session/token is
// invalid" from "couldn't reach the server at all" so the 7-day offline
// grace period only applies to the latter, per TASK-019 requirement 5.
function looksLikeExplicitInvalidSession(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const anyErr = err as { status?: number; name?: string; message?: string };
  if (anyErr.status === 401 || anyErr.status === 403) return true;
  const msg = (anyErr.message || '').toLowerCase();
  return (
    msg.includes('invalid') ||
    msg.includes('expired') ||
    msg.includes('jwt') ||
    msg.includes('not authenticated') ||
    msg.includes('session_not_found')
  );
}

/**
 * Auth gate wrapping the existing 4-pane app (TASK-019). Renders children
 * only once a Supabase session is confirmed valid (or accepted under the
 * 7-day offline grace period); otherwise renders LoginScreen.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>({ status: 'checking' });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    checkSession();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;
      if (event === 'SIGNED_OUT') {
        setState({ status: 'unauthenticated' });
      } else if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        recordVerified();
        setState({ status: 'authenticated', session, offline: false });
      }
    });

    return () => {
      mountedRef.current = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkSession() {
    try {
      const { data: localData } = await supabase.auth.getSession();
      const localSession = localData.session;

      if (!localSession) {
        if (mountedRef.current) setState({ status: 'unauthenticated' });
        return;
      }

      // Verify against the server (network call) so a stale/invalid local
      // token isn't trusted indefinitely. getUser() re-validates the JWT
      // server-side, distinct from getSession()'s local-storage-only read.
      const { data: userData, error } = await supabase.auth.getUser();

      if (!error && userData.user) {
        await recordVerified();
        if (mountedRef.current) setState({ status: 'authenticated', session: localSession, offline: false });
        return;
      }

      if (error && looksLikeExplicitInvalidSession(error)) {
        if (mountedRef.current) setState({ status: 'unauthenticated' });
        return;
      }

      // Ambiguous/network-looking failure — fall back to the 7-day offline
      // grace period using the last known-good verification timestamp.
      const withinGrace = await withinGracePeriod();
      if (withinGrace) {
        if (mountedRef.current) setState({ status: 'authenticated', session: localSession, offline: true });
      } else {
        if (mountedRef.current) setState({ status: 'unauthenticated' });
      }
    } catch {
      // getSession/getUser threw outright (e.g. no network at all) — same
      // offline-grace fallback path.
      const withinGrace = await withinGracePeriod();
      if (!mountedRef.current) return;
      if (withinGrace) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setState({ status: 'authenticated', session: data.session, offline: true });
          return;
        }
      }
      setState({ status: 'unauthenticated' });
    }
  }

  if (state.status === 'checking') {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--sv-ink-soft)',
          fontSize: 12,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Checking account…
      </div>
    );
  }

  if (state.status === 'unauthenticated') {
    return <LoginScreen onAuthenticated={() => checkSession()} />;
  }

  return (
    <>
      {state.offline && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 200,
            background: 'var(--sv-alert)',
            color: 'var(--sv-ivory)',
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textAlign: 'center',
            padding: '3px 0',
            pointerEvents: 'none',
          }}
        >
          Couldn't re-verify account — working offline
        </div>
      )}
      {children}
    </>
  );
}
