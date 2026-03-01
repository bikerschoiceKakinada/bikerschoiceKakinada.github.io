import { motion } from "framer-motion";
import type { DeliveryCategory } from "@/hooks/useDeliveryCategories";

interface CategoryGridProps {
  categories: DeliveryCategory[];
  onSelectCategory: (category: DeliveryCategory) => void;
}

const CategoryGrid = ({ categories, onSelectCategory }: CategoryGridProps) => {
  if (categories.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-8">
        No categories available yet. Please check back soon.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
      {categories.map((cat, index) => (
        <motion.button
          key={cat.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          onClick={() => onSelectCategory(cat)}
          className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary transition-colors"
        >
          {cat.icon_url ? (
            <img
              src={cat.icon_url}
              alt={cat.name}
              className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-36 bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-3xl font-display">
                {cat.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="p-3">
            <p className="font-heading font-semibold text-sm text-foreground text-center truncate">
              {cat.name}
            </p>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default CategoryGrid;
