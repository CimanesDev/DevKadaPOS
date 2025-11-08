/**
 * Google Apps Script for POS System - TEMPLATE
 * 
 * ⚠️ IMPORTANT: This is a template file. Copy this to google-apps-script.js
 * and fill in your actual API keys and tokens. DO NOT commit google-apps-script.js
 * to GitHub as it contains sensitive information.
 * 
 * Setup Instructions:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Copy the code from google-apps-script.js (your actual file with keys)
 * 4. Update the SPREADSHEET_ID variable with your sheet ID
 * 5. (Optional) Configure Messenger API for low stock alerts:
 *    - Get Page Access Token from Facebook Developer Portal
 *    - Get your Page-Scoped ID (PSID)
 *    - Update MESSENGER_PAGE_ACCESS_TOKEN and MESSENGER_RECIPIENT_PSID below
 *    - See MESSENGER_API_SETUP.md for detailed instructions
 * 6. (Optional) Configure AI Agent:
 *    - Get Gemini API Key from https://makersuite.google.com/app/apikey
 *    - Update GEMINI_API_KEY below
 *    - See AI_AGENT_SETUP.md for detailed instructions
 * 7. Save and deploy as a Web App:
 *    - Click Deploy > New deployment
 *    - Choose "Web app" as type
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    - Click Deploy
 * 8. Copy the Web App URL and use it as VITE_GOOGLE_SHEETS_URL
 * 
 * Sheet Structure Required:
 * - Tab 1: "Products" - Columns: ID, Name, Price, Category, Stock
 * - Tab 2: "Sales" - Columns: Transaction ID, Timestamp, Product ID, Product Name, Quantity, Price, Total, Subtotal, Tender, Change
 * - Tab 3: "Stock" - Columns: Product ID, Product Name, Current Stock, Last Updated
 * 
 * Messenger API Features:
 * - Automatically checks for low stock after each sale
 * - Sends Messenger alerts when stock falls below threshold
 * - Threshold is configurable (default: 5)
 * 
 * AI Agent Features:
 * - Understands natural language queries via Messenger
 * - Generates sales reports
 * - Checks stock status
 * - Creates calendar reminders
 * - Sends email reports
 */

const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE"; // Replace with your Google Sheet ID

// Messenger API Configuration
// Get these from Facebook Developer Portal
const MESSENGER_PAGE_ACCESS_TOKEN = "YOUR_PAGE_ACCESS_TOKEN_HERE"; // Replace with your Page Access Token
const MESSENGER_RECIPIENT_PSID = "YOUR_RECIPIENT_PSID_HERE"; // Replace with recipient's Page-Scoped ID
const LOW_STOCK_THRESHOLD = 5; // Alert when stock is at or below this number

// AI Agent Configuration
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"; // Get from https://makersuite.google.com/app/apikey
const VERIFY_TOKEN = "YOUR_VERIFY_TOKEN_HERE"; // Random string for webhook verification
const AI_MODEL = "gemini-1.5-flash"; // or "gemini-1.5-pro" for better quality

// Email Configuration (for sending reports)
const ADMIN_EMAIL = "YOUR_EMAIL_HERE"; // Email to send reports to

// ... (rest of the code from google-apps-script.js but with placeholder values)

