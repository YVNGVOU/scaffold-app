import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ErrorNote } from './ErrorNote';
import type { FriendlyError } from '../lib/friendlyError';

type Mode = 'sign-in' | 'sign-up';
type ViewState = { kind: 'form' } | { kind: 'check-email'; email: string } | { kind: 'magic-link-sent'; email: string };

interface Props {
  onAuthenticated: () => void;
}

/** Login/signup screen gating the app (TASK-019). Dark SINVAUX/Scaffold
 * visual language — --sv-* tokens only, no rounded corners, no new UI
 * component libraries (plain form elements styled by theme.css, same as
 * every other screen in this app). */
export function LoginScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<FriendlyError | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<ViewState>({ kind: 'form' });

  // TASK-027: known cases still map to a short friendly sentence; anything
  // unrecognized falls back to a generic sentence with the raw SDK message
  // preserved for the "Details" expand, rather than showing the raw SDK
  // message directly as the primary error line.
  function friendlyError(err: unknown): FriendlyError {
    const raw =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message?: string }).message ?? String(err))
        : String(err);
    if (/invalid login credentials/i.test(raw)) return { summary: 'Wrong email or password.', raw };
    if (/email not confirmed/i.test(raw))
      return { summary: 'Please confirm your email before signing in — check your inbox.', raw };
    if (/network|fetch|failed to fetch/i.test(raw))
      return { summary: "Couldn't reach the server. Check your connection and try again.", raw };
    return { summary: 'Something went wrong. Please try again.', raw };
  }

  async function handleSignIn() {
    setError(null);
    if (!email.trim() || !password) {
      setError({ summary: 'Enter your email and password.', raw: 'Enter your email and password.' });
      return;
    }
    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;
      onAuthenticated();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp() {
    setError(null);
    if (!email.trim() || !password) {
      setError({ summary: 'Enter your email and password.', raw: 'Enter your email and password.' });
      return;
    }
    if (password.length < 6) {
      setError({ summary: 'Password must be at least 6 characters.', raw: 'Password must be at least 6 characters.' });
      return;
    }
    setBusy(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });
      if (signUpError) throw signUpError;
      // If Supabase's project requires email confirmation, signUp() succeeds
      // but returns no active session yet — show the "check your email"
      // state. If confirmation is off, a session comes back immediately and
      // the caller (AuthGate) picks it up on the next auth-state-change /
      // onAuthenticated call.
      if (!data.session) {
        setView({ kind: 'check-email', email: email.trim() });
      } else {
        onAuthenticated();
      }
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleMagicLink() {
    setError(null);
    if (!email.trim()) {
      setError({ summary: 'Enter your email first.', raw: 'Enter your email first.' });
      return;
    }
    setBusy(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({ email: email.trim() });
      if (otpError) throw otpError;
      setView({ kind: 'magic-link-sent', email: email.trim() });
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'sign-in') handleSignIn();
    else handleSignUp();
  }

  const shellStyle: React.CSSProperties = {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--sv-ivory)',
  };

  const cardStyle: React.CSSProperties = {
    width: 380,
    maxWidth: '90vw',
    border: '1px solid var(--sv-hairline-strong)',
    padding: 'var(--sv-space-6)',
    background: 'var(--sv-ivory-dim)',
  };

  if (view.kind === 'check-email') {
    return (
      <div style={shellStyle}>
        <div style={cardStyle}>
          <h1 style={{ fontSize: 20, marginBottom: 'var(--sv-space-4)' }}>Check your email</h1>
          <p style={{ fontSize: 13, color: 'var(--sv-ink-soft)', lineHeight: 1.6 }}>
            We sent a confirmation link to <strong style={{ color: 'var(--sv-ink)' }}>{view.email}</strong>. Confirm
            your address, then come back and sign in.
          </p>
          <button
            type="button"
            style={{ marginTop: 'var(--sv-space-5)' }}
            onClick={() => {
              setView({ kind: 'form' });
              setMode('sign-in');
            }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  if (view.kind === 'magic-link-sent') {
    return (
      <div style={shellStyle}>
        <div style={cardStyle}>
          <h1 style={{ fontSize: 20, marginBottom: 'var(--sv-space-4)' }}>Check your email</h1>
          <p style={{ fontSize: 13, color: 'var(--sv-ink-soft)', lineHeight: 1.6 }}>
            We sent a sign-in link to <strong style={{ color: 'var(--sv-ink)' }}>{view.email}</strong>. Open it on
            this device to finish signing in.
          </p>
          <button type="button" style={{ marginTop: 'var(--sv-space-5)' }} onClick={() => setView({ kind: 'form' })}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <form style={cardStyle} onSubmit={handleSubmit}>
        <div style={{ fontFamily: 'var(--sv-font-head)', fontSize: 22, marginBottom: 4 }}>Scaffold</div>
        <div className="sv-label" style={{ marginBottom: 'var(--sv-space-5)' }}>
          A SINVAUX product · sign in to continue
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--sv-space-5)' }}>
          <button
            type="button"
            className={mode === 'sign-in' ? 'sv-primary' : ''}
            style={{ flex: 1 }}
            onClick={() => {
              setMode('sign-in');
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={mode === 'sign-up' ? 'sv-primary' : ''}
            style={{ flex: 1 }}
            onClick={() => {
              setMode('sign-up');
              setError(null);
            }}
          >
            Sign Up
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sv-space-3)' }}>
          <div>
            <div className="sv-label" style={{ marginBottom: 4 }}>
              Email
            </div>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%' }}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <div className="sv-label" style={{ marginBottom: 4 }}>
              Password
            </div>
            <input
              type="password"
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%' }}
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 'var(--sv-space-3)' }}>
            <ErrorNote error={error} />
          </div>
        )}

        <button type="submit" className="sv-primary" style={{ width: '100%', marginTop: 'var(--sv-space-4)' }} disabled={busy}>
          {busy ? 'Working…' : mode === 'sign-in' ? 'Sign In' : 'Sign Up'}
        </button>

        <hr className="sv-hairline" style={{ margin: 'var(--sv-space-5) 0' }} />

        <button type="button" onClick={handleMagicLink} disabled={busy} style={{ width: '100%' }}>
          Email me a sign-in link
        </button>
      </form>
    </div>
  );
}
