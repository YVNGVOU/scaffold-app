import { useEffect, useMemo, useState } from 'react';
import { deleteTemplate, listTemplates, setTemplateFavorite, type Template } from '../../lib/api';

const CATEGORIES = ['general', 'coding', 'research', 'writing', 'analysis', 'business', 'design', 'automation', 'game development', 'ai agents', 'debugging', 'planning'];

interface TemplatesWorkspaceProps {
  onUseTemplate: (body: string) => void;
  refreshKey: number;
}

/** Real template CRUD backed by the `templates` table. "Save as Template" is
 * fired from Prompt Studio (SettingsPanel-adjacent flow); this workspace is
 * the browse/apply/manage side. */
export function TemplatesWorkspace({ onUseTemplate, refreshKey }: TemplatesWorkspaceProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      setTemplates(await listTemplates());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [refreshKey]);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (category !== 'all' && t.category !== category) return false;
      if (query.trim() && !t.title.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [templates, category, query]);

  return (
    <div className="sv-scrollpane" style={{ flex: 1, minHeight: 0, padding: 'var(--sv-space-5)' }}>
      <div className="sv-label" style={{ fontSize: 18, marginBottom: 'var(--sv-space-3)' }}>
        Templates
      </div>
      <div style={{ display: 'flex', gap: 'var(--sv-space-2)', marginBottom: 'var(--sv-space-4)', flexWrap: 'wrap' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates…"
          style={{ fontSize: 12, padding: 'var(--sv-space-2)', minWidth: 200 }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ fontSize: 11, padding: 'var(--sv-space-2)' }}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading && <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>Loading…</div>}
      {!loading && filtered.length === 0 && (
        <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>
          No templates yet. Compile a prompt in Prompt Studio, then use "Save as Template" from the output panel.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--sv-space-3)' }}>
        {filtered.map((t) => (
          <div key={t.id} style={{ border: '1px solid var(--sv-hairline)', padding: 'var(--sv-space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sv-space-2)' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{t.title}</div>
            <div className="sv-label" style={{ fontSize: 9 }}>
              {t.category}
            </div>
            <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)', maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t.body.slice(0, 140)}
              {t.body.length > 140 ? '…' : ''}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="sv-primary" type="button" onClick={() => onUseTemplate(t.body)} style={{ fontSize: 10 }}>
                Use
              </button>
              <button
                type="button"
                onClick={async () => {
                  await setTemplateFavorite(t.id, !t.is_favorite);
                  await refresh();
                }}
                style={{ fontSize: 10 }}
              >
                {t.is_favorite ? '★ Favorited' : '☆ Favorite'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteTemplate(t.id);
                  await refresh();
                }}
                style={{ fontSize: 10 }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
