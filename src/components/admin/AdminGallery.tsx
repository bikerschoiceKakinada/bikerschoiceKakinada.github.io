import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, RefreshCw } from "lucide-react";
import bike1 from "@/assets/bike1.png";
import bike2 from "@/assets/bike2.png";
import bike3 from "@/assets/bike3.png";
import bike4 from "@/assets/bike4.png";
import bike5 from "@/assets/bike5.png";
import helmets from "@/assets/helmets.jpeg";
import tyres from "@/assets/tyres.jpeg";

const CATEGORIES = ["Custom Builds", "LED & Neon", "Wraps & Paint", "Alloy & Tyre", "Before & After", "Workshop"];

const fallbackImages = [
  { src: bike1, cat: "LED & Neon" },
  { src: bike2, cat: "Wraps & Paint" },
  { src: bike3, cat: "Custom Builds" },
  { src: bike4, cat: "LED & Neon" },
  { src: bike5, cat: "Custom Builds" },
  { src: helmets, cat: "Workshop" },
  { src: tyres, cat: "Alloy & Tyre" },
];

type GalleryItem = {
  id: string;
  category: string;
  image_url: string;
  order_index: number;
};

const AdminGallery = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedCat, setSelectedCat] = useState(CATEGORIES[0]);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchItems = async () => {
    try {
      const { data } = await supabase!.from("gallery").select("*").order("order_index");
      if (data) setItems(data);
    } catch (err) {
      console.error("[AdminGallery] Fetch failed:", err);
    }
    setLoaded(true);
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter((i) => i.category === selectedCat);
  const fallbackFiltered = fallbackImages.filter((img) => img.cat === selectedCat);
  const showFallback = loaded && items.length === 0;

  const handleSyncDefaults = async () => {
    setSyncing(true);
    try {
      for (let i = 0; i < fallbackImages.length; i++) {
        const img = fallbackImages[i];
        const response = await fetch(img.src);
        const blob = await response.blob();
        const ext = img.src.includes(".png") ? "png" : "jpg";
        const path = `gallery/${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase!.storage.from("uploads").upload(path, blob);
        if (uploadError) {
          console.error("Upload failed for gallery image", i, uploadError);
          continue;
        }
        const { data: urlData } = supabase!.storage.from("uploads").getPublicUrl(path);
        await supabase!.from("gallery").insert({
          category: img.cat,
          image_url: urlData.publicUrl,
          order_index: i,
        });
      }
      await fetchItems();
      toast.success("Default gallery images synced to database!");
    } catch (err) {
      console.error("[AdminGallery] Sync failed:", err);
      toast.error("Sync failed");
    }
    setSyncing(false);
  };

  const handleAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    const file = e.target.files[0];
    const ext = file.name.split(".").pop();
    const path = `gallery/${Date.now()}.${ext}`;
    const { error } = await supabase!.storage.from("uploads").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data } = supabase!.storage.from("uploads").getPublicUrl(path);
    await supabase!.from("gallery").insert({ category: selectedCat, image_url: data.publicUrl, order_index: filtered.length });
    fetchItems();
    toast.success("Added!");
    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async (id: string) => {
    await supabase!.from("gallery").delete().eq("id", id);
    fetchItems();
    toast.success("Deleted");
  };

  return (
    <div>
      <h2 className="font-heading font-bold text-base mb-4">Gallery</h2>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-heading font-semibold whitespace-nowrap ${
              selectedCat === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <label className={`inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-heading cursor-pointer mb-4 ${uploading ? "opacity-50" : ""}`}>
        <Plus size={14} /> Add to {selectedCat}
        <input type="file" accept="image/*" onChange={handleAdd} className="hidden" disabled={uploading} />
      </label>

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
            {fallbackFiltered.map((img, idx) => (
              <div key={idx} className="relative rounded-lg overflow-hidden border border-border border-dashed opacity-75">
                <img src={img.src} alt={img.cat} className="w-full h-32 object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-background/70 px-2 py-1">
                  <p className="text-[10px] text-muted-foreground">Default — sync to edit</p>
                </div>
              </div>
            ))}
            {fallbackFiltered.length === 0 && (
              <p className="text-muted-foreground text-xs col-span-2 text-center py-4">No default images in this category.</p>
            )}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((item) => (
            <div key={item.id} className="relative rounded-lg overflow-hidden border border-border">
              <img src={item.image_url} alt="" className="w-full h-32 object-cover" />
              <button
                onClick={() => handleDelete(item.id)}
                className="absolute top-1 right-1 bg-background/80 p-1 rounded-full text-secondary hover:text-foreground"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-muted-foreground text-sm text-center py-8 col-span-2">No images in this category.</p>}
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
