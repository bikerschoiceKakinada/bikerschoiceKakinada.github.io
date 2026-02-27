import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, ChevronRight, ArrowLeft } from "lucide-react";

type Category = { id: string; name: string; order_index: number };
type Item = { id: string; category_id: string; image_url: string; label: string; order_index: number };

const AdminDelivery = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchCategories = async () => {
    const { data } = await supabase.from("delivery_categories").select("*").order("order_index");
    if (data) setCategories(data);
  };

  const fetchItems = async (catId: string) => {
    const { data } = await supabase.from("delivery_items").select("*").eq("category_id", catId).order("order_index");
    if (data) setItems(data);
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { if (selectedCat) fetchItems(selectedCat.id); }, [selectedCat]);

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    await supabase.from("delivery_categories").insert({ name: newCatName.trim(), order_index: categories.length });
    setNewCatName("");
    fetchCategories();
    toast.success("Category added");
  };

  const deleteCategory = async (id: string) => {
    await supabase.from("delivery_categories").delete().eq("id", id);
    if (selectedCat?.id === id) setSelectedCat(null);
    fetchCategories();
    toast.success("Category deleted");
  };

  const renameCategory = async (id: string, name: string) => {
    await supabase.from("delivery_categories").update({ name }).eq("id", id);
    fetchCategories();
  };

  const addItem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !selectedCat) return;
    setUploading(true);
    const file = e.target.files[0];
    const ext = file.name.split(".").pop();
    const path = `delivery/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    await supabase.from("delivery_items").insert({ category_id: selectedCat.id, image_url: data.publicUrl, label: "", order_index: items.length });
    fetchItems(selectedCat.id);
    toast.success("Item added");
    setUploading(false);
    e.target.value = "";
  };

  const deleteItem = async (id: string) => {
    if (!selectedCat) return;
    await supabase.from("delivery_items").delete().eq("id", id);
    fetchItems(selectedCat.id);
    toast.success("Item deleted");
  };

  const updateItemLabel = async (id: string, label: string) => {
    await supabase.from("delivery_items").update({ label }).eq("id", id);
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
          className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button onClick={addCategory} className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs font-heading">
          <Plus size={14} />
        </button>
      </div>
      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-2 bg-card border border-border rounded-lg p-3">
            <input
              type="text"
              defaultValue={cat.name}
              onBlur={(e) => renameCategory(cat.id, e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground focus:outline-none"
            />
            <button onClick={() => setSelectedCat(cat)} className="text-primary"><ChevronRight size={16} /></button>
            <button onClick={() => deleteCategory(cat.id)} className="text-secondary"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      {categories.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No categories yet.</p>}
    </div>
  );
};

export default AdminDelivery;
