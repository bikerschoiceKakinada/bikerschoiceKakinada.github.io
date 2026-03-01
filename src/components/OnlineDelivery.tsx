import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import helmets from "@/assets/helmets.jpeg";
import tyres from "@/assets/tyres.jpeg";
import { useAutoScrollCarousel } from "@/hooks/use-auto-scroll-carousel";

type Category = { id: string; name: string; order_index: number };
type Item = { id: string; category_id: string; image_url: string; label: string; order_index?: number };

const fallbackCategories: Category[] = [
  { id: "helmets", name: "Helmets", order_index: 0 },
  { id: "tyres", name: "Tyres", order_index: 1 },
];

const fallbackItems: Item[] = [
  {
    id: "helmet-item",
    category_id: "helmets",
    image_url: helmets,
    label: "Premium Helmets Collection",
    order_index: 0,
  },
  {
    id: "tyre-item",
    category_id: "tyres",
    image_url: tyres,
    label: "All Sizes Available",
    order_index: 1,
  },
];

const OnlineDelivery = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [hasDb, setHasDb] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(fallbackCategories[0].id);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data: cats, error: catError } = await supabase.from("delivery_categories").select("*").order("order_index");
      const { data: itms, error: itemError } = await supabase.from("delivery_items").select("*").order("order_index");

      if (!catError && !itemError && cats && cats.length > 0) {
        setCategories(cats);
        setItems(itms || []);
        setHasDb(true);
      }
    };

    fetch();
  }, []);

  const displayCategories = hasDb ? categories : fallbackCategories;
  const displayItems = hasDb ? items : fallbackItems;

  useEffect(() => {
    if (displayCategories.length === 0) return;
    const activeExists = displayCategories.some((cat) => cat.id === activeCategoryId);
    if (!activeExists) {
      setActiveCategoryId(displayCategories[0].id);
    }
  }, [activeCategoryId, displayCategories]);

  const activeItems = useMemo(
    () => displayItems.filter((item) => item.category_id === activeCategoryId),
    [displayItems, activeCategoryId],
  );

  useAutoScrollCarousel(carouselRef, { enabled: activeItems.length > 1, speed: 0.45 });

  return (
    <section id="delivery" className="py-16 px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 className="text-xl md:text-3xl font-display font-bold text-center mb-2 neon-glow-cyan">Online Delivery</h2>
        <p className="text-center text-muted-foreground text-sm mb-8">Browse by category, swipe, and order via WhatsApp</p>
      </motion.div>

      <div className="max-w-5xl mx-auto">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-2">
          {displayCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-heading font-semibold whitespace-nowrap transition-colors ${
                activeCategoryId === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div
          ref={carouselRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 touch-pan-x cursor-grab active:cursor-grabbing scroll-smooth"
        >
          {activeItems.map((item) => (
            <div key={item.id} className="flex-shrink-0 w-72 md:w-80 snap-center bg-card border border-border rounded-xl overflow-hidden">
              <img src={item.image_url} alt={item.label || "Online delivery item"} className="w-full h-56 object-cover" loading="lazy" />
              <div className="p-4">
                {item.label && <p className="text-sm font-heading mb-3">{item.label}</p>}
                <div className="flex gap-2">
                  <a href="https://wa.me/918523876978" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground font-heading font-semibold py-2 rounded-full text-xs hover:scale-105 transition-transform"><MessageCircle size={14} /> WhatsApp</a>
                  <a href="tel:+918523876978" className="flex-1 flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground font-heading font-semibold py-2 rounded-full text-xs hover:scale-105 transition-transform"><Phone size={14} /> Call Now</a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activeItems.length === 0 && (
          <p className="text-muted-foreground text-xs p-4 text-center">No items in this category yet. Please check back soon.</p>
        )}
      </div>
    </section>
  );
};

export default OnlineDelivery;

