import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DeliveryItem = {
  id: string;
  category_id: string;
  image_url: string;
  label: string;
  order_index: number;
  created_at: string;
};

export function useDeliveryItems(categoryId: string | null) {
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) {
      setItems([]);
      return;
    }

    const fetchItems = async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("delivery_items")
        .select("*")
        .eq("category_id", categoryId)
        .order("order_index");

      if (err) {
        setError(err.message);
      } else {
        setItems(data || []);
      }
      setLoading(false);
    };

    fetchItems();
  }, [categoryId]);

  return { items, loading, error };
}
