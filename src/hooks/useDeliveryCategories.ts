import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
    const fetchCategories = async () => {
      const { data, error: err } = await supabase
        .from("delivery_categories")
        .select("*")
        .order("order_index");

      if (err) {
        setError(err.message);
      } else {
        setCategories(data || []);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}
