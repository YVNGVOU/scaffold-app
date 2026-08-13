// TASK-026: a one-time, dismissible first-run explanatory panel. Shown once
// (tracked via the existing get_setting/set_setting settings table from
// TASK-018 — no new table/command), explaining what ARCHITECT/QUICK/MASTER
// modes mean and the basic input-to-output flow. Deliberately NOT a
// multi-step interactive tour — a single panel, a single dismiss action.

export const ONBOARDING_SEEN_KEY = 'onboarding_seen';

interface OnboardingPanelProps {
  onDismiss: () => void;
}

export function OnboardingPanel({ onDismiss }: OnboardingPanelProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(22, 20, 15, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: 480,
          background: 'var(--sv-ivory)',
          border: '1px solid var(--sv-hairline-strong)',
          padding: 'var(--sv-space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sv-space-4)',
        }}
      >
        <div className="sv-label">Welcome</div>
        <h2 style={{ fontSize: 20 }}>Scaffold, in brief</h2>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--sv-ink)' }}>
          The left rail switches between workspaces — <strong>Home</strong> for recents and
          quick actions, <strong>Prompt Studio</strong> to compose and compile, <strong>Projects</strong>{' '}
          to group related prompts, <strong>Templates</strong> and <strong>Library</strong> for
          reusable starting points, and <strong>History</strong> for everything you've compiled.
          Press <strong>⌘/Ctrl+K</strong> anywhere to jump straight to a command or prompt.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--sv-ink)' }}>
          In Prompt Studio: describe what you want, plainly — Scaffold turns it into a
          structured, verifiable prompt. Pick a mode: <strong>ARCHITECT</strong> runs the full
          multi-specialist pipeline for a thorough compile; <strong>QUICK</strong> is a fast
          single-pass compile for simple requests; <strong>MASTER</strong> runs a deliberation
          loop across specialists to resolve conflicts before producing a final output. Compile,
          then review the structured output, its Architecture tree, and any unresolved questions
          in the decisions panel.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="sv-primary" onClick={onDismiss}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
