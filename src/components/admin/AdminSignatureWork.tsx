import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, RefreshCw } from "lucide-react";
import { DEFAULT_SIGNATURE_WORK } from "@/lib/mediaDefaults";

type SignatureItem = {
  id: string;
  image_url: string;
  label: string;
  order_index: number;
};

const AdminSignatureWork = () => {
  const [items, setItems] = useState<SignatureItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!isSupabaseConfigured() || !supabase) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">Database not configured. Please set Supabase environment variables.</p>
        <div className="mt-4">
          <p className="text-xs font-heading font-semibold text-primary mb-2">Main Page Currently Shows These Default Images:</p>
          <div className="grid grid-cols-2 gap-3">
            {DEFAULT_SIGNATURE_WORK.map((item, idx) => (
              <div key={idx} className="bg-card border border-border border-dashed rounded-lg overflow-hidden opacity-75">
                <img src={item.image_url} alt={item.label} className="w-full h-32 object-cover" />
                <div className="p-2">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase.from("signature_work").select("*").order("order_index");
      if (error) {
        console.error("[AdminSignatureWork] Fetch error:", error);
        toast.error("Failed to load signature work: " + error.message);
        setLoaded(true);
        return;
      }
      if (data) setItems(data);
    } catch (err) {
      console.error("[AdminSignatureWork] Fetch failed:", err);
    }
    setLoaded(true);
  };

  useEffect(() => { fetchItems(); }, []);

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `signature/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file);
    if (error) { toast.error("Upload failed: " + error.message); return null; }
    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSyncDefaults = async () => {
    setSyncing(true);
    try {
      let successCount = 0;
      for (let i = 0; i < DEFAULT_SIGNATURE_WORK.length; i++) {
        const item = DEFAULT_SIGNATURE_WORK[i];
        const response = await fetch(item.image_url);
        const blob = await response.blob();
        const ext = item.image_url.includes(".png") ? "png" : "jpg";
        const path = `signature/${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("uploads").upload(path, blob);
        if (uploadError) {
          console.error("Upload failed for", item.label, uploadError);
          continue;
        }
        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
        const { error: insertError } = await supabase.from("signature_work").insert({
          image_url: urlData.publicUrl,
          label: item.label,
          order_index: i,
        });
        if (insertError) {
          console.error("Insert failed for", item.label, insertError);
          continue;
        }
        successCount++;
      }
      await fetchItems();
      if (successCount === DEFAULT_SIGNATURE_WORK.length) {
        toast.success("Default images synced to database!");
      } else if (successCount > 0) {
        toast.success(`Synced ${successCount}/${DEFAULT_SIGNATURE_WORK.length} images`);
      } else {
        toast.error("Sync failed — could not upload any images");
      }
    } catch (err) {
      console.error("[AdminSignatureWork] Sync failed:", err);
      toast.error("Sync failed");
    }
    setSyncing(false);
  };

  const handleAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const url = await uploadImage(file);
      if (url) {
        const { error } = await supabase.from("signature_work").insert({ image_url: url, label: "", order_index: items.length });
        if (error) {
          toast.error("Failed to save image: " + error.message);
        } else {
          await fetchItems();
          toast.success("Added!");
        }
      }
    } catch (err) {
      console.error("[AdminSignatureWork] Add failed:", err);
      toast.error("Failed to add image");
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("signature_work").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete: " + error.message);
        return;
      }
      await fetchItems();
      toast.success("Deleted");
    } catch (err) {
      console.error("[AdminSignatureWork] Delete failed:", err);
      toast.error("Failed to delete");
    }
  };

  const handleLabelChange = async (id: string, label: string) => {
    try {
      const { error } = await supabase.from("signature_work").update({ label }).eq("id", id);
      if (error) console.error("[AdminSignatureWork] Label update error:", error);
    } catch (err) {
      console.error("[AdminSignatureWork] Label update failed:", err);
    }
  };

  const showFallback = loaded && items.length === 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-base">Signature Work</h2>
        <label className={`flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-heading cursor-pointer ${uploading ? "opacity-50" : ""}`}>
          <Plus size={14} /> Add Image
          <input type="file" accept="image/*" onChange={handleAdd} className="hidden" disabled={uploading} />
        </label>
      </div>

      {showFallback && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3 bg-card border border-primary/30 rounded-lg p-3">
            <div>
              <p className="text-xs font-heading font-semibold text-primary">Default Images Showing on Main Page</p>
              <p className="text-xs text-muted-foreground mt-0.5">These pre-existing images are currently visible to visitors. Sync them to manage from here.</p>
            </div>
            <button
              onClick={handleSyncDefaults}
              disabled={syncing}
              className={`flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-heading whitespace-nowrap ${syncing ? "opacity-50" : ""}`}
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} /> {syncing ? "Syncing..." : "Sync to DB"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {DEFAULT_SIGNATURE_WORK.map((item, idx) => (
              <div key={idx} className="bg-card border border-border border-dashed rounded-lg overflow-hidden opacity-75">
                <img src={item.image_url} alt={item.label} className="w-full h-32 object-cover" />
                <div className="p-2">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">Default — sync to edit</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <img src={item.image_url} alt={item.label} className="w-full h-32 object-cover" />
              <div className="p-2 space-y-1">
                <input
                  type="text"
                  defaultValue={item.label}
                  placeholder="Label..."
                  onBlur={(e) => handleLabelChange(item.id, e.target.value)}
                  className="w-full bg-muted border-none rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button onClick={() => handleDelete(item.id)} className="flex items-center gap-1 text-secondary text-xs hover:underline">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSignatureWork;
