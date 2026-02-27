import { motion } from "framer-motion";
import { MessageCircle, Phone, HardHat, CircleDot } from "lucide-react";
import helmets from "@/assets/helmets.jpeg";
import tyres from "@/assets/tyres.jpeg";

const categories = [
  {
    name: "Helmets",
    icon: HardHat,
    items: [
      { img: helmets, label: "Premium Helmets Collection" },
    ],
  },
  {
    name: "Tyres",
    icon: CircleDot,
    items: [
      { img: tyres, label: "All Sizes Available" },
    ],
  },
];

const OnlineDelivery = () => {
  return (
    <section id="delivery" className="py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-xl md:text-3xl font-display font-bold text-center mb-2 neon-glow-cyan">
          Online Delivery
        </h2>
        <p className="text-center text-muted-foreground text-sm mb-8">Browse & order via WhatsApp</p>
      </motion.div>

      <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
        {categories.map((cat, ci) => (
          <motion.div
            key={ci}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: ci * 0.15 }}
            className="bg-card border border-border rounded-xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <cat.icon size={18} className="text-primary" />
              <h3 className="font-heading font-bold text-sm">{cat.name}</h3>
            </div>
            {cat.items.map((item, i) => (
              <div key={i} className="p-4">
                <img src={item.img} alt={item.label} className="w-full h-48 object-cover rounded-lg mb-3" loading="lazy" />
                <p className="text-sm font-heading mb-3">{item.label}</p>
                <div className="flex gap-2">
                  <a
                    href="https://wa.me/918523876978"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground font-heading font-semibold py-2 rounded-full text-xs hover:scale-105 transition-transform"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                  <a
                    href="tel:+918523876978"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground font-heading font-semibold py-2 rounded-full text-xs hover:scale-105 transition-transform"
                  >
                    <Phone size={14} /> Call Now
                  </a>
                </div>
              </div>
            ))}
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default OnlineDelivery;
