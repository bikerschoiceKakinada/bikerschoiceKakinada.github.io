import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

const CATEGORIES = ["Custom Builds", "LED & Neon", "Wraps & Paint", "Alloy & Tyre", "Before & After", "Workshop"];

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

  const fetchItems = async () => {
    try {
      const { data } = await supabase!.from("gallery").select("*").order("order_index");
      if (data) setItems(data);
    } catch (err) {
      console.error("[AdminGallery] Fetch failed:", err);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter((i) => i.category === selectedCat);

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
      </div>
      {filtered.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No images in this category.</p>}
    </div>
  );
};

export default AdminGallery;
