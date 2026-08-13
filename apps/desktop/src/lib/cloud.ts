// Thin client for the Scaffold cloud backend (sinvaux-main-site's
// scaffold-api.js) — entitlement/billing + cloud sync. Every call is
// authenticated with the SAME Supabase session the desktop app already
// holds (lib/supabase.ts), sent as `Authorization: Bearer <access_token>`,
// since Scaffold and the website share one Supabase project.
import { supabase } from './supabase';
import type { Prompt, Project, Template, Compile } from './api';

const SCAFFOLD_API_BASE = 'https://sinvaux-main.fly.dev/api/scaffold';

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not signed in.');
  const res = await fetch(SCAFFOLD_API_BASE + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export interface Entitlement {
  tier: 'Free' | 'Plus' | 'Pro' | 'Max';
  expires_at: string;
}

export function getEntitlement(): Promise<Entitlement> {
  return apiFetch('/entitlement');
}

export type PaidTier = 'Plus' | 'Pro' | 'Max';

export interface CheckoutResult {
  devMode: boolean;
  redirectUrl: string;
}

export function startCheckout(tier: PaidTier): Promise<CheckoutResult> {
  return apiFetch('/checkout', { method: 'POST', body: JSON.stringify({ tier }) });
}

// The server's SQLite-backed API serializes `deleted` as a raw 0/1 JSON
// number (not a real boolean) — sync.ts converts it with `!!` before
// handing rows to the local (real-bool) upsert_*_from_sync commands.
type Wire<T> = Omit<T, 'deleted'> & { deleted: number };

export interface SyncPullResult {
  serverTime: string;
  projects: Wire<Project>[];
  templates: Wire<Template>[];
  prompts: Wire<Prompt>[];
  compiles: Compile[];
}

export function pullSync(since?: string): Promise<SyncPullResult> {
  const qs = since ? `?since=${encodeURIComponent(since)}` : '';
  return apiFetch('/sync' + qs);
}

export interface SyncPushPayload {
  projects?: Project[];
  templates?: Template[];
  prompts?: Prompt[];
  compiles?: Compile[];
}

export function pushSync(payload: SyncPushPayload): Promise<{ ok: boolean; serverTime: string }> {
  return apiFetch('/sync', { method: 'POST', body: JSON.stringify(payload) });
}
