import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { CartItem } from "@/types/pos";

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

export const Cart = ({ items, onUpdateQuantity, onRemoveItem }: CartProps) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[220px]">
        <ShoppingCart className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-foreground">Cart is empty</p>
        <p className="text-xs text-muted-foreground mt-1">Add products to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.product.id}
          className="bg-background border border-border rounded-lg p-3 flex items-center gap-3 hover:border-primary/50 hover:shadow-sm transition-all"
        >
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate leading-tight">
              {item.product.name}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums mt-1">
              ₱{item.product.price.toFixed(2)} × {item.quantity}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>

            <span className="font-bold text-sm min-w-[2rem] text-center tabular-nums text-foreground">
              {item.quantity}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onRemoveItem(item.product.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="text-right min-w-[70px]">
            <p className="text-sm font-bold text-foreground tabular-nums">
              ₱{item.total.toFixed(2)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
