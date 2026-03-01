import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import SwipeGallery from "./SwipeGallery";
import { DEFAULT_SIGNATURE_WORK } from "@/lib/mediaDefaults";

type WorkItem = { id: string; image_url: string; label: string; order_index: number };

const SignatureWork = () => {
  const [dbWorks, setDbWorks] = useState<WorkItem[]>([]);
  const [hasDb, setHasDb] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    let active = true;

    const fetchWorks = async () => {
      try {
        const { data, error } = await supabase.from("signature_work").select("*").order("order_index");
        if (!error && active) {
          const mapped = (data || []) as WorkItem[];
          setDbWorks(mapped);
          setHasDb((prev) => (mapped.length > 0 ? true : prev));
        }
      } catch (err) {
        console.error("[SignatureWork] Fetch failed:", err);
      }
    };

    fetchWorks();

    const channel = supabase
      .channel("signature-work-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "signature_work" },
        () => {
          fetchWorks();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const works = hasDb ? dbWorks : DEFAULT_SIGNATURE_WORK;

  return (
    <section id="signature" className="py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl md:text-3xl font-display font-bold text-center mb-2 neon-glow-red">
          Our Signature Custom Work
        </h2>
        <p className="text-center text-muted-foreground text-sm mb-8">Swipe to explore our builds</p>
      </motion.div>

      <SwipeGallery
        images={works.map((w) => w.image_url)}
        renderSlide={(image, index) => (
          <div className="relative rounded-xl overflow-hidden border border-border neon-border-cyan group">
            <img
              src={image}
              alt={works[index].label}
              className="w-full aspect-[4/5] object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/80 to-transparent p-4">
              <span className="font-heading font-semibold text-sm text-primary">{works[index].label}</span>
            </div>
          </div>
        )}
      />
    </section>
  );
};

export default SignatureWork;
