import { getStore } from "@netlify/blobs";
import { createClient } from "@supabase/supabase-js";
import type { Context } from "@netlify/functions";

const INSTAGRAM_USERNAME_FALLBACK = "bikers_choice_kakinada";
const CACHE_KEY = "instagram-followers";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_FOLLOWERS = 4800;

function getSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function fetchFromSupabase(): Promise<number | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from("site_settings")
      .select("instagram_followers")
      .limit(1)
      .maybeSingle();

    if (error || !data?.instagram_followers) return null;

    const parsed = parseInt(String(data.instagram_followers).replace(/[^\d]/g, ""), 10);
    return !isNaN(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

async function saveToSupabase(count: number): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;

  try {
    const { data: existing } = await sb
      .from("site_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      await sb
        .from("site_settings")
        .update({
          instagram_followers: count.toLocaleString("en-IN"),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    }
  } catch {
    // Non-critical — best effort
  }
}

interface CachedData {
  count: number;
  fetchedAt: number;
}

function parseFollowerCount(raw: string): number {
  const cleaned = raw.replace(/,/g, "").trim();

  if (/k$/i.test(cleaned)) {
    return Math.round(parseFloat(cleaned.replace(/k$/i, "")) * 1000);
  }
  if (/m$/i.test(cleaned)) {
    return Math.round(parseFloat(cleaned.replace(/m$/i, "")) * 1_000_000);
  }

  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

function parseInstagramUsername(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const linkMatch = trimmed.match(/instagram\.com\/([^/?#]+)/i);
  if (linkMatch?.[1]) return linkMatch[1];

  if (trimmed.startsWith("@")) {
    const handle = trimmed.slice(1);
    return handle ? handle : null;
  }

  if (/^[A-Za-z0-9._]+$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

async function resolveInstagramUsername(): Promise<string> {
  const sb = getSupabaseClient();
  if (!sb) return INSTAGRAM_USERNAME_FALLBACK;

  try {
    const { data } = await sb
      .from("site_settings")
      .select("instagram_link")
      .limit(1)
      .maybeSingle();

    const parsed = parseInstagramUsername(data?.instagram_link);
    return parsed || INSTAGRAM_USERNAME_FALLBACK;
  } catch {
    return INSTAGRAM_USERNAME_FALLBACK;
  }
}

async function fetchFromInstagram(username: string): Promise<number | null> {
  const instagramUrl = `https://www.instagram.com/${username}/`;
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  ];
  const ua = userAgents[Math.floor(Math.random() * userAgents.length)];

  try {
    const response = await fetch(instagramUrl, {
      headers: {
        "User-Agent": ua,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      console.error(`[instagram-followers] Instagram returned ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Strategy 1: og:description meta tag
    const ogPatterns = [
      /<meta\s+property="og:description"\s+content="([^"]+)"/i,
      /<meta\s+content="([^"]+)"\s+property="og:description"/i,
    ];
    for (const pattern of ogPatterns) {
      const match = html.match(pattern);
      if (match) {
        const followerMatch = match[1].match(/([\d,\.]+[KkMm]?)\s*Followers/i);
        if (followerMatch) {
          const count = parseFollowerCount(followerMatch[1]);
          if (count > 0) {
            console.log(`[instagram-followers] Parsed from og:description: ${count}`);
            return count;
          }
        }
      }
    }

    // Strategy 2: description meta tag
    const descPattern = /<meta\s+name="description"\s+content="([^"]+)"/i;
    const descMatch = html.match(descPattern);
    if (descMatch) {
      const followerMatch = descMatch[1].match(/([\d,\.]+[KkMm]?)\s*Followers/i);
      if (followerMatch) {
        const count = parseFollowerCount(followerMatch[1]);
        if (count > 0) {
          console.log(`[instagram-followers] Parsed from description: ${count}`);
          return count;
        }
      }
    }

    // Strategy 3: JSON data in page
    const jsonPattern = /"edge_followed_by"\s*:\s*\{\s*"count"\s*:\s*(\d+)\s*\}/;
    const jsonMatch = html.match(jsonPattern);
    if (jsonMatch) {
      const count = parseInt(jsonMatch[1], 10);
      if (count > 0) {
        console.log(`[instagram-followers] Parsed from JSON: ${count}`);
        return count;
      }
    }

    // Strategy 4: title tag
    const titlePattern = /<title>([^<]+)<\/title>/i;
    const titleMatch = html.match(titlePattern);
    if (titleMatch) {
      const followerMatch = titleMatch[1].match(/([\d,\.]+[KkMm]?)\s*Followers/i);
      if (followerMatch) {
        const count = parseFollowerCount(followerMatch[1]);
        if (count > 0) {
          console.log(`[instagram-followers] Parsed from title: ${count}`);
          return count;
        }
      }
    }

    console.warn("[instagram-followers] Could not parse follower count from page");
    return null;
  } catch (err) {
    console.error("[instagram-followers] Fetch error:", err);
    return null;
  }
}

export default async (req: Request, context: Context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=3600, s-maxage=3600",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const store = getStore("instagram-cache");

    const username = await resolveInstagramUsername();
    const cacheKey = `${CACHE_KEY}:${username}`;

    // Check blob cache
    let cached: CachedData | null = null;
    try {
      cached = (await store.get(cacheKey, { type: "json" })) as CachedData | null;
    } catch {
      // Blobs may not be available in all environments
    }

    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return new Response(
        JSON.stringify({ count: cached.count, source: "cache" }),
        { headers }
      );
    }

    // Fetch fresh from Instagram
    const freshCount = await fetchFromInstagram(username);

    if (freshCount && freshCount > 0) {
      // Cache the result in blobs
      try {
        await store.setJSON(cacheKey, {
          count: freshCount,
          fetchedAt: Date.now(),
        } satisfies CachedData);
      } catch {
        // Caching failure is non-critical
      }

      // Also auto-save to Supabase so the count persists and triggers real-time updates
      await saveToSupabase(freshCount);

      return new Response(
        JSON.stringify({ count: freshCount, source: "instagram" }),
        { headers }
      );
    }

    // If fresh fetch failed but we have stale cache, use it
    if (cached) {
      return new Response(
        JSON.stringify({ count: cached.count, source: "stale-cache" }),
        { headers }
      );
    }

    // Try Supabase (admin-set or previously auto-updated value) before hardcoded default
    const supabaseCount = await fetchFromSupabase();
    if (supabaseCount) {
      return new Response(
        JSON.stringify({ count: supabaseCount, source: "supabase" }),
        { headers }
      );
    }

    // Final fallback
    return new Response(
      JSON.stringify({ count: DEFAULT_FOLLOWERS, source: "default" }),
      { headers }
    );
  } catch (err) {
    console.error("[instagram-followers] Function error:", err);

    const supabaseCount = await fetchFromSupabase();
    if (supabaseCount) {
      return new Response(
        JSON.stringify({ count: supabaseCount, source: "supabase" }),
        { headers }
      );
    }

    return new Response(
      JSON.stringify({ count: DEFAULT_FOLLOWERS, source: "error" }),
      { headers }
    );
  }
};
