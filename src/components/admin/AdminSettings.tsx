import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save } from "lucide-react";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    id: "",
    hero_subtitle: "",
    instagram_followers: "",
    map_embed: "",
    working_hours: "",
    instagram_link: "",
    facebook_link: "",
    online_delivery_button_enabled: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("site_settings").select("*").limit(1).single();
      if (data) {
        setSettings({
          id: data.id,
          hero_subtitle: data.hero_subtitle || "",
          instagram_followers: data.instagram_followers || "",
          map_embed: data.map_embed || "",
          working_hours: data.working_hours || "",
          instagram_link: data.instagram_link || "",
          facebook_link: data.facebook_link || "",
          online_delivery_button_enabled: data.online_delivery_button_enabled ?? true,
        });
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_settings").update({
      hero_subtitle: settings.hero_subtitle,
      instagram_followers: settings.instagram_followers,
      map_embed: settings.map_embed,
      working_hours: settings.working_hours,
      instagram_link: settings.instagram_link,
      facebook_link: settings.facebook_link,
      online_delivery_button_enabled: settings.online_delivery_button_enabled,
      updated_at: new Date().toISOString(),
    }).eq("id", settings.id);
    if (error) toast.error("Save failed");
    else toast.success("Settings saved!");
    setSaving(false);
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
      {field("Instagram Followers", "instagram_followers")}
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
