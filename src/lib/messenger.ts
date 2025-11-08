/**
 * Facebook Messenger API Integration Service
 * 
 * This service sends low stock alerts via Facebook Messenger
 * 
 * Setup Instructions:
 * 1. Create a Facebook Page
 * 2. Create a Facebook App and get Page Access Token
 * 3. Get your Page-Scoped ID (PSID) - the recipient ID
 * 4. Configure in Settings
 */

const getGoogleSheetsUrl = () => {
  return (
    import.meta.env.VITE_GOOGLE_SHEETS_URL ||
    localStorage.getItem("googleSheetsUrl") ||
    ""
  );
};

export interface LowStockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
}

/**
 * Check for low stock and send Messenger alerts
 */
export const checkLowStock = async (threshold: number = 5): Promise<boolean> => {
  const GOOGLE_SHEETS_URL = getGoogleSheetsUrl();
  if (!GOOGLE_SHEETS_URL) {
    console.warn("Google Sheets URL not configured");
    return false;
  }

  try {
    const encodedData = encodeURIComponent(JSON.stringify({ threshold }));
    const url = `${GOOGLE_SHEETS_URL}?action=checkLowStock&data=${encodedData}`;
    
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
    });

    return true;
  } catch (error) {
    console.error("Error checking low stock:", error);
    return false;
  }
};

/**
 * Send a low stock alert via Messenger
 */
export const sendLowStockAlert = async (alert: LowStockAlert): Promise<boolean> => {
  const GOOGLE_SHEETS_URL = getGoogleSheetsUrl();
  if (!GOOGLE_SHEETS_URL) {
    console.warn("Google Sheets URL not configured");
    return false;
  }

  try {
    const encodedData = encodeURIComponent(JSON.stringify(alert));
    const url = `${GOOGLE_SHEETS_URL}?action=sendLowStockAlert&data=${encodedData}`;
    
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
    });

    return true;
  } catch (error) {
    console.error("Error sending low stock alert:", error);
    return false;
  }
};

