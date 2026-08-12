// Supabase client (TASK-019). The URL and anon/public key below are safe to
// commit — the anon key is the client-facing key intended to ship in public
// clients, protected by Supabase Row Level Security policies. It is NOT the
// service_role/secret key (which would be prefixed differently and must
// never be embedded here). See tasks/TASK-019.md's locked decisions.
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://bpcxrtqhlvgylbpnfjhp.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwY3hydHFobHZneWxicG5mamhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0OTg3NDYsImV4cCI6MjEwMjA3NDc0Nn0._N5T17eaRpHIoBrxrimh4QhK-VLuteGQAVoRhY0YzyM';

// Default storage is `localStorage`, which is available and persistent in
// Tauri 2's webview (WebView2 on Windows / WKWebView on macOS both back it
// with real on-disk storage scoped to the app's origin), so the client's
// default session persistence is used as-is rather than building a second,
// SQLite-backed storage adapter. This assumption is documented in the
// TASK-019 final report/CANONICAL_STATE update rather than silently relied
// upon — if a future session shows session loss across restarts, swap in a
// custom `storage` option here backed by the existing `settings` table via
// get_setting/set_setting.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
