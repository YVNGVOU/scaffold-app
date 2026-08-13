import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import type { CompiledPrompt } from '@lucid/schema';

interface ImportPromptProps {
  /** New raw text to load into the Prompt Studio input (from .txt/.md, or
   * the userRequirements text of an imported CompiledPrompt .json). */
  onImportRaw: (text: string) => void;
  /** A full CompiledPrompt was imported directly (Scaffold's own .json
   * export or a `compiled_json` prompt package) — skip re-compiling and
   * load it as-is. */
  onImportCompiled: (compiled: CompiledPrompt) => void;
  onClose: () => void;
}

function looksLikeCompiledPrompt(v: unknown): v is CompiledPrompt {
  return !!v && typeof v === 'object' && 'domain' in v && 'userRequirements' in v && Array.isArray((v as CompiledPrompt).userRequirements);
}

/** Real file import — TXT/Markdown becomes new raw input; a Scaffold-exported
 * .json (either a bare CompiledPrompt or a `{compiled: CompiledPrompt}`
 * project-folder-style file) is loaded directly as a compiled result. No
 * other formats are claimed — PDF/DOCX import isn't built. */
export function ImportPrompt({ onImportRaw, onImportCompiled, onClose }: ImportPromptProps) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handlePick() {
    setError(null);
    setBusy(true);
    try {
      const path = await open({
        multiple: false,
        filters: [
          { name: 'Prompt files', extensions: ['txt', 'md', 'markdown', 'json'] },
        ],
      });
      if (!path || Array.isArray(path)) return;
      const content = await readTextFile(path);

      if (path.toLowerCase().endsWith('.json')) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(content);
        } catch {
          setError('That .json file is not valid JSON.');
          return;
        }
        const candidate =
          looksLikeCompiledPrompt(parsed)
            ? parsed
            : parsed && typeof parsed === 'object' && looksLikeCompiledPrompt((parsed as { compiled?: unknown }).compiled)
              ? (parsed as { compiled: CompiledPrompt }).compiled
              : null;
        if (!candidate) {
          setError("That .json file doesn't look like a Scaffold-compiled prompt — expected a CompiledPrompt shape.");
          return;
        }
        onImportCompiled(candidate);
        onClose();
        return;
      }

      onImportRaw(content);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 420, maxWidth: '90vw', background: 'var(--sv-ivory)', border: '1px solid var(--sv-hairline-strong)', padding: 'var(--sv-space-5)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--sv-space-4)' }}>
          <h2 style={{ fontSize: 18 }}>Import</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--sv-ink-soft)', marginBottom: 'var(--sv-space-4)' }}>
          Import a .txt/.md file as new raw input to compile, or a Scaffold-exported .json as an already-compiled prompt.
        </div>
        <button className="sv-primary" type="button" onClick={handlePick} disabled={busy}>
          {busy ? 'Reading…' : 'Choose file…'}
        </button>
        {error && <div style={{ fontSize: 12, color: 'var(--sv-burgundy)', marginTop: 'var(--sv-space-3)' }}>{error}</div>}
      </div>
    </div>
  );
}
