import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { DEFAULT_DELIVERY_ITEMS } from "@/lib/mediaDefaults";

export type DeliveryItem = {
  id: string;
  category_id: string;
  image_url: string;
  label: string;
  order_index: number;
  created_at: string;
};

export function useDeliveryItems(categoryId: string | null, useFallback = false) {
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) {
      setItems([]);
      return;
    }

    if (useFallback) {
      const fallbackItems = DEFAULT_DELIVERY_ITEMS[categoryId] || [];
      setItems(
        fallbackItems.map((item, index) => ({
          id: `${categoryId}-${index}`,
          category_id: categoryId,
          image_url: item.image_url,
          label: item.label,
          order_index: item.order_index,
          created_at: "",
        }))
      );
      setError(null);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured() || !supabase) {
      setError("Supabase not configured");
      return;
    }

    let active = true;

    const fetchItems = async () => {
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from("delivery_items")
          .select("*")
          .eq("category_id", categoryId)
          .order("order_index");

        if (!active) return;

        if (err) {
          setError(err.message);
        } else {
          setItems(data || []);
        }
      } catch (err) {
        console.error("[useDeliveryItems] Fetch failed:", err);
        if (active) setError("Failed to load items");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchItems();

    const channel = supabase
      .channel(`delivery-items-${categoryId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_items" },
        (payload) => {
          const newCategory = (payload.new as { category_id?: string })?.category_id;
          const oldCategory = (payload.old as { category_id?: string })?.category_id;
          if (newCategory === categoryId || oldCategory === categoryId) {
            fetchItems();
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [categoryId, useFallback]);

  return { items, loading, error };
}
