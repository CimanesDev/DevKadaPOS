import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CheckoutSummaryProps {
  subtotal: number;
  onTenderChange: (amount: number) => void;
}

export const CheckoutSummary = ({ subtotal, onTenderChange }: CheckoutSummaryProps) => {
  const [tender, setTender] = useState<string>("");
  const change = Math.max(0, parseFloat(tender || "0") - subtotal);

  useEffect(() => {
    onTenderChange(parseFloat(tender || "0"));
  }, [tender, onTenderChange]);

  const handleTenderChange = (value: string) => {
    // Only allow numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setTender(value);
    }
  };

  const handleQuickTenderClick = (amount: number) => {
    const currentAmount = parseFloat(tender || "0");
    const newAmount = currentAmount + amount;
    setTender(newAmount.toString());
  };

  const handleBackClick = () => {
    if (tender.length > 0) {
      const newTender = tender.slice(0, -1);
      setTender(newTender);
    }
  };

  const handleClearClick = () => {
    setTender("");
  };

  const quickTenderAmounts = [5, 10, 20, 50, 100, 200, 500, 1000];

  return (
    <div className="space-y-3">
      {/* Total and Change on one row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 border border-border rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">TOTAL</span>
          <span className="text-lg font-bold text-foreground tabular-nums">
            ₱{subtotal.toFixed(2)}
          </span>
        </div>
        <div className="bg-muted/50 border border-border rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">CHANGE</span>
          <span className="text-lg font-bold text-foreground tabular-nums">
            ₱{change.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Cash Tendered */}
      <div className="space-y-2">
        <div>
          <Label htmlFor="tender" className="text-sm font-medium">
            Cash Tendered
          </Label>
          <Input
            id="tender"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={tender}
            onChange={(e) => handleTenderChange(e.target.value)}
            className="text-lg font-semibold h-11 text-center tabular-nums mt-1.5"
          />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {quickTenderAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => handleQuickTenderClick(amount)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg py-2 text-xs font-semibold transition-colors active:scale-95 shadow-sm"
            >
              ₱{amount}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleBackClick}
            className="bg-background border border-border hover:bg-muted text-foreground rounded-lg py-2 text-sm font-medium transition-colors active:scale-95"
            aria-label="Back"
          >
            ← Back
          </button>
          <button
            onClick={handleClearClick}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg py-2 text-sm font-medium transition-colors active:scale-95"
            aria-label="Clear"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};
