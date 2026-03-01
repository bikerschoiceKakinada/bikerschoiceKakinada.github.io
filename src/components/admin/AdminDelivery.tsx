import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, ChevronRight, ArrowLeft, ImagePlus } from "lucide-react";

type Category = { id: string; name: string; icon_url: string | null; order_index: number };
type Item = { id: string; category_id: string; image_url: string; label: string; order_index: number };

const AdminDelivery = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  if (!isSupabaseConfigured() || !supabase) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">Database not configured. Please set Supabase environment variables.</p>
      </div>
    );
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("delivery_categories").select("*").order("order_index");
      if (error) {
        console.error("[AdminDelivery] Fetch categories error:", error);
        return;
      }
      if (data) setCategories(data);
    } catch (err) {
      console.error("[AdminDelivery] Fetch categories failed:", err);
    }
  };

  const fetchItems = async (catId: string) => {
    try {
      const { data, error } = await supabase.from("delivery_items").select("*").eq("category_id", catId).order("order_index");
      if (error) {
        console.error("[AdminDelivery] Fetch items error:", error);
        return;
      }
      if (data) setItems(data);
    } catch (err) {
      console.error("[AdminDelivery] Fetch items failed:", err);
    }
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { if (selectedCat) fetchItems(selectedCat.id); }, [selectedCat]);

  const addCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      toast.error("Please enter a category name");
      return;
    }
    setAdding(true);
    try {
      const { error } = await supabase.from("delivery_categories").insert({ name: trimmed, order_index: categories.length });
      if (error) {
        console.error("[AdminDelivery] Add category error:", error);
        toast.error("Failed to add category: " + error.message);
        setAdding(false);
        return;
      }
      setNewCatName("");
      await fetchCategories();
      toast.success("Category added");
    } catch (err) {
      console.error("[AdminDelivery] Add category failed:", err);
      toast.error("Failed to add category");
    }
    setAdding(false);
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error: itemsError } = await supabase.from("delivery_items").delete().eq("category_id", id);
      if (itemsError) {
        toast.error("Failed to delete category items: " + itemsError.message);
        return;
      }
      const { error } = await supabase.from("delivery_categories").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete category: " + error.message);
        return;
      }
      if (selectedCat?.id === id) setSelectedCat(null);
      await fetchCategories();
      toast.success("Category deleted");
    } catch (err) {
      console.error("[AdminDelivery] Delete category failed:", err);
      toast.error("Failed to delete category");
    }
  };

  const renameCategory = async (id: string, name: string) => {
    try {
      const { error } = await supabase.from("delivery_categories").update({ name }).eq("id", id);
      if (error) {
        toast.error("Failed to rename category: " + error.message);
        return;
      }
      await fetchCategories();
    } catch (err) {
      console.error("[AdminDelivery] Rename category failed:", err);
      toast.error("Failed to rename category");
    }
  };

  const uploadCategoryThumbnail = async (catId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadingThumb(catId);
    try {
      const file = e.target.files[0];
      const ext = file.name.split(".").pop();
      const path = `delivery/thumbnails/${catId}_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file);
      if (error) { toast.error("Thumbnail upload failed: " + error.message); setUploadingThumb(null); return; }
      const { data } = supabase.storage.from("uploads").getPublicUrl(path);
      const { error: updateError } = await supabase.from("delivery_categories").update({ icon_url: data.publicUrl }).eq("id", catId);
      if (updateError) { toast.error("Failed to save thumbnail: " + updateError.message); setUploadingThumb(null); return; }
      await fetchCategories();
      toast.success("Thumbnail updated");
    } catch (err) {
      console.error("[AdminDelivery] Upload thumbnail failed:", err);
      toast.error("Thumbnail upload failed");
    }
    setUploadingThumb(null);
    e.target.value = "";
  };

  const addItem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !selectedCat) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const ext = file.name.split(".").pop();
      const path = `delivery/${selectedCat.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file);
      if (error) { toast.error("Upload failed: " + error.message); setUploading(false); return; }
      const { data } = supabase.storage.from("uploads").getPublicUrl(path);
      const { error: insertError } = await supabase.from("delivery_items").insert({ category_id: selectedCat.id, image_url: data.publicUrl, label: "", order_index: items.length });
      if (insertError) { toast.error("Failed to add item: " + insertError.message); setUploading(false); return; }
      await fetchItems(selectedCat.id);
      toast.success("Item added");
    } catch (err) {
      console.error("[AdminDelivery] Add item failed:", err);
      toast.error("Failed to add item");
    }
    setUploading(false);
    e.target.value = "";
  };

  const deleteItem = async (id: string) => {
    if (!selectedCat) return;
    try {
      const { error } = await supabase.from("delivery_items").delete().eq("id", id);
      if (error) { toast.error("Failed to delete item: " + error.message); return; }
      await fetchItems(selectedCat.id);
      toast.success("Item deleted");
    } catch (err) {
      console.error("[AdminDelivery] Delete item failed:", err);
      toast.error("Failed to delete item");
    }
  };

  const updateItemLabel = async (id: string, label: string) => {
    try {
      const { error } = await supabase.from("delivery_items").update({ label }).eq("id", id);
      if (error) console.error("[AdminDelivery] Update label error:", error);
    } catch (err) {
      console.error("[AdminDelivery] Update label failed:", err);
    }
  };

  if (selectedCat) {
    return (
      <div>
        <button onClick={() => setSelectedCat(null)} className="flex items-center gap-1 text-xs text-primary mb-4">
          <ArrowLeft size={14} /> Back to categories
        </button>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-base">{selectedCat.name}</h2>
          <label className={`flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-heading cursor-pointer ${uploading ? "opacity-50" : ""}`}>
            <Plus size={14} /> Add Item
            <input type="file" accept="image/*" onChange={addItem} className="hidden" disabled={uploading} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <img src={item.image_url} alt={item.label} className="w-full h-32 object-cover" />
              <div className="p-2 space-y-1">
                <input
                  type="text"
                  defaultValue={item.label}
                  placeholder="Label..."
                  onBlur={(e) => updateItemLabel(item.id, e.target.value)}
                  className="w-full bg-muted border-none rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button onClick={() => deleteItem(item.id)} className="flex items-center gap-1 text-secondary text-xs">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        {items.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No items. Add your first above.</p>}
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading font-bold text-base mb-4">Delivery Categories</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="New category name"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }}
          className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button onClick={addCategory} disabled={adding} className={`bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs font-heading ${adding ? "opacity-50" : ""}`}>
          <Plus size={14} />
        </button>
      </div>
      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2">
              {cat.icon_url ? (
                <img src={cat.icon_url} alt={cat.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-muted-foreground text-xs">{cat.name.charAt(0)}</span>
                </div>
              )}
              <input
                type="text"
                defaultValue={cat.name}
                onBlur={(e) => renameCategory(cat.id, e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
              />
              <label className={`text-primary cursor-pointer ${uploadingThumb === cat.id ? "opacity-50" : ""}`} title="Set thumbnail">
                <ImagePlus size={16} />
                <input type="file" accept="image/*" onChange={(e) => uploadCategoryThumbnail(cat.id, e)} className="hidden" disabled={uploadingThumb === cat.id} />
              </label>
              <button onClick={() => setSelectedCat(cat)} className="text-primary"><ChevronRight size={16} /></button>
              <button onClick={() => deleteCategory(cat.id)} className="text-secondary"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      {categories.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No categories yet.</p>}
    </div>
  );
};

export default AdminDelivery;
