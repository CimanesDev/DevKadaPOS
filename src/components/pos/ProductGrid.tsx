import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Product, Category } from "@/types/pos";
import { Loader2, Package } from "lucide-react";

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  onProductSelect: (product: Product) => void;
  isLoading?: boolean;
}

export const ProductGrid = ({ products, categories, onProductSelect, isLoading }: ProductGridProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [flashingProduct, setFlashingProduct] = useState<string | null>(null);

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const handleProductClick = (product: Product) => {
    onProductSelect(product);
    setFlashingProduct(product.id);
    setTimeout(() => setFlashingProduct(null), 200);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-base font-medium text-foreground mb-1">No products found</p>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Configure Google Sheets in settings to load your products
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Category Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 flex-shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          onClick={() => setSelectedCategory("all")}
          className="whitespace-nowrap text-sm h-10 px-5 font-medium"
          size="sm"
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.id)}
            className="whitespace-nowrap text-sm h-10 px-5 font-medium"
            size="sm"
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full">
          <Package className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No products in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 flex-1 overflow-y-auto content-start">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => handleProductClick(product)}
              disabled={product.stock !== undefined && product.stock <= 0}
              className={cn(
                "bg-background border border-border rounded-xl p-4 text-left hover:border-primary hover:shadow-lg transition-all h-[140px] flex flex-col justify-between touch-manipulation active:scale-[0.97]",
                flashingProduct === product.id && "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/30",
                product.stock !== undefined && product.stock <= 0 && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex-1 min-w-0 flex flex-col">
                <p className="font-semibold text-foreground text-base leading-snug line-clamp-2 mb-2">
                  {product.name}
                </p>
                {product.stock !== undefined && (
                  <p
                    className={cn(
                      "text-sm font-medium",
                      product.stock <= 0
                        ? "text-destructive"
                        : product.stock <= 5
                        ? "text-orange-600 dark:text-orange-500"
                        : "text-muted-foreground"
                    )}
                  >
                    Stock: {product.stock}
                  </p>
                )}
              </div>
              <p className="text-lg font-bold text-primary tabular-nums mt-auto">
                ₱{product.price.toFixed(2)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
