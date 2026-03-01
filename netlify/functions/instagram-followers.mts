import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

const INSTAGRAM_USERNAME = "bikers_choice_kakinada";
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;
const CACHE_KEY = "instagram-followers";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_FOLLOWERS = 4800;

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

async function fetchFromInstagram(): Promise<number | null> {
  try {
    const response = await fetch(INSTAGRAM_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      console.error(
        `[instagram-followers] Instagram returned ${response.status}`
      );
      return null;
    }

    const html = await response.text();

    // Strategy 1: Parse from og:description meta tag
    // Format: "X Followers, Y Following, Z Posts - See Instagram photos..."
    const ogPatterns = [
      /<meta\s+property="og:description"\s+content="([^"]+)"/i,
      /<meta\s+content="([^"]+)"\s+property="og:description"/i,
    ];

    for (const pattern of ogPatterns) {
      const match = html.match(pattern);
      if (match) {
        const followerMatch = match[1].match(
          /([\d,\.]+[KkMm]?)\s*Followers/i
        );
        if (followerMatch) {
          const count = parseFollowerCount(followerMatch[1]);
          if (count > 0) {
            console.log(
              `[instagram-followers] Parsed from og:description: ${count}`
            );
            return count;
          }
        }
      }
    }

    // Strategy 2: Parse from description meta tag
    const descPattern =
      /<meta\s+name="description"\s+content="([^"]+)"/i;
    const descMatch = html.match(descPattern);
    if (descMatch) {
      const followerMatch = descMatch[1].match(
        /([\d,\.]+[KkMm]?)\s*Followers/i
      );
      if (followerMatch) {
        const count = parseFollowerCount(followerMatch[1]);
        if (count > 0) {
          console.log(
            `[instagram-followers] Parsed from description: ${count}`
          );
          return count;
        }
      }
    }

    // Strategy 3: Look for JSON data embedded in the page
    const jsonPattern =
      /"edge_followed_by"\s*:\s*\{\s*"count"\s*:\s*(\d+)\s*\}/;
    const jsonMatch = html.match(jsonPattern);
    if (jsonMatch) {
      const count = parseInt(jsonMatch[1], 10);
      if (count > 0) {
        console.log(
          `[instagram-followers] Parsed from JSON data: ${count}`
        );
        return count;
      }
    }

    console.warn(
      "[instagram-followers] Could not parse follower count from page"
    );
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

  // Handle CORS preflight
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

    // Check blob cache
    let cached: CachedData | null = null;
    try {
      cached = (await store.get(CACHE_KEY, {
        type: "json",
      })) as CachedData | null;
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
    const freshCount = await fetchFromInstagram();

    if (freshCount && freshCount > 0) {
      // Cache the result
      try {
        await store.setJSON(CACHE_KEY, {
          count: freshCount,
          fetchedAt: Date.now(),
        } satisfies CachedData);
      } catch {
        // Caching failure is non-critical
      }

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

    // Final fallback
    return new Response(
      JSON.stringify({ count: DEFAULT_FOLLOWERS, source: "default" }),
      { headers }
    );
  } catch (err) {
    console.error("[instagram-followers] Function error:", err);
    return new Response(
      JSON.stringify({ count: DEFAULT_FOLLOWERS, source: "error" }),
      { headers }
    );
  }
};
