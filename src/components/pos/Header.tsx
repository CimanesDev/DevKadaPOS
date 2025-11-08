import { useState, useEffect } from "react";
import { Wifi, WifiOff, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GoogleSheetsSetup } from "./GoogleSheetsSetup";

export const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>Configure your POS system settings</DialogDescription>
            </DialogHeader>
            <GoogleSheetsSetup
              onSave={(url) => {
                setIsSettingsOpen(false);
                window.location.reload();
              }}
              currentUrl={localStorage.getItem("googleSheetsUrl") || undefined}
            />
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
};
