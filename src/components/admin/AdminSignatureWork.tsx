import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, GripVertical } from "lucide-react";

type SignatureItem = {
  id: string;
  image_url: string;
  label: string;
  order_index: number;
};

const AdminSignatureWork = () => {
  const [items, setItems] = useState<SignatureItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchItems = async () => {
    const { data } = await supabase.from("signature_work").select("*").order("order_index");
    if (data) setItems(data);
  };

  useEffect(() => { fetchItems(); }, []);

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `signature/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file);
    if (error) { toast.error("Upload failed"); return null; }
    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    const file = e.target.files[0];
    const url = await uploadImage(file);
    if (url) {
      await supabase.from("signature_work").insert({ image_url: url, label: "", order_index: items.length });
      fetchItems();
      toast.success("Added!");
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async (id: string) => {
    await supabase.from("signature_work").delete().eq("id", id);
    fetchItems();
    toast.success("Deleted");
  };

  const handleLabelChange = async (id: string, label: string) => {
    await supabase.from("signature_work").update({ label }).eq("id", id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-base">Signature Work</h2>
        <label className={`flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-heading cursor-pointer ${uploading ? "opacity-50" : ""}`}>
          <Plus size={14} /> Add Image
          <input type="file" accept="image/*" onChange={handleAdd} className="hidden" disabled={uploading} />
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
      {items.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No items yet. Add your first image above.</p>}
    </div>
  );
};

export default AdminSignatureWork;
