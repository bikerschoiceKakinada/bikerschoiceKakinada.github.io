import { supabase } from "@/integrations/supabase/client";

export const ADMIN_EMAIL = "bikerschoicekakinada390@gmail.com";

const NETWORK_ERROR_PATTERNS = [
  "failed to fetch",
  "networkerror",
  "network request failed",
  "load failed",
  "fetch failed",
];

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export const isNetworkLikeError = (error: unknown) => {
  const message = String((error as { message?: string })?.message ?? error ?? "").toLowerCase();
  return NETWORK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
};

export async function withNetworkRetry<T>(
  operation: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 500,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isNetworkLikeError(error) || attempt === attempts) {
        throw error;
      }
      await sleep(baseDelayMs * attempt);
    }
  }

  throw lastError;
}

export async function ensureAdminSeeded() {
  const { error } = await withNetworkRetry(
    () => supabase.functions.invoke("seed-admin", { body: {} }),
    2,
    400,
  );

  if (error) throw error;
}

export async function isCurrentUserAdmin(userId: string) {
  const { data, error } = await withNetworkRetry(
    async () =>
      await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle(),
    2,
    400,
  );

  if (error) throw error;
  return Boolean(data);
}
