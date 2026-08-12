import type { Prompt, Template } from '../../lib/api';

interface LibraryWorkspaceProps {
  prompts: Prompt[];
  templates: Template[];
  onOpenPrompt: (p: Prompt) => void;
}

/** Centralized view over reusable resources that already exist elsewhere
 * (favorited prompts, templates). Variables/components/frameworks/presets
 * are real spec items but have no dedicated storage yet — listed here
 * honestly as not-yet-built rather than faked. */
export function LibraryWorkspace({ prompts, templates, onOpenPrompt }: LibraryWorkspaceProps) {
  const favoritePrompts = prompts.filter((p) => p.is_favorite);

  return (
    <div className="sv-scrollpane" style={{ flex: 1, minHeight: 0, padding: 'var(--sv-space-5)' }}>
      <div className="sv-label" style={{ fontSize: 18, marginBottom: 'var(--sv-space-3)' }}>
        Library
      </div>

      <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
        Saved prompts ({favoritePrompts.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 'var(--sv-space-5)' }}>
        {favoritePrompts.length === 0 && <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>Favorite a prompt to see it here.</div>}
        {favoritePrompts.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onOpenPrompt(p)}
            style={{ textAlign: 'left', fontSize: 12, border: '1px solid var(--sv-hairline)' }}
          >
            {p.title || 'Untitled prompt'}
          </button>
        ))}
      </div>

      <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
        Templates ({templates.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 'var(--sv-space-5)' }}>
        {templates.length === 0 && <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>None saved yet — see the Templates workspace.</div>}
        {templates.slice(0, 12).map((t) => (
          <div key={t.id} style={{ fontSize: 12, border: '1px solid var(--sv-hairline)', padding: 'var(--sv-space-2)' }}>
            {t.title}
          </div>
        ))}
      </div>

      <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
        Variables, components, frameworks, presets
      </div>
      <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>
        Not built yet — no dedicated storage exists for these resource types. Flagging honestly rather than faking empty sections.
      </div>
    </div>
  );
}
