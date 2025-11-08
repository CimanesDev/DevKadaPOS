import { useState, useCallback, useEffect } from "react";
import { Header } from "@/components/pos/Header";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { Cart } from "@/components/pos/Cart";
import { CheckoutSummary } from "@/components/pos/CheckoutSummary";
import { ActionButtons } from "@/components/pos/ActionButtons";
import { categories } from "@/data/products";
import { Product, CartItem } from "@/types/pos";
import { toast } from "sonner";
import { useProducts } from "@/hooks/useProducts";
import { recordTransaction } from "@/lib/googleSheets";
import { LowStockAlert } from "@/lib/messenger";

interface IndexProps {
  onNavigateToMessenger?: () => void;
}

const Index = ({ onNavigateToMessenger }: IndexProps) => {
  const { products, isLoading, updateProductStock } = useProducts();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [tender, setTender] = useState<number>(0);
  const [checkedLowStock, setCheckedLowStock] = useState(false);

  const handleProductSelect = useCallback(
    (product: Product) => {
      // Check stock availability
      if (product.stock !== undefined && product.stock <= 0) {
        toast.error("Out of stock", {
          description: `${product.name} is currently out of stock`,
        });
        return;
      }

      setCartItems((prev) => {
        const existingItem = prev.find((item) => item.product.id === product.id);
        const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

        // Check if adding would exceed stock
        if (product.stock !== undefined && newQuantity > product.stock) {
          toast.error("Insufficient stock", {
            description: `Only ${product.stock} available in stock`,
          });
          return prev;
        }

        if (existingItem) {
          return prev.map((item) =>
            item.product.id === product.id
              ? {
                  ...item,
                  quantity: newQuantity,
                  total: newQuantity * product.price,
                }
              : item
          );
        }
        return [
          ...prev,
          {
            product,
            quantity: 1,
            total: product.price,
          },
        ];
      });
    },
    []
  );

  const handleUpdateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
        return;
      }

      const product = products.find((p) => p.id === productId);
      if (product?.stock !== undefined && quantity > product.stock) {
        toast.error("Insufficient stock", {
          description: `Only ${product.stock} available in stock`,
        });
        return;
      }

      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity,
                total: quantity * item.product.price,
              }
            : item
        )
      );
    },
    [products]
  );

  const handleRemoveItem = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const change = Math.max(0, tender - subtotal);

  const handleCompleteSale = async () => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty", {
        description: "Add items to complete a sale",
      });
      return;
    }

    if (tender < subtotal) {
      toast.error("Insufficient payment", {
        description: "Cash tendered is less than total amount",
      });
      return;
    }

    const transactionId = `TXN-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Prepare sale record
    const saleRecord = {
      transactionId,
      timestamp,
      items: cartItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        total: item.total,
      })),
      subtotal,
      total: subtotal,
      tender,
      change,
    };

    // Prepare stock updates
    const stockUpdates = cartItems.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
    }));

    // Record transaction to Google Sheets
    const toastId = toast.loading("Processing sale...", {
      description: "Recording transaction and updating stock",
    });

    try {
      const result = await recordTransaction(saleRecord, stockUpdates);

      if (result.saleRecorded && result.stockUpdated) {
        // Update local stock and check for low stock alerts
        const LOW_STOCK_THRESHOLD = 5;
        stockUpdates.forEach((update) => {
          const product = products.find((p) => p.id === update.productId);
          if (product) {
            const newStock = (product.stock ?? 0) - update.quantity;
            const finalStock = Math.max(0, newStock);
            updateProductStock(update.productId, finalStock);

            // Check if stock is low and trigger alert
            if (finalStock <= LOW_STOCK_THRESHOLD) {
              const alert: LowStockAlert = {
                productId: update.productId,
                productName: update.productName,
                currentStock: finalStock,
                threshold: LOW_STOCK_THRESHOLD,
              };
              
              // Dispatch custom event for Messenger chat
              const event = new CustomEvent("lowStockAlert", { detail: alert });
              window.dispatchEvent(event);
            }
          }
        });

        toast.success("Sale completed!", {
          id: toastId,
          description: `Total: ₱${subtotal.toFixed(2)} | Change: ₱${change.toFixed(2)}`,
        });

        // Reset cart
        setCartItems([]);
        setTender(0);
      } else {
        throw new Error("Failed to record transaction");
      }
    } catch (error) {
      console.error("Error completing sale:", error);
      toast.error("Failed to complete sale", {
        id: toastId,
        description: "Please check your Google Sheets configuration",
      });
    }
  };

  const handleCancelTransaction = () => {
    if (cartItems.length === 0) {
      return;
    }

    setCartItems([]);
    setTender(0);
    toast.info("Transaction cancelled", {
      description: "Cart has been cleared",
    });
  };

  // Check for low stock products on initial load
  useEffect(() => {
    if (!isLoading && products.length > 0 && !checkedLowStock) {
      const LOW_STOCK_THRESHOLD = 5;
      products.forEach((product) => {
        if (product.stock !== undefined && product.stock <= LOW_STOCK_THRESHOLD) {
          const alert: LowStockAlert = {
            productId: product.id,
            productName: product.name,
            currentStock: product.stock,
            threshold: LOW_STOCK_THRESHOLD,
          };
          
          // Dispatch custom event for Messenger chat
          const event = new CustomEvent("lowStockAlert", { detail: alert });
          window.dispatchEvent(event);
        }
      });
      setCheckedLowStock(true);
    }
  }, [products, isLoading, checkedLowStock]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <Header onNavigateToMessenger={onNavigateToMessenger} />

      <main className="flex-1 flex flex-col lg:flex-row gap-3 md:gap-4 p-3 md:p-4 overflow-hidden min-h-0">
        {/* Product Grid - Responsive width */}
        <div className="flex-1 min-w-0 bg-card rounded-xl border border-border shadow-sm p-3 md:p-4 overflow-hidden flex flex-col">
          <ProductGrid
            products={products}
            categories={categories}
            onProductSelect={handleProductSelect}
            isLoading={isLoading}
          />
        </div>

        {/* Transaction Panel - Responsive width with min-width */}
        <div className="w-full lg:w-[400px] xl:w-[450px] 2xl:w-[500px] flex-shrink-0 bg-card rounded-xl border border-border shadow-sm p-3 md:p-4 flex flex-col overflow-hidden min-h-0">
          <h2 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-foreground">Transaction</h2>

          {/* Cart Items - Scrollable */}
          <div className="mb-2 md:mb-3 min-h-[180px] md:min-h-[220px] max-h-[180px] md:max-h-[220px] overflow-y-auto pr-1">
            <Cart
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />
          </div>

          {/* Checkout Summary */}
          <div className="flex-1 flex flex-col min-h-0">
            <CheckoutSummary subtotal={subtotal} onTenderChange={setTender} />

            {/* Action Buttons - Always visible at bottom */}
            <div className="border-t border-border pt-2 md:pt-3 mt-2 md:mt-3 flex-shrink-0">
              <ActionButtons
                onCompleteSale={handleCompleteSale}
                onCancelTransaction={handleCancelTransaction}
                disabled={cartItems.length === 0}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
