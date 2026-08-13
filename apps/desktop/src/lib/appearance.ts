import { getSetting, setSetting } from './api';

export type ThemeChoice = 'light' | 'dark' | 'system';
export type AccentChoice = 'burgundy' | 'teal';
export type DensityChoice = 'comfortable' | 'compact';

export interface AppearanceSettings {
  theme: ThemeChoice;
  accent: AccentChoice;
  density: DensityChoice;
  fontScale: number; // 0.85–1.3
  reduceMotion: boolean;
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  theme: 'dark',
  accent: 'burgundy',
  density: 'comfortable',
  fontScale: 1,
  reduceMotion: false,
};

const APPEARANCE_KEY = 'appearance_settings_v1';

export async function loadAppearance(): Promise<AppearanceSettings> {
  try {
    const raw = await getSetting(APPEARANCE_KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    return { ...DEFAULT_APPEARANCE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export async function saveAppearance(settings: AppearanceSettings): Promise<void> {
  await setSetting(APPEARANCE_KEY, JSON.stringify(settings));
}

/** Applies appearance settings as attributes/CSS variables on <html> — the
 * real effect, not just a stored preference. 'system' resolves via
 * prefers-color-scheme at apply time (re-resolve on change if you want live
 * OS-theme tracking; this app applies once per settings change/launch,
 * which matches every other setting's apply model here). */
export function applyAppearance(settings: AppearanceSettings) {
  const root = document.documentElement;

  const resolvedTheme =
    settings.theme === 'system'
      ? window.matchMedia?.('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark'
      : settings.theme;
  root.setAttribute('data-theme', resolvedTheme);

  if (settings.accent === 'teal') root.setAttribute('data-accent', 'teal');
  else root.removeAttribute('data-accent');

  if (settings.density === 'compact') root.setAttribute('data-density', 'compact');
  else root.removeAttribute('data-density');

  if (settings.reduceMotion) root.setAttribute('data-motion', 'reduced');
  else root.removeAttribute('data-motion');

  root.style.setProperty('--sv-font-scale', String(settings.fontScale));
}
