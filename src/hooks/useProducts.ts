import { useState, useEffect } from "react";
import { Product } from "@/types/pos";
import { getProducts } from "@/lib/googleSheets";

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const googleSheetsProducts = await getProducts();
        setProducts(googleSheetsProducts);
        console.log(`Loaded ${googleSheetsProducts.length} products from Google Sheets`);
      } catch (error) {
        console.error("Error loading products from Google Sheets:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  const updateProductStock = (productId: string, newStock: number) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === productId
          ? { ...product, stock: newStock }
          : product
      )
    );
  };

  return { products, isLoading, updateProductStock };
};

