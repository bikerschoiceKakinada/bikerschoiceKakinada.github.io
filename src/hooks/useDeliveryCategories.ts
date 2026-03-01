import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

export type DeliveryCategory = {
  id: string;
  name: string;
  icon_url: string | null;
  order_index: number;
  created_at: string;
};

export function useDeliveryCategories() {
  const [categories, setCategories] = useState<DeliveryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setError("Supabase not configured");
      setLoading(false);
      return;
    }

    const fetchCategories = async () => {
      try {
        const { data, error: err } = await supabase
          .from("delivery_categories")
          .select("*")
          .order("order_index");

        if (err) {
          setError(err.message);
        } else {
          setCategories(data || []);
        }
      } catch (err) {
        console.error("[useDeliveryCategories] Fetch failed:", err);
        setError("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}
