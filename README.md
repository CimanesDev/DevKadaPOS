# SSS POS - Sari-Sari Store Point of Sale System

A modern, touch-optimized Point of Sale (POS) system designed specifically for Sari-Sari stores in the Philippines. This system integrates with Google Sheets for inventory management and includes an AI-powered assistant that provides real-time insights via Facebook Messenger.

## 🌟 Features

### Core POS Features
- **Touch-Optimized Interface**: Designed for tablet and mobile use with large, easy-to-tap buttons
- **Real-Time Inventory Management**: Products and stock levels synced with Google Sheets
- **Fast Transaction Processing**: Quick checkout with automatic stock updates
- **Category-Based Product Display**: Organize products by categories (Snacks, Beverages, Cigarettes, etc.)
- **Cart Management**: Add, update quantities, and remove items easily
- **Change Calculation**: Automatic change calculation based on cash tendered

### AI-Powered Assistant
- **Google Gemini Integration**: Natural language processing for intelligent queries
- **Sales Reports**: Ask questions like "How much sales did we get today?"
- **Stock Status**: Get real-time inventory information
- **Low Stock Alerts**: Automatic notifications when products run low
- **Product Information**: Query specific product details
- **Conversational Interface**: Chat naturally with the AI assistant

### Messenger Integration
- **Real-Time Alerts**: Low stock notifications sent directly to Facebook Messenger
- **Alert Mirroring**: The Alert page in the web app reflects what the owner sees in their Messenger chat
- **Automatic Monitoring**: System checks stock levels every 30 seconds
- **Threshold-Based Alerts**: Configurable low stock threshold (default: 5 units)

### Google Sheets Integration
- **Live Data Sync**: All transactions and inventory updates sync to Google Sheets
- **Three-Sheet Structure**: 
  - **Products**: Product catalog with ID, Name, Price, Category, Stock
  - **Sales**: Transaction history with detailed item breakdown
  - **Stock**: Stock movement tracking

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

- "How much sales did we get today?"
- "Show me this week's sales report"
- "What products are low in stock?"
- "How many Coca-Cola do we have?"
- "What's our total revenue this month?"

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

- **Automatic Alerts**: When stock falls below the threshold (default: 5 units), the system automatically sends a Messenger alert
- **Alert Mirroring**: The Alerts page in the web app shows the same messages you receive in Messenger
- **Real-Time Sync**: Both Messenger and the web app receive alerts simultaneously
- **AI Responses**: When you chat with the AI in Messenger, those conversations also appear in the web app's Alerts page

**Note**: The Alerts page is a live reflection of your Messenger chat. Any low stock alerts, AI responses, or notifications you receive in Messenger will appear in the web app, and vice versa.

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

1. **Select Products**: Tap products from the grid to add them to the cart
2. **Review Cart**: Check items and quantities in the transaction panel
3. **Enter Payment**: Type the cash amount in the "Cash Tendered" field
4. **Complete Sale**: Click "Complete Sale" to process the transaction
5. **Automatic Updates**: Stock levels update automatically in Google Sheets

### Viewing Alerts

1. Click the **"Alerts"** button in the header
2. View all low stock alerts and AI chat messages
3. The page shows the same content as your Messenger chat
4. Chat with the AI assistant directly from the web interface

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

## 🎯 Future Enhancements

- [ ] Multi-store support
- [ ] Advanced reporting and analytics
- [ ] Barcode scanning
- [ ] Receipt printing
- [ ] Customer management
- [ ] Loyalty programs
- [ ] Multi-language support (Tagalog, English)

---

**Built with ❤️ for Sari-Sari store owners in the Philippines**

