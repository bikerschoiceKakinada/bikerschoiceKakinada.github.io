import { motion } from "framer-motion";
import { useRef } from "react";
import bike1 from "@/assets/bike1.png";
import bike2 from "@/assets/bike2.png";
import bike3 from "@/assets/bike3.png";
import bike4 from "@/assets/bike4.png";
import bike5 from "@/assets/bike5.png";

const works = [
  { img: bike2, label: "Custom Paint & Wrap" },
  { img: bike3, label: "Custom Build" },
  { img: bike1, label: "LED & Neon Lighting" },
  { img: bike5, label: "Touring Setup" },
  { img: bike4, label: "Alloy Customization" },
];

const SignatureWork = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

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

      {/* Swipeable gallery */}
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
        {works.map((w, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex-shrink-0 w-72 md:w-80 snap-center"
          >
            <div className="relative rounded-xl overflow-hidden border border-border neon-border-cyan group">
              <img
                src={w.img}
                alt={w.label}
                className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
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
