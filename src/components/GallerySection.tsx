import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import SwipeGallery from "./SwipeGallery";
import { DEFAULT_GALLERY_CATEGORIES, DEFAULT_GALLERY_IMAGES } from "@/lib/mediaDefaults";

const categories = ["All", ...DEFAULT_GALLERY_CATEGORIES];

const GallerySection = () => {
  const [filter, setFilter] = useState("All");
  const [dbImages, setDbImages] = useState<{ src: string; cat: string }[]>([]);
  const [hasDb, setHasDb] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    let active = true;

    const fetchImages = async () => {
      try {
        const { data, error } = await supabase.from("gallery").select("*").order("order_index");
        if (!error && active) {
          const mapped = (data || []).map((d) => ({ src: d.image_url, cat: d.category }));
          setDbImages(mapped);
          setHasDb((prev) => (mapped.length > 0 ? true : prev));
        }
      } catch (err) {
        console.error("[GallerySection] Fetch failed:", err);
      }
    };

    fetchImages();

    const channel = supabase
      .channel("gallery-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gallery" },
        () => {
          fetchImages();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const images = hasDb ? dbImages : DEFAULT_GALLERY_IMAGES;
  const filtered = filter === "All" ? images : images.filter((img) => img.cat === filter);

  return (
    <section id="gallery" className="py-16 px-4 bg-surface">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }}>
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
