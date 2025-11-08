import { useState, useEffect } from "react";
import { Wifi, WifiOff, ExternalLink, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const GOOGLE_SHEETS_URL = "https://docs.google.com/spreadsheets/d/1411z-DAy1gvgpSFwDoGVZRxKBycXgKf9c45PEENSBPg/edit?usp=sharing";

interface HeaderProps {
  onNavigateToMessenger?: () => void;
}

export const Header = ({ onNavigateToMessenger }: HeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <header className="bg-card border-b border-border/50 px-6 py-3 flex items-center justify-between h-16 flex-shrink-0 shadow-sm">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-foreground">SSS Point of Sale System</h1>
      </div>

      <div className="flex items-center gap-5">
        <div className="text-right">
          <p className="text-lg font-medium text-foreground tabular-nums">{formatTime(currentTime)}</p>
          <p className="text-xs text-muted-foreground">{formatDate(currentTime)}</p>
        </div>

        <div className="flex items-center gap-2 border border-border/50 px-3 py-1.5 rounded-lg">
          {isOnline ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
              <span className="text-xs font-medium text-green-600 dark:text-green-500">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-destructive" />
              <span className="text-xs font-medium text-destructive">Offline</span>
            </>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => window.open(GOOGLE_SHEETS_URL, "_blank", "noopener,noreferrer")}
        >
          <span className="text-xs">View Spreadsheet</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>

        {onNavigateToMessenger && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onNavigateToMessenger}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="text-xs">Alerts</span>
          </Button>
        )}
      </div>
    </header>
  );
};
