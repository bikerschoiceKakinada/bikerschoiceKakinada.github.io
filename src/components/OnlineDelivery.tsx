import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import helmets from "@/assets/helmets.jpeg";
import tyres from "@/assets/tyres.jpeg";

type Category = { id: string; name: string; order_index: number };
type Item = { id: string; category_id: string; image_url: string; label: string };

const OnlineDelivery = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [hasDb, setHasDb] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data: cats } = await supabase.from("delivery_categories").select("*").order("order_index");
      const { data: itms } = await supabase.from("delivery_items").select("*").order("order_index");
      if (cats && cats.length > 0) {
        setCategories(cats);
        setItems(itms || []);
        setHasDb(true);
      }
    };
    fetch();
  }, []);

  if (!hasDb) {
    // Fallback static content
    return (
      <section id="delivery" className="py-16 px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-xl md:text-3xl font-display font-bold text-center mb-2 neon-glow-cyan">Online Delivery</h2>
          <p className="text-center text-muted-foreground text-sm mb-8">Browse & order via WhatsApp</p>
        </motion.div>
        <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
          {[{ name: "Helmets", img: helmets, label: "Premium Helmets Collection" }, { name: "Tyres", img: tyres, label: "All Sizes Available" }].map((cat, ci) => (
            <motion.div key={ci} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: ci * 0.15 }} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border"><h3 className="font-heading font-bold text-sm">{cat.name}</h3></div>
              <div className="p-4">
                <img src={cat.img} alt={cat.label} className="w-full h-48 object-cover rounded-lg mb-3" loading="lazy" />
                <p className="text-sm font-heading mb-3">{cat.label}</p>
                <div className="flex gap-2">
                  <a href="https://wa.me/918523876978" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground font-heading font-semibold py-2 rounded-full text-xs hover:scale-105 transition-transform"><MessageCircle size={14} /> WhatsApp</a>
                  <a href="tel:+918523876978" className="flex-1 flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground font-heading font-semibold py-2 rounded-full text-xs hover:scale-105 transition-transform"><Phone size={14} /> Call Now</a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="delivery" className="py-16 px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 className="text-xl md:text-3xl font-display font-bold text-center mb-2 neon-glow-cyan">Online Delivery</h2>
        <p className="text-center text-muted-foreground text-sm mb-8">Browse & order via WhatsApp</p>
      </motion.div>
      <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
        {categories.map((cat, ci) => {
          const catItems = items.filter((i) => i.category_id === cat.id);
          return (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: ci * 0.15 }} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border"><h3 className="font-heading font-bold text-sm">{cat.name}</h3></div>
              {catItems.map((item) => (
                <div key={item.id} className="p-4 border-b border-border last:border-0">
                  <img src={item.image_url} alt={item.label} className="w-full h-48 object-cover rounded-lg mb-3" loading="lazy" />
                  {item.label && <p className="text-sm font-heading mb-3">{item.label}</p>}
                  <div className="flex gap-2">
                    <a href="https://wa.me/918523876978" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground font-heading font-semibold py-2 rounded-full text-xs hover:scale-105 transition-transform"><MessageCircle size={14} /> WhatsApp</a>
                    <a href="tel:+918523876978" className="flex-1 flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground font-heading font-semibold py-2 rounded-full text-xs hover:scale-105 transition-transform"><Phone size={14} /> Call Now</a>
                  </div>
                </div>
              ))}
              {catItems.length === 0 && <p className="text-muted-foreground text-xs p-4 text-center">Coming soon</p>}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default OnlineDelivery;
