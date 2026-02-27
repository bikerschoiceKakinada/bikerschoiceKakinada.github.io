import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import bike1 from "@/assets/bike1.png";
import bike2 from "@/assets/bike2.png";
import bike3 from "@/assets/bike3.png";
import bike4 from "@/assets/bike4.png";
import bike5 from "@/assets/bike5.png";

type WorkItem = { id: string; image_url: string; label: string; order_index: number };

const fallbackWorks = [
  { id: "1", image_url: bike2, label: "Custom Paint & Wrap", order_index: 0 },
  { id: "2", image_url: bike3, label: "Custom Build", order_index: 1 },
  { id: "3", image_url: bike1, label: "LED & Neon Lighting", order_index: 2 },
  { id: "4", image_url: bike5, label: "Touring Setup", order_index: 3 },
  { id: "5", image_url: bike4, label: "Alloy Customization", order_index: 4 },
];

const SignatureWork = () => {
  const [works, setWorks] = useState<WorkItem[]>(fallbackWorks);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("signature_work").select("*").order("order_index");
      if (data && data.length > 0) setWorks(data);
    };
    fetch();
  }, []);

  return (
    <section id="signature" className="py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl md:text-3xl font-display font-bold text-center mb-2 neon-glow-red">
          Our Signature Custom Work
        </h2>
        <p className="text-center text-muted-foreground text-sm mb-8">Swipe to explore our builds</p>
      </motion.div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
        {works.map((w, i) => (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex-shrink-0 w-72 md:w-80 snap-center"
          >
            <div className="relative rounded-xl overflow-hidden border border-border neon-border-cyan group">
              <img src={w.image_url} alt={w.label} className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/80 to-transparent p-4">
                <span className="font-heading font-semibold text-sm text-primary">{w.label}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default SignatureWork;
