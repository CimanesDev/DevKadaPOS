import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessengerChat } from "@/components/pos/MessengerChat";

interface MessengerProps {
  onBack: () => void;
}

const Messenger = ({ onBack }: MessengerProps) => {
  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Messenger Alerts</h1>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        <MessengerChat />
      </div>
    </div>
  );
};

export default Messenger;

