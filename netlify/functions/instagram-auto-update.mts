import { createClient } from "@supabase/supabase-js";
import type { Config } from "@netlify/functions";

const INSTAGRAM_USERNAME = "bikers_choice_kakinada";
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;

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
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  ];
  const ua = userAgents[Math.floor(Math.random() * userAgents.length)];

  try {
    const response = await fetch(INSTAGRAM_URL, {
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
      console.error(`[auto-update] Instagram returned ${response.status}`);
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
            console.log(`[auto-update] Parsed from og:description: ${count}`);
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
          console.log(`[auto-update] Parsed from description: ${count}`);
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
        console.log(`[auto-update] Parsed from JSON: ${count}`);
        return count;
      }
    }

    // Strategy 4: title tag sometimes has follower info
    const titlePattern = /<title>([^<]+)<\/title>/i;
    const titleMatch = html.match(titlePattern);
    if (titleMatch) {
      const followerMatch = titleMatch[1].match(/([\d,\.]+[KkMm]?)\s*Followers/i);
      if (followerMatch) {
        const count = parseFollowerCount(followerMatch[1]);
        if (count > 0) {
          console.log(`[auto-update] Parsed from title: ${count}`);
          return count;
        }
      }
    }

    console.warn("[auto-update] Could not parse follower count from page");
    return null;
  } catch (err) {
    console.error("[auto-update] Fetch error:", err);
    return null;
  }
}

async function updateSupabase(count: number): Promise<boolean> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("[auto-update] Supabase env vars not set");
    return false;
  }

  try {
    const sb = createClient(url, key);

    // Get the existing settings row
    const { data: existing, error: fetchError } = await sb
      .from("site_settings")
      .select("id, instagram_followers")
      .limit(1)
      .maybeSingle();

    if (fetchError || !existing) {
      console.error("[auto-update] Could not fetch settings row:", fetchError);
      return false;
    }

    // Update with the new count
    const formattedCount = count.toLocaleString("en-IN");
    const { error: updateError } = await sb
      .from("site_settings")
      .update({
        instagram_followers: formattedCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error("[auto-update] Supabase update error:", updateError);
      return false;
    }

    console.log(`[auto-update] Successfully updated follower count to ${formattedCount} (${count})`);
    return true;
  } catch (err) {
    console.error("[auto-update] Unexpected error:", err);
    return false;
  }
}

// Scheduled function — runs every 6 hours
export default async () => {
  console.log("[auto-update] Starting scheduled Instagram follower update...");

  const count = await fetchFromInstagram();

  if (count && count > 0) {
    const updated = await updateSupabase(count);
    console.log(
      updated
        ? `[auto-update] Done — stored ${count} followers`
        : "[auto-update] Fetched count but failed to store in Supabase"
    );
  } else {
    console.log("[auto-update] Could not fetch follower count from Instagram — skipping update");
  }
};

export const config: Config = {
  schedule: "0 */6 * * *",
};
