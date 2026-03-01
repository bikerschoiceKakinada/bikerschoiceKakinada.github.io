import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Hardcoded fallbacks — these are public (anon) credentials already exposed
// via the VITE_ prefix in the client bundle, so embedding them here is safe.
const SUPABASE_URL_FALLBACK = "https://uhhbhdzifhjzctkpduio.supabase.co";
const SUPABASE_KEY_FALLBACK =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoaGJoZHppZmhqemN0a3BkdWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNzcyNjksImV4cCI6MjA4Nzc1MzI2OX0.ahyJCds9XMrNfBFWb6nfX0lox69MGsyAODrYw3-4XpA";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL_FALLBACK;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_KEY_FALLBACK;

/**
 * Returns true when the Supabase environment variables are present and
 * look plausible (non-empty strings).  This is checked at runtime so
 * production builds that run before env-vars are injected do not crash.
 */
export function isSupabaseConfigured(): boolean {
  return (
    typeof SUPABASE_URL === 'string' &&
    SUPABASE_URL.length > 0 &&
    typeof SUPABASE_ANON_KEY === 'string' &&
    SUPABASE_ANON_KEY.length > 0
  );
}

function buildClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) {
    console.error(
      '[Supabase] Missing environment variables. ' +
      'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your Netlify environment. ' +
      `VITE_SUPABASE_URL is ${SUPABASE_URL ? 'SET' : 'MISSING'}, ` +
      `VITE_SUPABASE_ANON_KEY is ${SUPABASE_ANON_KEY ? 'SET' : 'MISSING'}.`
    );
    return null;
  }

  try {
    const client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    console.info('[Supabase] Client initialized successfully.');
    return client;
  } catch (err) {
    console.error('[Supabase] Failed to create client:', err);
    return null;
  }
}

/**
 * The global Supabase client.
 *
 * **May be `null`** when env-vars are missing (e.g. a production build
 * that ran before Netlify injected the variables).  Every consumer
 * should either check `isSupabaseConfigured()` or guard against `null`.
 */
export const supabase: SupabaseClient<Database> | null = buildClient();
