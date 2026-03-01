import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

export const ADMIN_EMAIL = "bikerschoicekakinada390@gmail.com";

const NETWORK_ERROR_PATTERNS = [
  "failed to fetch",
  "networkerror",
  "network request failed",
  "load failed",
  "fetch failed",
];

export const isNetworkLikeError = (error: unknown) => {
  const message = String((error as { message?: string })?.message ?? error ?? "").toLowerCase();
  return NETWORK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
};

/** Race a promise against a timeout. Rejects with a clear message if it takes too long. */
function withTimeout<T>(promise: Promise<T>, ms: number, label = "Operation"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

/**
 * Throws a descriptive error when the Supabase client was not initialised
 * (env vars missing or invalid).
 */
function requireSupabase() {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error(
      "Supabase environment variables are missing or invalid. " +
      "Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Netlify site settings."
    );
  }
  return supabase;
}

/**
 * Fire-and-forget: attempt to call the seed-admin edge function without blocking login.
 * This does NOT await — the login flow continues immediately.
 */
export function ensureAdminSeededInBackground() {
  try {
    const client = requireSupabase();
    withTimeout(
      client.functions.invoke("seed-admin", { body: {} }),
      5000,
      "seed-admin",
    ).catch((err) => {
      console.warn("seed-admin call failed (background, non-blocking):", err);
    });
  } catch (err) {
    console.warn("seed-admin skipped — Supabase not configured:", err);
  }
}

export async function isCurrentUserAdmin(userId: string): Promise<boolean> {
  const client = requireSupabase();

  const { data, error } = await withTimeout(
    client
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle(),
    8000,
    "Admin role check",
  );

  if (error) throw error;
  return Boolean(data);
}
