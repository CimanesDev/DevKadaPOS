# SSS POS - Sari-Sari Store Point of Sale System

A modern, touch-optimized Point of Sale (POS) system designed specifically for Sari-Sari stores in the Philippines. This system integrates with Google Sheets for inventory management and includes an AI-powered assistant that provides real-time insights via Facebook Messenger.

## 🌟 Features

### Core POS Features
- **Touch-Optimized Interface**: Designed for tablet and mobile use with large, easy-to-tap buttons
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-Time Inventory Management**: Products and stock levels synced with Google Sheets
- **Fast Transaction Processing**: Quick checkout with automatic stock updates
- **Category-Based Product Display**: Organize products by categories (Snacks, Beverages, Cigarettes, Groceries, Personal Care, etc.)
- **Smart Cart Management**: 
  - Add products with a single tap
  - Update quantities with +/- buttons
  - Remove items easily
  - Real-time subtotal calculation
- **Stock Validation**: Prevents selling out-of-stock items and alerts when stock is insufficient
- **Change Calculation**: Automatic change calculation based on cash tendered
- **Transaction History**: All sales automatically recorded to Google Sheets
- **Direct Spreadsheet Access**: "View Spreadsheet" button opens your Google Sheet in a new tab to see live data

### AI-Powered Assistant (Google Gemini)
- **Natural Language Processing**: Ask questions in plain English
- **Sales Analytics**: 
  - "How much sales did we get today?"
  - "Show me this week's sales report"
  - "What's our total revenue this month?"
- **Stock Intelligence**:
  - "What products are low in stock?"
  - "How many Coca-Cola do we have?"
  - "Show me stock status"
- **Product Information**: Query specific product details by name
- **Conversational Interface**: Chat naturally with the AI assistant
- **Intent Recognition**: Understands context and provides relevant answers
- **Multi-Period Reports**: Supports today, week, and month timeframes
- **Web Chat Interface**: Chat with AI directly from the web app
- **Messenger Integration**: Same AI assistant available via Facebook Messenger

### Messenger Integration & Alert System
- **Dual Interface**: The **Alerts page** in the web app is a live mirror of your Facebook Messenger chat
- **Real-Time Alert Sync**: Low stock notifications appear simultaneously in both Messenger and the web app
- **Automatic Low Stock Detection**: 
  - Monitors stock levels every 30 seconds
  - Checks on initial page load
  - Triggers alerts immediately after sales when stock drops below threshold
- **Smart Alert Deduplication**: Each product shows only one alert (prevents spam)
- **Threshold-Based Alerts**: Configurable low stock threshold (default: 5 units)
- **Urgency Indicators**: 
  - 🚨 OUT OF STOCK (0 units)
  - ⚠️ CRITICAL (1-2 units)
  - ⚠️ LOW STOCK (3-5 units)
- **Alert History**: View all past alerts with timestamps
- **Manual Refresh**: Refresh button to manually check for new alerts
- **Chat History**: All AI conversations from Messenger appear in the web app

### Google Sheets Integration
- **Live Data Sync**: All transactions and inventory updates sync in real-time
- **Three-Sheet Structure**: 
  - **Products**: Product catalog with ID, Name, Price, Category, Stock
  - **Sales**: Complete transaction history with detailed item breakdown, timestamps, and payment info
  - **Stock**: Stock movement tracking with last updated timestamps
- **Automatic Stock Updates**: Stock levels decrease automatically when sales are completed
- **Transaction Recording**: Every sale is logged with full details
- **Data Persistence**: All data stored securely in Google Sheets
- **Easy Access**: Direct link to spreadsheet from the POS interface

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Google account with access to Google Sheets
- (Optional) Facebook Developer account for Messenger integration
- (Optional) Google Gemini API key for AI features

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sari-swift-till
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Google Sheets**
   - Create a new Google Sheet with three tabs: "Products", "Sales", "Stock"
   - Set up the Products sheet with columns: ID, Name, Price, Category, Stock
   - Copy the Google Apps Script code from `google-apps-script.js` to your sheet's Apps Script editor
   - Deploy as a Web App (see [Google Sheets Setup](#google-sheets-setup))

4. **Configure environment variables**
   - Create a `.env` file in the root directory:
   ```env
   VITE_GOOGLE_SHEETS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

## 📋 Google Sheets Setup

### Step 1: Create Your Google Sheet

Create a new Google Sheet with the following structure:

**Products Tab:**
| ID | Name | Price | Category | Stock |
|----|------|-------|----------|-------|
| p1 | Coca-Cola 8oz | 15 | drinks | 52 |
| p2 | Royal 8oz | 15 | drinks | 38 |

**Sales Tab:** (Auto-created, but headers should be)
| Transaction ID | Timestamp | Product ID | Product Name | Quantity | Price | Total | Subtotal | Tender | Change |

**Stock Tab:** (Auto-created, but headers should be)
| Product ID | Product Name | Current Stock | Last Updated |

### Step 2: Deploy Google Apps Script

1. Open your Google Sheet
2. Go to **Extensions > Apps Script**
3. Paste the entire contents of `google-apps-script.js`
4. Update the `SPREADSHEET_ID` variable with your sheet ID (found in the URL)
5. (Optional) Configure Messenger API credentials if you want Messenger alerts
6. (Optional) Add your Google Gemini API key for AI features
7. Click **Deploy > New deployment**
8. Choose **Web app** as the type
9. Set **Execute as**: Me
10. Set **Who has access**: Anyone
11. Click **Deploy**
12. Copy the Web App URL and use it as `VITE_GOOGLE_SHEETS_URL` in your `.env` file

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_GOOGLE_SHEETS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## 🤖 AI Assistant Setup (Optional)

The AI assistant uses Google Gemini to understand natural language queries and provide intelligent responses about your store data.

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the API key

### Configuring Gemini in Google Apps Script

1. Open your Google Apps Script editor
2. Find the `GEMINI_API_KEY` variable
3. Paste your API key:
   ```javascript
   const GEMINI_API_KEY = "YOUR_API_KEY_HERE";
   ```
4. Save the script

### Example Queries

Once configured, you can ask the AI assistant questions like:

**Sales Questions:**
- "How much sales did we get today?"
- "Show me today's sales report"
- "What's our total revenue this week?"
- "How many transactions did we have this month?"

**Stock Questions:**
- "What products are low in stock?"
- "Show me stock status"
- "How many Coca-Cola do we have?"
- "Which products are out of stock?"
- "Check low stock items"

**Product Questions:**
- "Tell me about Coca-Cola"
- "What's the price of Royal?"
- "How much stock do we have for Piattos?"

**General Questions:**
- "What can you help me with?"
- "Give me a summary of today's business"
- "What do I need to restock?"

## 📱 Messenger Integration (Optional)

The system can send low stock alerts directly to your Facebook Messenger. The **Alerts page** in the web app mirrors what you see in your Messenger chat, showing all the same notifications and AI responses.

### Setup Instructions

1. **Create a Facebook Page** (if you don't have one)
2. **Create a Facebook App**:
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app
   - Add Messenger product
3. **Get Page Access Token**:
   - In your app, go to Messenger > Settings
   - Generate a token for your page
   - Copy the Page Access Token
4. **Get Your PSID** (Page-Scoped ID):
   - Send a message to your page
   - Use Facebook's Graph API Explorer or a webhook to get your PSID
5. **Configure in Google Apps Script**:
   ```javascript
   const MESSENGER_PAGE_ACCESS_TOKEN = "YOUR_PAGE_ACCESS_TOKEN";
   const MESSENGER_RECIPIENT_PSID = "YOUR_PSID";
   ```

### How It Works

**Alert System:**
- **Automatic Detection**: When stock falls below the threshold (default: 5 units), the system automatically detects it
- **Multi-Trigger Points**:
  - After each sale completion
  - On initial page load (checks all products)
  - Every 30 seconds (automatic periodic check)
- **Deduplication**: Each product shows only one alert to prevent spam
- **Dual Delivery**: Alerts are sent to both Messenger (if configured) and appear in the web app

**Alert Mirroring:**
- **Live Reflection**: The Alerts page in the web app is a real-time mirror of your Messenger chat
- **Synchronized Content**: 
  - Low stock alerts appear in both places simultaneously
  - AI chat conversations from Messenger appear in the web app
  - Web app chat conversations can also be viewed in Messenger
- **Unified Experience**: Whether you check Messenger on your phone or the Alerts page on your computer, you see the same information

**AI Chat Integration:**
- **Web Interface**: Chat with AI directly from the Alerts page
- **Messenger Interface**: Same AI available via Facebook Messenger
- **Shared Context**: Conversations are accessible from both interfaces
- **Real-Time Responses**: AI queries your Google Sheets data and provides instant answers

**Important Note**: The Alerts page is designed to reflect what the store owner sees in their Messenger chat. This allows you to monitor your store's alerts and chat with the AI assistant from any device, whether you're using the web app or checking Messenger on your phone. The system ensures you never miss important low stock notifications.

## 🏗️ Project Structure

```
sari-swift-till/
├── src/
│   ├── components/
│   │   ├── pos/
│   │   │   ├── ActionButtons.tsx      # Complete/Cancel transaction buttons
│   │   │   ├── Cart.tsx                # Shopping cart display
│   │   │   ├── CheckoutSummary.tsx     # Payment and change calculation
│   │   │   ├── GoogleSheetsSetup.tsx   # Configuration UI (removed from main UI)
│   │   │   ├── Header.tsx              # Top navigation bar
│   │   │   ├── MessengerChat.tsx       # AI chat interface & alert display
│   │   │   └── ProductGrid.tsx         # Product display with categories
│   │   └── ui/                         # Reusable UI components (shadcn/ui)
│   ├── hooks/
│   │   └── useProducts.ts              # Product data fetching hook
│   ├── lib/
│   │   ├── googleSheets.ts             # Google Sheets API integration
│   │   ├── messenger.ts                # Messenger API integration
│   │   └── utils.ts                    # Utility functions
│   ├── pages/
│   │   ├── Index.tsx                   # Main POS interface
│   │   └── Messenger.tsx               # Alerts/Messenger page
│   ├── types/
│   │   └── pos.ts                      # TypeScript type definitions
│   ├── data/
│   │   └── products.ts                 # Product categories
│   ├── App.tsx                          # Main app component with routing
│   ├── main.tsx                         # Application entry point
│   ├── index.css                        # Global styles (TailwindCSS)
│   └── vite-env.d.ts                    # Vite environment types
├── google-apps-script.js                # Google Apps Script for backend
├── index.html                           # HTML template
├── package.json                         # Dependencies and scripts
├── tsconfig.json                        # TypeScript configuration
├── vite.config.ts                       # Vite build configuration
├── tailwind.config.js                   # TailwindCSS configuration
└── README.md                            # This file
```

## 🎨 Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS with custom theme
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)
- **Backend**: Google Apps Script
- **AI**: Google Gemini 2.5 Flash
- **Data Storage**: Google Sheets
- **Messaging**: Facebook Messenger API

## 📖 Usage Guide

### Making a Sale

1. **Select Products**: 
   - Tap products from the grid to add them to the cart
   - Products are organized by categories (use category filter)
   - Out-of-stock items are disabled
2. **Review Cart**: 
   - Check items and quantities in the transaction panel (right side)
   - Update quantities using +/- buttons
   - Remove items with the X button
   - View real-time subtotal
3. **Enter Payment**: 
   - Type the cash amount in the "Cash Tendered" field
   - Change is calculated automatically
   - System validates that cash is sufficient
4. **Complete Sale**: 
   - Click "Complete Sale" to process the transaction
   - Transaction is recorded to Google Sheets
   - Stock levels update automatically
   - Low stock alerts trigger if stock falls below threshold
5. **Automatic Updates**: 
   - Stock decreases in Google Sheets
   - Sale is logged in Sales tab
   - Stock movement tracked in Stock tab
   - Low stock alerts sent to Messenger (if configured)

### Viewing Alerts & Chatting with AI

1. **Access Alerts Page**:
   - Click the **"Alerts"** button in the header (MessageSquare icon)
   - Navigate to the dedicated Alerts/Messenger page

2. **Understanding the Alert Page**:
   - **Purpose**: This page reflects what the store owner sees in their Facebook Messenger chat
   - **Live Mirror**: All low stock alerts, AI responses, and notifications that appear in Messenger also appear here
   - **Real-Time Sync**: Updates happen automatically as events occur

3. **Viewing Alerts**:
   - Low stock alerts appear as chat messages with product details
   - Alerts are grouped by date with timestamps
   - Each product shows only one alert (no duplicates)
   - Urgency levels are clearly indicated (OUT OF STOCK, CRITICAL, LOW STOCK)

4. **Chatting with AI**:
   - Type your question in the input field at the bottom of the page
   - Press Enter or click the Send button
   - AI responds with real-time data from your Google Sheets
   - Loading indicator shows while AI processes your request
   - Chat history is preserved and grouped by date

5. **Example Questions You Can Ask**:
   - "How much sales did we get today?"
   - "Show me this week's sales report"
   - "What products are low in stock?"
   - "How many Coca-Cola do we have?"
   - "What's our total revenue this month?"
   - "Which products need restocking?"

6. **Automatic Monitoring**:
   - System automatically checks for low stock every 30 seconds
   - New alerts appear in real-time
   - Click "Refresh" button to manually check for alerts
   - Initial load checks all products for low stock

### Accessing Spreadsheet

1. Click **"View Spreadsheet"** in the header
2. Opens your Google Sheet in a new tab
3. See real-time updates to Products, Sales, and Stock tabs

## 🔧 Configuration

### Low Stock Threshold

Default threshold is 5 units. To change:

1. Open `google-apps-script.js`
2. Find `const LOW_STOCK_THRESHOLD = 5;`
3. Change to your desired value
4. Save and redeploy

### Product Categories

Categories are defined in `src/data/products.ts`. To add or modify:

```typescript
export const categories: Category[] = [
  { id: "all", name: "All Products" },
  { id: "snacks", name: "Snacks" },
  // Add more categories...
];
```

## 🚢 Deployment

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

### Deploying to Vercel/Netlify

1. Push your code to GitHub
2. Connect your repository to Vercel or Netlify
3. Set environment variables:
   - `VITE_GOOGLE_SHEETS_URL`
4. Deploy

### Deploying to GitHub Pages

1. Install `gh-pages`: `npm install --save-dev gh-pages`
2. Add to `package.json`:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```
3. Run: `npm run deploy`

## 🐛 Troubleshooting

### Products Not Loading

- Check that `VITE_GOOGLE_SHEETS_URL` is set correctly
- Verify Google Apps Script is deployed and accessible
- Check browser console for errors
- Ensure Google Sheet has a "Products" tab with proper headers

### CORS Errors

- Make sure Google Apps Script is deployed as "Web app" with "Anyone" access
- Verify the Web App URL is correct
- Check that `processMessage` is added to `doGet()` function in Apps Script

### AI Chat Not Working

- Verify Gemini API key is set in Google Apps Script
- Check that `processMessage` action is supported in `doGet()`
- Ensure API key has proper permissions
- Check Apps Script execution logs for errors

### Messenger Alerts Not Appearing

- Verify Messenger API credentials are correct
- Check that PSID is valid
- Ensure Page Access Token hasn't expired
- Verify low stock threshold is configured correctly

### Build Errors

- Run `npm install` to ensure all dependencies are installed
- Check TypeScript errors: `npm run build`
- Verify all environment variables are set

## 📝 License

This project is open source and available for use.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions:
- Check the troubleshooting section above
- Review the Google Apps Script logs
- Check browser console for errors

## 🔄 Real-Time Features

### Automatic Stock Monitoring
- **Continuous Monitoring**: System checks stock levels every 30 seconds
- **Sale-Triggered Checks**: Immediately after each sale completion
- **Initial Load Check**: Scans all products when the page first loads
- **Smart Deduplication**: Prevents duplicate alerts for the same product

### Live Data Synchronization
- **Instant Updates**: Stock changes reflect immediately in Google Sheets
- **Transaction Logging**: Every sale is recorded with full details
- **Bidirectional Sync**: Changes in Google Sheets appear in the POS system
- **No Manual Refresh Needed**: Data updates automatically

### Alert System
- **Multi-Channel Delivery**: Alerts appear in both Messenger and web app
- **Urgency Classification**: Different alert levels based on stock quantity
- **Historical Tracking**: All alerts are saved with timestamps
- **Owner Visibility**: Alerts page shows exactly what owner sees in Messenger

## 🎯 Future Enhancements

- [ ] Multi-store support
- [ ] Advanced reporting and analytics with charts
- [ ] Barcode scanning for faster product entry
- [ ] Receipt printing functionality
- [ ] Customer management system
- [ ] Loyalty programs and customer rewards
- [ ] Multi-language support (Tagalog, English)
- [ ] Voice commands for hands-free operation
- [ ] Offline mode with sync when online
- [ ] Export reports to PDF/Excel

---

**Built with ❤️ for Sari-Sari store owners in the Philippines**

