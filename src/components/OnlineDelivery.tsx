import { useState } from "react";
import { motion } from "framer-motion";
import { useDeliveryCategories, type DeliveryCategory } from "@/hooks/useDeliveryCategories";
import { useDeliveryItems } from "@/hooks/useDeliveryItems";
import CategoryGrid from "./CategoryGrid";
import CategoryItems from "./CategoryItems";

const OnlineDelivery = () => {
  const { categories, loading: catsLoading, usingFallback } = useDeliveryCategories();
  const [selectedCategory, setSelectedCategory] = useState<DeliveryCategory | null>(null);
  const { items, loading: itemsLoading } = useDeliveryItems(selectedCategory?.id ?? null, usingFallback);

  return (
    <section id="delivery" className="py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
      >
        <h2 className="text-xl md:text-3xl font-display font-bold text-center mb-2 neon-glow-cyan">
          Online Delivery
        </h2>
        <p className="text-center text-muted-foreground text-sm mb-8">
          {selectedCategory
            ? "Tap an item to order via WhatsApp"
            : "Browse categories and order via WhatsApp"}
        </p>
      </motion.div>

      {catsLoading && (
        <p className="text-muted-foreground text-sm text-center py-8">Loading categories...</p>
      )}

      {!catsLoading && !selectedCategory && (
        <CategoryGrid
          categories={categories}
          onSelectCategory={setSelectedCategory}
        />
      )}

      {selectedCategory && (
        <CategoryItems
          items={items}
          categoryName={selectedCategory.name}
          loading={itemsLoading}
          onBack={() => setSelectedCategory(null)}
        />
      )}
    </section>
  );
};

export default OnlineDelivery;
