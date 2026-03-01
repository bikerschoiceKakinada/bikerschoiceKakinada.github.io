import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import bike1 from "@/assets/bike1.png";
import bike2 from "@/assets/bike2.png";
import bike3 from "@/assets/bike3.png";
import bike4 from "@/assets/bike4.png";
import bike5 from "@/assets/bike5.png";
import helmets from "@/assets/helmets.jpeg";
import tyres from "@/assets/tyres.jpeg";
import SwipeGallery from "./SwipeGallery";

const categories = ["All", "Custom Builds", "LED & Neon", "Wraps & Paint", "Alloy & Tyre", "Before & After", "Workshop"];

const fallbackImages = [
  { src: bike1, cat: "LED & Neon" },
  { src: bike2, cat: "Wraps & Paint" },
  { src: bike3, cat: "Custom Builds" },
  { src: bike4, cat: "LED & Neon" },
  { src: bike5, cat: "Custom Builds" },
  { src: helmets, cat: "Workshop" },
  { src: tyres, cat: "Alloy & Tyre" },
];

const GallerySection = () => {
  const [filter, setFilter] = useState("All");
  const [dbImages, setDbImages] = useState<{ src: string; cat: string }[]>([]);
  const [hasDb, setHasDb] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const fetch = async () => {
      try {
        const { data, error } = await supabase.from("gallery").select("*").order("order_index");
        if (!error && data && data.length > 0) {
          setDbImages(data.map((d) => ({ src: d.image_url, cat: d.category })));
          setHasDb(true);
        }
      } catch (err) {
        console.error("[GallerySection] Fetch failed:", err);
      }
    };

    fetch();
  }, []);

  const images = hasDb ? dbImages : fallbackImages;
  const filtered = filter === "All" ? images : images.filter((img) => img.cat === filter);

  return (
    <section id="gallery" className="py-16 px-4 bg-surface">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 className="text-xl md:text-3xl font-display font-bold text-center mb-6 neon-glow-red">Gallery</h2>
      </motion.div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-2">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)} className={`px-3 py-1.5 rounded-full text-xs font-heading font-semibold whitespace-nowrap transition-colors ${filter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {cat}
          </button>
        ))}
      </div>

      <SwipeGallery
        key={filter}
        images={filtered.map((img) => img.src)}
        alts={filtered.map((img) => `${img.cat} bike modification by Bikers Choice Kakinada`)}
        className="max-w-5xl mx-auto"
      />
    </section>
  );
};

export default GallerySection;
