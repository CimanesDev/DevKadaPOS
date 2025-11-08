import { useState, useEffect, useRef } from "react";
import { AlertTriangle, Package, TrendingDown, RefreshCw, Send, Loader2 } from "lucide-react";
import { LowStockAlert } from "@/lib/messenger";
import { checkLowStock } from "@/lib/googleSheets";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  type: "alert" | "info" | "system" | "user" | "bot";
  productName?: string;
  currentStock?: number;
  threshold?: number;
  isLoading?: boolean;
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (date: Date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  }
};

const formatLowStockMessage = (alert: LowStockAlert): string => {
  const urgency = alert.currentStock === 0 
    ? "🚨 OUT OF STOCK" 
    : alert.currentStock <= 2 
    ? "⚠️ CRITICAL" 
    : "⚠️ LOW STOCK";
  
  return `${urgency}\n\n${alert.productName} is running low!\n\nCurrent stock: ${alert.currentStock} units\nThreshold: ${alert.threshold} units\n\nPlease restock soon to avoid running out.`;
};

const getGoogleSheetsUrl = () => {
  return (
    import.meta.env.VITE_GOOGLE_SHEETS_URL ||
    localStorage.getItem("googleSheetsUrl") ||
    ""
  );
};

const sendMessageToAI = async (message: string): Promise<string> => {
  const GOOGLE_SHEETS_URL = getGoogleSheetsUrl();
  if (!GOOGLE_SHEETS_URL) {
    throw new Error("Google Sheets URL not configured");
  }

  try {
    // Use URL parameters with GET to avoid CORS preflight issues
    // NOTE: You need to add processMessage support to doGet() in your Google Apps Script
    // Add this in the doGet function after getStockReport:
    // if (action === "processMessage") {
    //   const data = e.parameter.data ? JSON.parse(e.parameter.data) : {};
    //   const result = processUserMessage(data);
    //   return createCorsResponse(JSON.stringify(result));
    // }
    const data = {
      message: message,
      text: message,
      senderId: "web-user",
    };
    const encodedData = encodeURIComponent(JSON.stringify(data));
    
    // Use GET to avoid CORS preflight (requires adding processMessage to doGet)
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=processMessage&data=${encodedData}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // The response should have a 'response' field with the AI's answer
    if (result.success && result.response) {
      return result.response;
    } else if (result.error) {
      throw new Error(result.error);
    } else {
      return "Sorry, I couldn't process that request. Please try again.";
    }
  } catch (error) {
    console.error("Error sending message to AI:", error);
    throw error;
  }
};

export const MessengerChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      text: "👋 Hello! I'm your POS Assistant powered by Google Gemini. I can help you with:\n\n• Sales reports (today, week, month)\n• Stock status and inventory\n• Low stock alerts\n• Product information\n• And more!\n\nAsk me anything about your store data!",
      timestamp: new Date(),
      type: "bot",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [processedAlerts, setProcessedAlerts] = useState<Set<string>>(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSendingMessage) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      text: userMessage,
      timestamp: new Date(),
      type: "user",
    };
    setMessages((prev) => [...prev, userMsg]);

    // Add loading message
    const loadingMsg: ChatMessage = {
      id: `loading-${Date.now()}`,
      text: "Thinking...",
      timestamp: new Date(),
      type: "bot",
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMsg]);

    setIsSendingMessage(true);

    try {
      const response = await sendMessageToAI(userMessage);
      
      // Remove loading message and add bot response
      setMessages((prev) => {
        const withoutLoading = prev.filter((msg) => !msg.isLoading);
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          text: response,
          timestamp: new Date(),
          type: "bot",
        };
        return [...withoutLoading, botMsg];
      });
    } catch (error) {
      // Remove loading message and add error message
      setMessages((prev) => {
        const withoutLoading = prev.filter((msg) => !msg.isLoading);
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          text: "Sorry, I encountered an error. Please try again or check your Google Sheets configuration.",
          timestamp: new Date(),
          type: "bot",
        };
        return [...withoutLoading, errorMsg];
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Fetch low stock alerts from Google Sheets
  const fetchLowStockAlerts = async () => {
    setIsLoading(true);
    try {
      const LOW_STOCK_THRESHOLD = 5;
      const alerts = await checkLowStock(LOW_STOCK_THRESHOLD);
      
      alerts.forEach((alert) => {
        // Create unique key for this alert - use productId only to prevent duplicates
        // This ensures each product only shows one alert, even if stock changes
        const alertKey = alert.productId;
        
        // Only add if we haven't processed this product before
        if (!processedAlerts.has(alertKey)) {
          const newMessage: ChatMessage = {
            id: `alert-${Date.now()}-${alert.productId}`,
            text: formatLowStockMessage(alert),
            timestamp: new Date(),
            type: "alert",
            productName: alert.productName,
            currentStock: alert.currentStock,
            threshold: alert.threshold,
          };
          setMessages((prev) => [...prev, newMessage]);
          setProcessedAlerts((prev) => new Set([...prev, alertKey]));
        }
      });
      
      setIsConnected(true);
    } catch (error) {
      console.error("Error fetching low stock alerts:", error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch low stock alerts on mount
  useEffect(() => {
    fetchLowStockAlerts();
  }, []);

  // Periodically check for low stock (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLowStockAlerts();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Also listen for real-time alerts from sales
  useEffect(() => {
    const handleLowStockAlert = (event: CustomEvent<LowStockAlert>) => {
      const alert = event.detail;
      // Use productId only to prevent duplicate alerts for the same product
      const alertKey = alert.productId;
      
      // Only add if we haven't processed this product before
      if (!processedAlerts.has(alertKey)) {
        const newMessage: ChatMessage = {
          id: `alert-${Date.now()}-${alert.productId}`,
          text: formatLowStockMessage(alert),
          timestamp: new Date(),
          type: "alert",
          productName: alert.productName,
          currentStock: alert.currentStock,
          threshold: alert.threshold,
        };
        setMessages((prev) => [...prev, newMessage]);
        setProcessedAlerts((prev) => new Set([...prev, alertKey]));
      }
    };

    window.addEventListener("lowStockAlert" as any, handleLowStockAlert as EventListener);

    return () => {
      window.removeEventListener("lowStockAlert" as any, handleLowStockAlert as EventListener);
    };
  }, [processedAlerts]);

  const groupedMessages = messages.reduce((groups, message) => {
    const dateKey = message.timestamp.toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {} as Record<string, ChatMessage[]>);

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header - Match main page style */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-foreground font-semibold text-sm">POS Assistant</h2>
            <p className="text-muted-foreground text-xs">
              {isLoading ? "Checking..." : isConnected ? "Active" : "Offline"}
            </p>
          </div>
        </div>
        <button
          onClick={fetchLowStockAlerts}
          disabled={isLoading}
          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 disabled:opacity-50 rounded-lg text-primary text-xs font-medium transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Messages Area - Match main page card style */}
      <div className="flex-1 min-w-0 bg-card rounded-xl border border-border shadow-sm m-3 md:m-4 p-3 md:p-4 overflow-y-auto">
        {Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
          <div key={dateKey}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-muted/60 px-3 py-1 rounded-full border border-border">
                <span className="text-xs text-muted-foreground">
                  {formatDate(new Date(dateKey))}
                </span>
              </div>
            </div>

            {/* Messages for this day */}
            {dayMessages.map((message, index) => {
              const showAvatar = index === 0 || 
                dayMessages[index - 1].type !== message.type ||
                message.timestamp.getTime() - dayMessages[index - 1].timestamp.getTime() > 300000; // 5 minutes

              // User messages (right side)
              if (message.type === "user") {
                return (
                  <div key={message.id} className="flex gap-2 mb-2 justify-end">
                    <div className="flex flex-col max-w-[75%] items-end">
                      <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2">
                        <p className="text-sm whitespace-pre-line">{message.text}</p>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 px-1">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              }

              // Bot/Alert/Info messages (left side)
              if (message.type === "bot" || message.type === "alert" || message.type === "info") {
                return (
                  <div
                    key={message.id}
                    className="flex gap-2 mb-2 justify-start"
                  >
                    {showAvatar ? (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        {message.type === "alert" ? (
                          <AlertTriangle className="h-4 w-4 text-primary-foreground" />
                        ) : message.isLoading ? (
                          <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
                        ) : (
                          <Package className="h-4 w-4 text-primary-foreground" />
                        )}
                      </div>
                    ) : (
                      <div className="w-8 flex-shrink-0" />
                    )}
                    <div className="flex flex-col max-w-[75%]">
                      <div className="bg-muted rounded-lg px-3 py-2 border border-border">
                        {message.isLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <p className="text-sm text-muted-foreground">{message.text}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-foreground whitespace-pre-line">
                            {message.text}
                          </p>
                        )}
                      </div>
                      {!message.isLoading && (
                        <span className="text-xs text-muted-foreground mt-1 px-1">
                          {formatTime(message.timestamp)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              // System messages (centered)
              return (
                <div key={message.id} className="flex gap-2 mb-2 justify-center">
                  <div className="bg-muted/60 px-3 py-1 rounded-full border border-border">
                    <span className="text-xs text-muted-foreground">
                      {message.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input - Match main page style */}
      <div className="bg-card border-t border-border px-4 py-3 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your store... (e.g., 'How much sales did we get today?')"
            disabled={isSendingMessage}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSendingMessage}
            size="icon"
          >
            {isSendingMessage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <TrendingDown className="h-3.5 w-3.5" />
          <span>Powered by Google Gemini AI • Low stock alerts checked every 30 seconds</span>
        </div>
      </div>
    </div>
  );
};

