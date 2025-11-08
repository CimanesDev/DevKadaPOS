import { Button } from "@/components/ui/button";
import { ShoppingCart, XCircle } from "lucide-react";

interface ActionButtonsProps {
  onCompleteSale: () => void;
  onCancelTransaction: () => void;
  disabled: boolean;
}

export const ActionButtons = ({
  onCompleteSale,
  onCancelTransaction,
  disabled,
}: ActionButtonsProps) => {
  return (
    <div className="flex gap-2">
      <Button
        onClick={onCompleteSale}
        disabled={disabled}
        size="lg"
        className="flex-1 h-12 text-base font-semibold shadow-md"
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        Complete Sale
      </Button>

      <Button
        onClick={onCancelTransaction}
        disabled={disabled}
        variant="outline"
        size="icon"
        className="h-12 w-12"
      >
        <XCircle className="h-5 w-5" />
      </Button>
    </div>
  );
};
