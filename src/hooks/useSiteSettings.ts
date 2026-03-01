import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

export type SiteSettings = {
  hero_subtitle: string;
  instagram_followers: string;
  map_embed: string;
  working_hours: string;
  instagram_link: string;
  facebook_link: string;
  online_delivery_button_enabled: boolean;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  hero_subtitle:
    "Premium aggressive custom-styled bikes with LED mods, painting, wraps, touring setups & precision finishing.",
  instagram_followers: "4,800+",
  map_embed: "https://www.google.com/maps?output=embed&q=Bikers%20Choice%20Kakinada",
  working_hours: "Mon – Sat: 9 AM – 9:30 PM\nSunday: 9 AM – 1 PM",
  instagram_link:
    "https://www.instagram.com/bikers_choice_kakinada?igsh=MXN4NHd0bnRzY2p3dg==",
  facebook_link: "",
  online_delivery_button_enabled: true,
};

function mergeSettings(partial?: Partial<SiteSettings> | null): SiteSettings {
  return {
    hero_subtitle: partial?.hero_subtitle ?? DEFAULT_SETTINGS.hero_subtitle,
    instagram_followers:
      partial?.instagram_followers ?? DEFAULT_SETTINGS.instagram_followers,
    map_embed: partial?.map_embed ?? DEFAULT_SETTINGS.map_embed,
    working_hours: partial?.working_hours ?? DEFAULT_SETTINGS.working_hours,
    instagram_link: partial?.instagram_link ?? DEFAULT_SETTINGS.instagram_link,
    facebook_link: partial?.facebook_link ?? DEFAULT_SETTINGS.facebook_link,
    online_delivery_button_enabled:
      partial?.online_delivery_button_enabled ??
      DEFAULT_SETTINGS.online_delivery_button_enabled,
  };
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select(
            "hero_subtitle, instagram_followers, map_embed, working_hours, instagram_link, facebook_link, online_delivery_button_enabled"
          )
          .limit(1)
          .maybeSingle();

        if (!error && data && active) {
          setSettings(mergeSettings(data));
        }
      } catch (err) {
        console.error("[useSiteSettings] Fetch failed:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSettings();

    const channel = supabase
      .channel("site-settings-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "site_settings" },
        (payload) => {
          if (!active) return;
          setSettings((prev) => mergeSettings({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { settings, loading };
}
