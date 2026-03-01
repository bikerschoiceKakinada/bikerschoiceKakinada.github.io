import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, RefreshCw } from "lucide-react";
import { DEFAULT_SETTINGS } from "@/hooks/useSiteSettings";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    id: "",
    hero_subtitle: DEFAULT_SETTINGS.hero_subtitle,
    instagram_followers: DEFAULT_SETTINGS.instagram_followers,
    map_embed: DEFAULT_SETTINGS.map_embed,
    working_hours: DEFAULT_SETTINGS.working_hours,
    instagram_link: DEFAULT_SETTINGS.instagram_link,
    facebook_link: DEFAULT_SETTINGS.facebook_link,
    online_delivery_button_enabled: DEFAULT_SETTINGS.online_delivery_button_enabled,
  });
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const configured = isSupabaseConfigured() && supabase;

  useEffect(() => {
    if (!configured) return;

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
        if (error) { console.error("[AdminSettings] Fetch error:", error); return; }
        if (data) {
          setSettings({
            id: data.id,
            hero_subtitle: data.hero_subtitle || DEFAULT_SETTINGS.hero_subtitle,
            instagram_followers: data.instagram_followers || DEFAULT_SETTINGS.instagram_followers,
            map_embed: data.map_embed || DEFAULT_SETTINGS.map_embed,
            working_hours: data.working_hours || DEFAULT_SETTINGS.working_hours,
            instagram_link: data.instagram_link || DEFAULT_SETTINGS.instagram_link,
            facebook_link: data.facebook_link || DEFAULT_SETTINGS.facebook_link,
            online_delivery_button_enabled: data.online_delivery_button_enabled ?? DEFAULT_SETTINGS.online_delivery_button_enabled,
          });
          if (data.updated_at) {
            setLastUpdated(new Date(data.updated_at).toLocaleString());
          }
        } else {
          setSettings((prev) => ({
            ...prev,
            hero_subtitle: DEFAULT_SETTINGS.hero_subtitle,
            instagram_followers: DEFAULT_SETTINGS.instagram_followers,
            map_embed: DEFAULT_SETTINGS.map_embed,
            working_hours: DEFAULT_SETTINGS.working_hours,
            instagram_link: DEFAULT_SETTINGS.instagram_link,
            facebook_link: DEFAULT_SETTINGS.facebook_link,
            online_delivery_button_enabled: DEFAULT_SETTINGS.online_delivery_button_enabled,
          }));
        }
      } catch (err) {
        console.error("[AdminSettings] Unexpected error:", err);
      }
    };
    fetchSettings();

    // Listen for real-time updates to settings (e.g. from scheduled auto-update)
    const channel = supabase
      .channel("admin-settings-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "site_settings" },
        (payload) => {
          const d = payload.new;
          if (d) {
            setSettings((prev) => ({
              ...prev,
              instagram_followers: d.instagram_followers || prev.instagram_followers,
            }));
            if (d.updated_at) {
              setLastUpdated(new Date(d.updated_at).toLocaleString());
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [configured]);

  const handleRefreshFollowers = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/.netlify/functions/instagram-followers");
      if (res.ok) {
        const data = await res.json();
        if (data.count && data.count > 0 && data.source !== "default" && data.source !== "error") {
          const formatted = data.count.toLocaleString("en-IN");
          setSettings((prev) => ({ ...prev, instagram_followers: formatted }));
          toast.success(`Fetched live count: ${formatted} (source: ${data.source})`);
        } else {
          toast.info(`Could not get live count (source: ${data.source}). Current value kept.`);
        }
      } else {
        toast.error("Failed to reach Instagram function");
      }
    } catch {
      toast.error("Failed to refresh follower count");
    } finally {
      setRefreshing(false);
    }
  };

  const handleUseDefaults = () => {
    setSettings((prev) => ({
      ...prev,
      hero_subtitle: DEFAULT_SETTINGS.hero_subtitle,
      instagram_followers: DEFAULT_SETTINGS.instagram_followers,
      map_embed: DEFAULT_SETTINGS.map_embed,
      working_hours: DEFAULT_SETTINGS.working_hours,
      instagram_link: DEFAULT_SETTINGS.instagram_link,
      facebook_link: DEFAULT_SETTINGS.facebook_link,
      online_delivery_button_enabled: DEFAULT_SETTINGS.online_delivery_button_enabled,
    }));
    toast.success("Loaded website defaults");
  };

  const handleSave = async () => {
    if (!configured) { toast.error("Database not configured"); return; }
    setSaving(true);
    try {
      const payload = {
        hero_subtitle: settings.hero_subtitle,
        instagram_followers: settings.instagram_followers,
        map_embed: settings.map_embed,
        working_hours: settings.working_hours,
        instagram_link: settings.instagram_link,
        facebook_link: settings.facebook_link,
        online_delivery_button_enabled: settings.online_delivery_button_enabled,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (settings.id) {
        ({ error } = await supabase.from("site_settings").update(payload).eq("id", settings.id));
      } else {
        // No existing row — insert a new one
        const result = await supabase.from("site_settings").insert(payload).select().single();
        error = result.error;
        if (!error && result.data) {
          setSettings((prev) => ({ ...prev, id: result.data.id }));
        }
      }

      if (error) {
        console.error("[AdminSettings] Save error:", error);
        toast.error("Save failed: " + error.message);
      } else {
        toast.success("Settings saved!");
        setLastUpdated(new Date().toLocaleString());
      }
    } catch (err) {
      console.error("[AdminSettings] Save error:", err);
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof typeof settings, multiline = false) => (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground font-heading">{label}</label>
      {multiline ? (
        <textarea
          value={settings[key] as string}
          onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
          rows={3}
          className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      ) : (
        <input
          type="text"
          value={settings[key] as string}
          onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
          className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-bold text-base">Site Settings</h2>
      {field("Hero Subtitle", "hero_subtitle", true)}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground font-heading">Instagram Followers</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={settings.instagram_followers}
            onChange={(e) => setSettings({ ...settings, instagram_followers: e.target.value })}
            className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleRefreshFollowers}
            disabled={refreshing}
            title="Fetch live count from Instagram"
            className="flex items-center gap-1.5 bg-muted border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Fetching..." : "Live Fetch"}
          </button>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-muted-foreground">Auto-updates every 2 hours</span>
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground">· Last updated: {lastUpdated}</span>
          )}
        </div>
      </div>
      {field("Instagram Link", "instagram_link")}
      {field("Facebook Link", "facebook_link")}
      {field("Working Hours", "working_hours")}
      {field("Map Embed URL", "map_embed")}
      <div className="flex items-center gap-3">
        <label className="text-xs text-muted-foreground font-heading">Online Delivery Button</label>
        <button
          onClick={() => setSettings({ ...settings, online_delivery_button_enabled: !settings.online_delivery_button_enabled })}
          className={`w-10 h-5 rounded-full transition-colors ${settings.online_delivery_button_enabled ? "bg-primary" : "bg-muted"}`}
        >
          <div className={`w-4 h-4 bg-foreground rounded-full transition-transform mx-0.5 ${settings.online_delivery_button_enabled ? "translate-x-5" : ""}`} />
        </button>
      </div>
      <button
        onClick={handleUseDefaults}
        className="flex items-center gap-2 bg-muted text-muted-foreground font-heading font-semibold py-2.5 px-4 rounded-full text-xs hover:text-foreground hover:border-primary border border-border transition-colors"
      >
        <RefreshCw size={14} /> Load Website Defaults
      </button>
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-primary text-primary-foreground font-heading font-bold py-3 px-6 rounded-full text-sm hover:scale-105 transition-transform disabled:opacity-50"
      >
        <Save size={16} /> {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
};

export default AdminSettings;
