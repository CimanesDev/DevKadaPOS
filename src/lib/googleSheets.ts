/**
 * Google Sheets Integration Service
 * 
 * This service communicates with a Google Apps Script Web App
 * that acts as a bridge to Google Sheets.
 * 
 * Setup Instructions:
 * 1. Create a Google Sheet with three tabs: "Products", "Sales", "Stock"
 * 2. Deploy a Google Apps Script (see google-apps-script.js in project root)
 * 3. Get the Web App URL from the deployment
 * 4. Set VITE_GOOGLE_SHEETS_URL in your .env file
 */

import { Product } from "@/types/pos";

const getGoogleSheetsUrl = () => {
  // Check environment variable first, then localStorage
  return (
    import.meta.env.VITE_GOOGLE_SHEETS_URL ||
    localStorage.getItem("googleSheetsUrl") ||
    ""
  );
};

export interface StockUpdate {
  productId: string;
  productName: string;
  quantity: number;
}

export interface SaleRecord {
  transactionId: string;
  timestamp: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  total: number;
  tender: number;
  change: number;
}

/**
 * Record a sale transaction to Google Sheets
 */
export const recordSale = async (sale: SaleRecord): Promise<boolean> => {
  const GOOGLE_SHEETS_URL = getGoogleSheetsUrl();
  if (!GOOGLE_SHEETS_URL) {
    console.warn("Google Sheets URL not configured");
    return false;
  }

  try {
    // Use URL parameters to avoid CORS issues
    const encodedData = encodeURIComponent(JSON.stringify(sale));
    const url = `${GOOGLE_SHEETS_URL}?action=recordSale&data=${encodedData}`;
    
    const response = await fetch(url, {
      method: "POST",
      mode: "no-cors", // Google Apps Script handles this
    });

    // With no-cors, we can't read response, but request should succeed
    return true;
  } catch (error) {
    console.error("Error recording sale:", error);
    return false;
  }
};

/**
 * Update stock quantities for multiple products
 */
export const updateStock = async (updates: StockUpdate[]): Promise<boolean> => {
  const GOOGLE_SHEETS_URL = getGoogleSheetsUrl();
  if (!GOOGLE_SHEETS_URL) {
    console.warn("Google Sheets URL not configured");
    return false;
  }

  try {
    // Use URL parameters to avoid CORS issues
    const encodedData = encodeURIComponent(JSON.stringify({ updates }));
    const url = `${GOOGLE_SHEETS_URL}?action=updateStock&data=${encodedData}`;
    
    const response = await fetch(url, {
      method: "POST",
      mode: "no-cors", // Google Apps Script handles this
    });

    // With no-cors, we can't read response, but request should succeed
    return true;
  } catch (error) {
    console.error("Error updating stock:", error);
    return false;
  }
};

/**
 * Get all products from Google Sheets
 */
export const getProducts = async (): Promise<Product[]> => {
  const GOOGLE_SHEETS_URL = getGoogleSheetsUrl();
  if (!GOOGLE_SHEETS_URL) {
    console.warn("Google Sheets URL not configured");
    return [];
  }

  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getProducts`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const products = result.products || [];
    
    console.log(`Loaded ${products.length} products from Google Sheets:`, products);
    
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

/**
 * Get all products with their current stock from Google Sheets (legacy - for stock only)
 */
export const getProductsWithStock = async (): Promise<Array<{ id: string; stock: number }>> => {
  const GOOGLE_SHEETS_URL = getGoogleSheetsUrl();
  if (!GOOGLE_SHEETS_URL) {
    console.warn("Google Sheets URL not configured");
    return [];
  }

  try {
    const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getStock`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.products || [];
  } catch (error) {
    console.error("Error fetching stock:", error);
    return [];
  }
};

/**
 * Record a complete transaction (sale + stock update)
 */
export const recordTransaction = async (
  sale: SaleRecord,
  stockUpdates: StockUpdate[]
): Promise<{ saleRecorded: boolean; stockUpdated: boolean }> => {
  const [saleRecorded, stockUpdated] = await Promise.all([
    recordSale(sale),
    updateStock(stockUpdates),
  ]);

  // Low stock alerts are automatically checked in updateStock via Google Apps Script
  return { saleRecorded, stockUpdated };
};

