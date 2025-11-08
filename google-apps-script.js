/**
 * Google Apps Script for POS System
 * 
 * Setup Instructions:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Update the SPREADSHEET_ID variable with your sheet ID
 * 5. (Optional) Configure Messenger API for low stock alerts:
 *    - Get Page Access Token from Facebook Developer Portal
 *    - Get your Page-Scoped ID (PSID)
 *    - Update MESSENGER_PAGE_ACCESS_TOKEN and MESSENGER_RECIPIENT_PSID below
 *    - See MESSENGER_API_SETUP.md for detailed instructions
 * 6. Save and deploy as a Web App:
 *    - Click Deploy > New deployment
 *    - Choose "Web app" as type
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    - Click Deploy
 * 7. Copy the Web App URL and use it as VITE_GOOGLE_SHEETS_URL
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
 */

const SPREADSHEET_ID = "1411z-DAy1gvgpSFwDoGVZRxKBycXgKf9c45PEENSBPg"; // Replace with your Google Sheet ID

// Messenger API Configuration
// Get these from Facebook Developer Portal
const MESSENGER_PAGE_ACCESS_TOKEN = "EAAQUoxxQvK4BP2uFXslByVON8YVJbZCaC1d3ZADmV1pKIPr0tvCmtBZCwlP51IPGV3ewAoe0Hx1sN3YKV8NizIPpSXFvCXIMtZCmglsc6TECcyZAtTuqZBZAOkQUdoubF85pHnCcuFTrYcm0ZAmIxC7JC2P0VJg31I3Dq48tLSS3fqyzqOWzJjNZA4O00AmZAc7k3nBt4nrfnApT0Kruv4E8YSL5kd1ZC0ZBuFCsBrGdJ61iyfVGdLkDKNzQTfi2BogZD"; // Replace with your Page Access Token
const MESSENGER_RECIPIENT_PSID = "25057671177227274"; // Replace with recipient's Page-Scoped ID
const LOW_STOCK_THRESHOLD = 5; // Alert when stock is at or below this number

// AI Agent Configuration
const GEMINI_API_KEY = "AIzaSyAmJfQLk4wrLrjhwyYBocBUw8vDclOYb2Q"; // Get from https://makersuite.google.com/app/apikey
const VERIFY_TOKEN = "SSS_POS_AGENT"; // Random string for webhook verification - CHANGE THIS!
const AI_MODEL = "gemini-1.5-flash"; // or "gemini-1.5-pro" for better quality

// Email Configuration (for sending reports)
const ADMIN_EMAIL = "cimanesdev@gmail.com"; // Email to send reports to

function doPost(e) {
  try {
    let data;
    
    // Try to get data from POST body first, then from parameter
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter.data) {
      data = JSON.parse(e.parameter.data);
    } else {
      return createCorsResponse(
        JSON.stringify({ success: false, error: "No data provided" })
      );
    }

    // Check if this is a Facebook Messenger webhook (has 'object' and 'entry' fields)
    if (data.object === "page" && data.entry) {
      // This is a Messenger webhook - handle it directly
      // Process asynchronously and return immediately (Facebook requires quick response)
      handleMessengerWebhookAsync(data);
      return createCorsResponse(JSON.stringify({ success: true }));
    }

    // Otherwise, check for action parameter (for other API calls)
    const action = e.parameter.action;
    let result;

    switch (action) {
      case "recordSale":
        result = recordSale(data);
        break;
      case "updateStock":
        result = updateStock(data.updates);
        // Check for low stock after updating
        if (result.success) {
          checkAndSendLowStockAlerts(data.updates);
        }
        break;
      case "checkLowStock":
        result = checkLowStock(data.threshold || LOW_STOCK_THRESHOLD);
        break;
      case "sendLowStockAlert":
        result = sendMessengerMessage(data);
        break;
      case "webhook":
        // Messenger webhook for AI Agent (legacy support)
        result = handleMessengerWebhook(data);
        break;
      case "processMessage":
        // Process user message with AI
        result = processUserMessage(data);
        break;
      default:
        return createCorsResponse(
          JSON.stringify({ success: false, error: "Invalid action" })
        );
    }

    return createCorsResponse(JSON.stringify(result));
  } catch (error) {
    return createCorsResponse(
      JSON.stringify({ success: false, error: error.toString() })
    );
  }
}

function doGet(e) {
  try {
    // Webhook verification for Messenger
    if (e.parameter["hub.mode"] === "subscribe" && e.parameter["hub.verify_token"] === VERIFY_TOKEN) {
      return ContentService.createTextOutput(e.parameter["hub.challenge"]);
    }

    const action = e.parameter.action;

    if (action === "getProducts") {
      const result = getProducts();
      return createCorsResponse(JSON.stringify(result));
    }

    if (action === "getStock") {
      const result = getStock();
      return createCorsResponse(JSON.stringify(result));
    }

    if (action === "getSalesReport") {
      const result = getSalesReport(e.parameter);
      return createCorsResponse(JSON.stringify(result));
    }

    if (action === "getStockReport") {
      const result = getStockReport();
      return createCorsResponse(JSON.stringify(result));
    }

    return createCorsResponse(
      JSON.stringify({ success: false, error: "Invalid action" })
    );
  } catch (error) {
    return createCorsResponse(
      JSON.stringify({ success: false, error: error.toString() })
    );
  }
}

// Helper function to create CORS-enabled response
function createCorsResponse(content) {
  const output = ContentService.createTextOutput(content);
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function recordSale(sale) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const salesSheet = ss.getSheetByName("Sales") || ss.insertSheet("Sales");

    // Set headers if sheet is empty
    if (salesSheet.getLastRow() === 0) {
      salesSheet.appendRow([
        "Transaction ID",
        "Timestamp",
        "Product ID",
        "Product Name",
        "Quantity",
        "Price",
        "Total",
        "Subtotal",
        "Tender",
        "Change",
      ]);
    }

    // Record each item in the sale
    sale.items.forEach((item) => {
      salesSheet.appendRow([
        sale.transactionId,
        sale.timestamp,
        item.productId,
        item.productName,
        item.quantity,
        item.price,
        item.total,
        sale.subtotal,
        sale.tender,
        sale.change,
      ]);
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function updateStock(updates) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const stockSheet = ss.getSheetByName("Stock") || ss.insertSheet("Stock");
    const productsSheet = ss.getSheetByName("Products") || ss.insertSheet("Products");

    // Set headers if stock sheet is empty
    if (stockSheet.getLastRow() === 0) {
      stockSheet.appendRow(["Product ID", "Product Name", "Current Stock", "Last Updated"]);
    }

    // Set headers if products sheet is empty
    if (productsSheet.getLastRow() === 0) {
      productsSheet.appendRow(["ID", "Name", "Price", "Category", "Stock"]);
    }

    const now = new Date().toISOString();

    updates.forEach((update) => {
      // Find product in Products sheet
      const productData = productsSheet.getDataRange().getValues();
      let productRow = -1;

      for (let i = 1; i < productData.length; i++) {
        if (productData[i][0] === update.productId) {
          productRow = i + 1;
          break;
        }
      }

      // Update or create product stock
      if (productRow > 0) {
        const currentStock = productsSheet.getRange(productRow, 5).getValue() || 0;
        const newStock = Math.max(0, currentStock - update.quantity);
        productsSheet.getRange(productRow, 5).setValue(newStock);
      } else {
        // Product doesn't exist, add it
        productsSheet.appendRow([
          update.productId,
          update.productName,
          "",
          "",
          Math.max(0, -update.quantity),
        ]);
      }

      // Record stock change in Stock sheet
      const stockData = stockSheet.getDataRange().getValues();
      let stockRow = -1;

      for (let i = 1; i < stockData.length; i++) {
        if (stockData[i][0] === update.productId) {
          stockRow = i + 1;
          break;
        }
      }

      if (stockRow > 0) {
        const currentStock = stockSheet.getRange(stockRow, 3).getValue() || 0;
        const newStock = Math.max(0, currentStock - update.quantity);
        stockSheet.getRange(stockRow, 3).setValue(newStock);
        stockSheet.getRange(stockRow, 4).setValue(now);
      } else {
        stockSheet.appendRow([
          update.productId,
          update.productName,
          Math.max(0, -update.quantity),
          now,
        ]);
      }
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// Check for low stock and send Messenger alerts
function checkAndSendLowStockAlerts(updates) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const productsSheet = ss.getSheetByName("Products");
    
    if (!productsSheet || productsSheet.getLastRow() === 0) {
      return;
    }

    const data = productsSheet.getDataRange().getValues();
    const lowStockProducts = [];

    // Check each updated product
    updates.forEach((update) => {
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === update.productId) {
          const currentStock = parseFloat(data[i][4]) || 0;
          if (currentStock <= LOW_STOCK_THRESHOLD && currentStock > 0) {
            lowStockProducts.push({
              productId: String(data[i][0]),
              productName: String(data[i][1]),
              currentStock: currentStock,
              threshold: LOW_STOCK_THRESHOLD,
            });
          }
          break;
        }
      }
    });

    // Send alerts for low stock products
    if (lowStockProducts.length > 0 && MESSENGER_PAGE_ACCESS_TOKEN && MESSENGER_RECIPIENT_PSID) {
      lowStockProducts.forEach((product) => {
        sendLowStockAlertToMessenger(product);
      });
    }

    return { success: true, lowStockCount: lowStockProducts.length };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// Check all products for low stock
function checkLowStock(threshold) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const productsSheet = ss.getSheetByName("Products");
    
    if (!productsSheet || productsSheet.getLastRow() === 0) {
      return { success: true, lowStockProducts: [] };
    }

    const data = productsSheet.getDataRange().getValues();
    const lowStockProducts = [];
    const stockThreshold = threshold || LOW_STOCK_THRESHOLD;

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        const currentStock = parseFloat(data[i][4]) || 0;
        if (currentStock <= stockThreshold && currentStock > 0) {
          lowStockProducts.push({
            productId: String(data[i][0]),
            productName: String(data[i][1]),
            currentStock: currentStock,
            threshold: stockThreshold,
          });
        }
      }
    }

    // Send alerts if Messenger is configured
    if (lowStockProducts.length > 0 && MESSENGER_PAGE_ACCESS_TOKEN && MESSENGER_RECIPIENT_PSID) {
      lowStockProducts.forEach((product) => {
        sendLowStockAlertToMessenger(product);
      });
    }

    return { success: true, lowStockProducts: lowStockProducts };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// Send a low stock alert via Facebook Messenger
function sendLowStockAlertToMessenger(product) {
  try {
    if (!MESSENGER_PAGE_ACCESS_TOKEN || !MESSENGER_RECIPIENT_PSID) {
      return { success: false, error: "Messenger API not configured" };
    }

    const message = `⚠️ LOW STOCK ALERT\n\n` +
      `Product: ${product.productName}\n` +
      `Current Stock: ${product.currentStock}\n` +
      `Threshold: ${product.threshold}\n\n` +
      `Please restock soon!`;

    const payload = {
      recipient: {
        id: MESSENGER_RECIPIENT_PSID,
      },
      message: {
        text: message,
      },
    };

    const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${MESSENGER_PAGE_ACCESS_TOKEN}`;
    
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// Send a custom message via Messenger (for direct calls)
function sendMessengerMessage(data) {
  try {
    if (!MESSENGER_PAGE_ACCESS_TOKEN || !MESSENGER_RECIPIENT_PSID) {
      return { success: false, error: "Messenger API not configured" };
    }

    const message = data.message || 
      `⚠️ LOW STOCK ALERT\n\n` +
      `Product: ${data.productName}\n` +
      `Current Stock: ${data.currentStock}\n` +
      `Threshold: ${data.threshold || LOW_STOCK_THRESHOLD}\n\n` +
      `Please restock soon!`;

    const payload = {
      recipient: {
        id: MESSENGER_RECIPIENT_PSID,
      },
      message: {
        text: message,
      },
    };

    const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${MESSENGER_PAGE_ACCESS_TOKEN}`;
    
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function getProducts() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const productsSheet = ss.getSheetByName("Products") || ss.insertSheet("Products");

    // Set headers if sheet is empty
    if (productsSheet.getLastRow() === 0) {
      productsSheet.appendRow(["ID", "Name", "Price", "Category", "Stock"]);
      return { products: [] };
    }

    const data = productsSheet.getDataRange().getValues();
    const products = [];

    // Skip header row (row 1, index 0)
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        // ID, Name, Price, Category, Stock
        products.push({
          id: String(data[i][0] || ""),
          name: String(data[i][1] || ""),
          price: parseFloat(data[i][2]) || 0,
          category: String(data[i][3] || ""),
          stock: parseFloat(data[i][4]) || 0,
        });
      }
    }

    return { products };
  } catch (error) {
    return { products: [], error: error.toString() };
  }
}

// ============================================
// AI AGENT FUNCTIONS
// ============================================

/**
 * Handle Messenger webhook asynchronously (processes without blocking response)
 */
function handleMessengerWebhookAsync(data) {
  try {
    Logger.log("Webhook received: " + JSON.stringify(data));
    
    if (data.object === "page") {
      data.entry.forEach((entry) => {
        Logger.log("Processing entry: " + JSON.stringify(entry));
        
        if (entry.messaging && entry.messaging.length > 0) {
          const webhookEvent = entry.messaging[0];
          const senderId = webhookEvent.sender.id;
          const message = webhookEvent.message;

          Logger.log("Sender ID: " + senderId);
          Logger.log("Message: " + JSON.stringify(message));

          if (message && message.text) {
            Logger.log("Processing message: " + message.text);
            // Process the message with AI
            const result = processAndRespondToMessage(senderId, message.text);
            Logger.log("Process result: " + JSON.stringify(result));
          } else {
            Logger.log("No text message found in webhook event");
          }
        } else {
          Logger.log("No messaging events found in entry");
        }
      });
    } else {
      Logger.log("Not a page object: " + data.object);
    }
  } catch (error) {
    Logger.log("ERROR handling webhook: " + error.toString());
    Logger.log("Stack: " + error.stack);
  }
}

/**
 * Handle Messenger webhook - receives messages from users
 */
function handleMessengerWebhook(data) {
  try {
    if (data.object === "page") {
      data.entry.forEach((entry) => {
        if (entry.messaging && entry.messaging.length > 0) {
          const webhookEvent = entry.messaging[0];
          const senderId = webhookEvent.sender.id;
          const message = webhookEvent.message;

          if (message && message.text) {
            // Process the message with AI
            processAndRespondToMessage(senderId, message.text);
          }
        }
      });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Process user message with AI and execute actions
 */
function processUserMessage(data) {
  try {
    const message = data.message || data.text;
    const senderId = data.senderId || MESSENGER_RECIPIENT_PSID;

    return processAndRespondToMessage(senderId, message);
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Main AI Agent function - understands intent and executes actions
 */
function processAndRespondToMessage(senderId, userMessage) {
  try {
    Logger.log("Processing message from sender: " + senderId);
    Logger.log("User message: " + userMessage);
    
    // Step 1: Use AI to understand intent
    const intent = understandIntent(userMessage);
    Logger.log("Detected intent: " + JSON.stringify(intent));
    
    // Step 2: Execute action based on intent
    let response = "";
    let actionResult = null;

    switch (intent.action) {
      case "get_sales_report":
        actionResult = getSalesReport({ 
          period: intent.period || "today",
          format: "text"
        });
        response = formatSalesReport(actionResult);
        break;

      case "get_stock_status":
        actionResult = getStockReport();
        response = formatStockReport(actionResult);
        break;

      case "check_low_stock":
        actionResult = checkLowStock(LOW_STOCK_THRESHOLD);
        response = formatLowStockReport(actionResult);
        break;

      case "create_restock_reminder":
        actionResult = createRestockCalendarEvent(intent.productName, intent.date);
        response = `✅ Created calendar reminder for restocking ${intent.productName || "products"} on ${intent.date || "tomorrow"}`;
        break;

      case "send_email_report":
        actionResult = sendEmailReport(intent.period || "today");
        response = `✅ Sales report sent to ${ADMIN_EMAIL}`;
        break;

      case "get_product_info":
        actionResult = getProductInfo(intent.productName);
        response = formatProductInfo(actionResult);
        break;

      default:
        response = "I can help you with:\n• Sales reports\n• Stock status\n• Low stock alerts\n• Calendar reminders\n• Email reports\n\nWhat would you like to know?";
    }

    Logger.log("Generated response: " + response);

    // Step 3: Send response via Messenger
    const sendResult = sendMessengerMessageToUser(senderId, response);
    Logger.log("Send result: " + JSON.stringify(sendResult));

    return { 
      success: true, 
      intent: intent,
      response: response,
      actionResult: actionResult,
      sendResult: sendResult
    };
  } catch (error) {
    Logger.log("ERROR in processAndRespondToMessage: " + error.toString());
    Logger.log("Stack: " + error.stack);
    const errorResult = sendMessengerMessageToUser(senderId, "Sorry, I encountered an error. Please try again.");
    Logger.log("Error message send result: " + JSON.stringify(errorResult));
    return { success: false, error: error.toString() };
  }
}

/**
 * Use Google Gemini API to understand user intent
 */
function understandIntent(userMessage) {
  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
      // Fallback: Simple keyword-based intent detection
      return simpleIntentDetection(userMessage);
    }

    const prompt = `You are an AI assistant for a POS (Point of Sale) system. 
Analyze user messages and determine their intent. Return ONLY a JSON object with this structure:
{
  "action": "action_name",
  "period": "today|week|month" (if relevant),
  "productName": "product name" (if mentioned),
  "date": "date" (if mentioned)
}

Available actions:
- "get_sales_report" - user wants sales data/report
- "get_stock_status" - user wants stock information
- "check_low_stock" - user wants to check low stock items
- "create_restock_reminder" - user wants to schedule a restocking reminder
- "send_email_report" - user wants to email a report
- "get_product_info" - user wants info about a specific product
- "general_query" - general question/chat

Examples:
- "show me today's sales" → {"action": "get_sales_report", "period": "today"}
- "what's low in stock?" → {"action": "check_low_stock"}
- "schedule restock for coca cola tomorrow" → {"action": "create_restock_reminder", "productName": "coca cola", "date": "tomorrow"}
- "send me an email report" → {"action": "send_email_report"}
- "how many coca cola do we have?" → {"action": "get_product_info", "productName": "coca cola"}

User message: "${userMessage}"

Return only the JSON object, no other text.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 150
      }
    };

    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload)
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    const aiResponse = result.candidates[0].content.parts[0].text.trim();
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = aiResponse;
    if (aiResponse.includes("```json")) {
      jsonStr = aiResponse.split("```json")[1].split("```")[0].trim();
    } else if (aiResponse.includes("```")) {
      jsonStr = aiResponse.split("```")[1].split("```")[0].trim();
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    // Fallback to simple detection
    return simpleIntentDetection(userMessage);
  }
}

/**
 * Simple keyword-based intent detection (fallback)
 */
function simpleIntentDetection(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("sales") || lowerMessage.includes("report") || lowerMessage.includes("revenue")) {
    let period = "today";
    if (lowerMessage.includes("week")) period = "week";
    if (lowerMessage.includes("month")) period = "month";
    return { action: "get_sales_report", period: period };
  }
  
  if (lowerMessage.includes("stock") && (lowerMessage.includes("low") || lowerMessage.includes("check"))) {
    return { action: "check_low_stock" };
  }
  
  if (lowerMessage.includes("stock") || lowerMessage.includes("inventory")) {
    return { action: "get_stock_status" };
  }
  
  if (lowerMessage.includes("remind") || lowerMessage.includes("schedule") || lowerMessage.includes("calendar")) {
    return { action: "create_restock_reminder", date: "tomorrow" };
  }
  
  if (lowerMessage.includes("email") && lowerMessage.includes("report")) {
    return { action: "send_email_report", period: "today" };
  }
  
  return { action: "general_query" };
}

/**
 * Get sales report from Google Sheets
 */
function getSalesReport(params) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const salesSheet = ss.getSheetByName("Sales");
    
    if (!salesSheet || salesSheet.getLastRow() === 0) {
      return { sales: [], total: 0, count: 0 };
    }

    const data = salesSheet.getDataRange().getValues();
    const period = params.period || "today";
    const now = new Date();
    let startDate = new Date();

    // Calculate date range
    if (period === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(now.getMonth() - 1);
    }

    const sales = [];
    let totalRevenue = 0;
    let transactionCount = 0;
    const transactions = new Set();

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const timestamp = new Date(data[i][1]);
      if (timestamp >= startDate) {
        const transactionId = data[i][0];
        const subtotal = parseFloat(data[i][7]) || 0;
        
        if (!transactions.has(transactionId)) {
          transactions.add(transactionId);
          transactionCount++;
          totalRevenue += subtotal;
        }
      }
    }

    return {
      period: period,
      transactionCount: transactionCount,
      totalRevenue: totalRevenue,
      sales: sales
    };
  } catch (error) {
    return { sales: [], total: 0, count: 0, error: error.toString() };
  }
}

/**
 * Get stock report
 */
function getStockReport() {
  try {
    const products = getProducts();
    const lowStock = [];
    const outOfStock = [];
    const inStock = [];

    products.products.forEach((product) => {
      if (product.stock === 0) {
        outOfStock.push(product);
      } else if (product.stock <= LOW_STOCK_THRESHOLD) {
        lowStock.push(product);
      } else {
        inStock.push(product);
      }
    });

    return {
      totalProducts: products.products.length,
      lowStock: lowStock,
      outOfStock: outOfStock,
      inStock: inStock
    };
  } catch (error) {
    return { error: error.toString() };
  }
}

/**
 * Get product information
 */
function getProductInfo(productName) {
  try {
    const products = getProducts();
    const searchName = productName.toLowerCase();
    
    const product = products.products.find((p) => 
      p.name.toLowerCase().includes(searchName)
    );

    return product || null;
  } catch (error) {
    return null;
  }
}

/**
 * Create Google Calendar event for restocking
 */
function createRestockCalendarEvent(productName, dateStr) {
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    if (!calendar) {
      return { success: false, error: "No calendar found" };
    }

    // Parse date
    let eventDate = new Date();
    if (dateStr && dateStr.toLowerCase() !== "tomorrow") {
      eventDate = new Date(dateStr);
    } else {
      eventDate.setDate(eventDate.getDate() + 1);
    }
    eventDate.setHours(9, 0, 0, 0); // 9 AM

    const title = productName 
      ? `Restock: ${productName}`
      : "Restock Inventory";
    
    const description = `Reminder to restock ${productName || "inventory items"}`;

    const event = calendar.createEvent(
      title,
      eventDate,
      new Date(eventDate.getTime() + 3600000), // 1 hour duration
      {
        description: description
      }
    );

    return { 
      success: true, 
      eventId: event.getId(),
      date: eventDate.toISOString()
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Send email report
 */
function sendEmailReport(period) {
  try {
    const report = getSalesReport({ period: period });
    const stockReport = getStockReport();

    const subject = `POS Sales Report - ${period}`;
    const body = `
POS System Report - ${period.toUpperCase()}

SALES SUMMARY:
- Total Transactions: ${report.transactionCount}
- Total Revenue: ₱${report.totalRevenue.toFixed(2)}

STOCK STATUS:
- Total Products: ${stockReport.totalProducts}
- Low Stock Items: ${stockReport.lowStock.length}
- Out of Stock: ${stockReport.outOfStock.length}

${stockReport.lowStock.length > 0 ? "\nLOW STOCK ITEMS:\n" + stockReport.lowStock.map(p => `- ${p.name}: ${p.stock} units`).join("\n") : ""}
${stockReport.outOfStock.length > 0 ? "\nOUT OF STOCK:\n" + stockReport.outOfStock.map(p => `- ${p.name}`).join("\n") : ""}

Generated: ${new Date().toLocaleString()}
    `.trim();

    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: subject,
      body: body
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Format sales report for display
 */
function formatSalesReport(report) {
  return `📊 SALES REPORT (${report.period.toUpperCase()})

💰 Total Revenue: ₱${report.totalRevenue.toFixed(2)}
📝 Transactions: ${report.transactionCount}

Generated: ${new Date().toLocaleString()}`;
}

/**
 * Format stock report for display
 */
function formatStockReport(report) {
  let message = `📦 STOCK STATUS\n\n`;
  message += `Total Products: ${report.totalProducts}\n`;
  message += `✅ In Stock: ${report.inStock.length}\n`;
  message += `⚠️ Low Stock: ${report.lowStock.length}\n`;
  message += `❌ Out of Stock: ${report.outOfStock.length}\n\n`;

  if (report.lowStock.length > 0) {
    message += `⚠️ LOW STOCK:\n`;
    report.lowStock.forEach((p) => {
      message += `• ${p.name}: ${p.stock} units\n`;
    });
    message += `\n`;
  }

  if (report.outOfStock.length > 0) {
    message += `❌ OUT OF STOCK:\n`;
    report.outOfStock.forEach((p) => {
      message += `• ${p.name}\n`;
    });
  }

  return message;
}

/**
 * Format low stock report
 */
function formatLowStockReport(report) {
  if (!report.lowStockProducts || report.lowStockProducts.length === 0) {
    return "✅ All products are well stocked!";
  }

  let message = `⚠️ LOW STOCK ALERT\n\n`;
  report.lowStockProducts.forEach((p) => {
    message += `• ${p.productName}: ${p.currentStock} units (threshold: ${p.threshold})\n`;
  });

  return message;
}

/**
 * Format product info
 */
function formatProductInfo(product) {
  if (!product) {
    return "Product not found.";
  }

  return `📦 ${product.name}\n\n` +
    `💰 Price: ₱${product.price.toFixed(2)}\n` +
    `📦 Stock: ${product.stock} units\n` +
    `🏷️ Category: ${product.category}\n` +
    `🆔 ID: ${product.id}`;
}

/**
 * Send message to specific user via Messenger
 */
function sendMessengerMessageToUser(recipientId, message) {
  try {
    Logger.log("Attempting to send message to: " + recipientId);
    Logger.log("Message content: " + message);
    
    if (!MESSENGER_PAGE_ACCESS_TOKEN) {
      Logger.log("ERROR: Messenger not configured - no access token");
      return { success: false, error: "Messenger not configured" };
    }

    const payload = {
      recipient: {
        id: recipientId
      },
      message: {
        text: message
      }
    };

    const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${MESSENGER_PAGE_ACCESS_TOKEN}`;
    
    Logger.log("Sending to Messenger API (token hidden)");
    
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload)
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();
    Logger.log("Response status: " + response.getResponseCode());
    Logger.log("Response body: " + responseText);
    
    const result = JSON.parse(responseText);

    if (result.error) {
      Logger.log("ERROR from Messenger API: " + JSON.stringify(result.error));
      return { success: false, error: result.error.message };
    }

    Logger.log("Message sent successfully!");
    return { success: true };
  } catch (error) {
    Logger.log("ERROR sending message: " + error.toString());
    Logger.log("Stack: " + error.stack);
    return { success: false, error: error.toString() };
  }
}

function getStock() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const productsSheet = ss.getSheetByName("Products") || ss.insertSheet("Products");

    if (productsSheet.getLastRow() === 0) {
      return { products: [] };
    }

    const data = productsSheet.getDataRange().getValues();
    const products = [];

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        products.push({
          id: data[i][0],
          stock: data[i][4] || 0,
        });
      }
    }

    return { products };
  } catch (error) {
    return { products: [], error: error.toString() };
  }
}

// ============================================
// AI AGENT FUNCTIONS
// ============================================

/**
 * Handle Messenger webhook asynchronously (processes without blocking response)
 */
function handleMessengerWebhookAsync(data) {
  try {
    Logger.log("Webhook received: " + JSON.stringify(data));
    
    if (data.object === "page") {
      data.entry.forEach((entry) => {
        Logger.log("Processing entry: " + JSON.stringify(entry));
        
        if (entry.messaging && entry.messaging.length > 0) {
          const webhookEvent = entry.messaging[0];
          const senderId = webhookEvent.sender.id;
          const message = webhookEvent.message;

          Logger.log("Sender ID: " + senderId);
          Logger.log("Message: " + JSON.stringify(message));

          if (message && message.text) {
            Logger.log("Processing message: " + message.text);
            // Process the message with AI
            const result = processAndRespondToMessage(senderId, message.text);
            Logger.log("Process result: " + JSON.stringify(result));
          } else {
            Logger.log("No text message found in webhook event");
          }
        } else {
          Logger.log("No messaging events found in entry");
        }
      });
    } else {
      Logger.log("Not a page object: " + data.object);
    }
  } catch (error) {
    Logger.log("ERROR handling webhook: " + error.toString());
    Logger.log("Stack: " + error.stack);
  }
}

/**
 * Handle Messenger webhook - receives messages from users
 */
function handleMessengerWebhook(data) {
  try {
    if (data.object === "page") {
      data.entry.forEach((entry) => {
        if (entry.messaging && entry.messaging.length > 0) {
          const webhookEvent = entry.messaging[0];
          const senderId = webhookEvent.sender.id;
          const message = webhookEvent.message;

          if (message && message.text) {
            // Process the message with AI
            processAndRespondToMessage(senderId, message.text);
          }
        }
      });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Process user message with AI and execute actions
 */
function processUserMessage(data) {
  try {
    const message = data.message || data.text;
    const senderId = data.senderId || MESSENGER_RECIPIENT_PSID;

    return processAndRespondToMessage(senderId, message);
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Main AI Agent function - understands intent and executes actions
 */
function processAndRespondToMessage(senderId, userMessage) {
  try {
    Logger.log("Processing message from sender: " + senderId);
    Logger.log("User message: " + userMessage);
    
    // Step 1: Use AI to understand intent
    const intent = understandIntent(userMessage);
    Logger.log("Detected intent: " + JSON.stringify(intent));
    
    // Step 2: Execute action based on intent
    let response = "";
    let actionResult = null;

    switch (intent.action) {
      case "get_sales_report":
        actionResult = getSalesReport({ 
          period: intent.period || "today",
          format: "text"
        });
        response = formatSalesReport(actionResult);
        break;

      case "get_stock_status":
        actionResult = getStockReport();
        response = formatStockReport(actionResult);
        break;

      case "check_low_stock":
        actionResult = checkLowStock(LOW_STOCK_THRESHOLD);
        response = formatLowStockReport(actionResult);
        break;

      case "create_restock_reminder":
        actionResult = createRestockCalendarEvent(intent.productName, intent.date);
        response = `✅ Created calendar reminder for restocking ${intent.productName || "products"} on ${intent.date || "tomorrow"}`;
        break;

      case "send_email_report":
        actionResult = sendEmailReport(intent.period || "today");
        response = `✅ Sales report sent to ${ADMIN_EMAIL}`;
        break;

      case "get_product_info":
        actionResult = getProductInfo(intent.productName);
        response = formatProductInfo(actionResult);
        break;

      default:
        response = "I can help you with:\n• Sales reports\n• Stock status\n• Low stock alerts\n• Calendar reminders\n• Email reports\n\nWhat would you like to know?";
    }

    Logger.log("Generated response: " + response);

    // Step 3: Send response via Messenger
    const sendResult = sendMessengerMessageToUser(senderId, response);
    Logger.log("Send result: " + JSON.stringify(sendResult));

    return { 
      success: true, 
      intent: intent,
      response: response,
      actionResult: actionResult,
      sendResult: sendResult
    };
  } catch (error) {
    Logger.log("ERROR in processAndRespondToMessage: " + error.toString());
    Logger.log("Stack: " + error.stack);
    const errorResult = sendMessengerMessageToUser(senderId, "Sorry, I encountered an error. Please try again.");
    Logger.log("Error message send result: " + JSON.stringify(errorResult));
    return { success: false, error: error.toString() };
  }
}

/**
 * Use Google Gemini API to understand user intent
 */
function understandIntent(userMessage) {
  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
      // Fallback: Simple keyword-based intent detection
      return simpleIntentDetection(userMessage);
    }

    const prompt = `You are an AI assistant for a POS (Point of Sale) system. 
Analyze user messages and determine their intent. Return ONLY a JSON object with this structure:
{
  "action": "action_name",
  "period": "today|week|month" (if relevant),
  "productName": "product name" (if mentioned),
  "date": "date" (if mentioned)
}

Available actions:
- "get_sales_report" - user wants sales data/report
- "get_stock_status" - user wants stock information
- "check_low_stock" - user wants to check low stock items
- "create_restock_reminder" - user wants to schedule a restocking reminder
- "send_email_report" - user wants to email a report
- "get_product_info" - user wants info about a specific product
- "general_query" - general question/chat

Examples:
- "show me today's sales" → {"action": "get_sales_report", "period": "today"}
- "what's low in stock?" → {"action": "check_low_stock"}
- "schedule restock for coca cola tomorrow" → {"action": "create_restock_reminder", "productName": "coca cola", "date": "tomorrow"}
- "send me an email report" → {"action": "send_email_report"}
- "how many coca cola do we have?" → {"action": "get_product_info", "productName": "coca cola"}

User message: "${userMessage}"

Return only the JSON object, no other text.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 150
      }
    };

    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload)
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    const aiResponse = result.candidates[0].content.parts[0].text.trim();
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = aiResponse;
    if (aiResponse.includes("```json")) {
      jsonStr = aiResponse.split("```json")[1].split("```")[0].trim();
    } else if (aiResponse.includes("```")) {
      jsonStr = aiResponse.split("```")[1].split("```")[0].trim();
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    // Fallback to simple detection
    return simpleIntentDetection(userMessage);
  }
}

/**
 * Simple keyword-based intent detection (fallback)
 */
function simpleIntentDetection(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("sales") || lowerMessage.includes("report") || lowerMessage.includes("revenue")) {
    let period = "today";
    if (lowerMessage.includes("week")) period = "week";
    if (lowerMessage.includes("month")) period = "month";
    return { action: "get_sales_report", period: period };
  }
  
  if (lowerMessage.includes("stock") && (lowerMessage.includes("low") || lowerMessage.includes("check"))) {
    return { action: "check_low_stock" };
  }
  
  if (lowerMessage.includes("stock") || lowerMessage.includes("inventory")) {
    return { action: "get_stock_status" };
  }
  
  if (lowerMessage.includes("remind") || lowerMessage.includes("schedule") || lowerMessage.includes("calendar")) {
    return { action: "create_restock_reminder", date: "tomorrow" };
  }
  
  if (lowerMessage.includes("email") && lowerMessage.includes("report")) {
    return { action: "send_email_report", period: "today" };
  }
  
  return { action: "general_query" };
}

/**
 * Get sales report from Google Sheets
 */
function getSalesReport(params) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const salesSheet = ss.getSheetByName("Sales");
    
    if (!salesSheet || salesSheet.getLastRow() === 0) {
      return { sales: [], total: 0, count: 0 };
    }

    const data = salesSheet.getDataRange().getValues();
    const period = params.period || "today";
    const now = new Date();
    let startDate = new Date();

    // Calculate date range
    if (period === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(now.getMonth() - 1);
    }

    const sales = [];
    let totalRevenue = 0;
    let transactionCount = 0;
    const transactions = new Set();

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const timestamp = new Date(data[i][1]);
      if (timestamp >= startDate) {
        const transactionId = data[i][0];
        const subtotal = parseFloat(data[i][7]) || 0;
        
        if (!transactions.has(transactionId)) {
          transactions.add(transactionId);
          transactionCount++;
          totalRevenue += subtotal;
        }
      }
    }

    return {
      period: period,
      transactionCount: transactionCount,
      totalRevenue: totalRevenue,
      sales: sales
    };
  } catch (error) {
    return { sales: [], total: 0, count: 0, error: error.toString() };
  }
}

/**
 * Get stock report
 */
function getStockReport() {
  try {
    const products = getProducts();
    const lowStock = [];
    const outOfStock = [];
    const inStock = [];

    products.products.forEach((product) => {
      if (product.stock === 0) {
        outOfStock.push(product);
      } else if (product.stock <= LOW_STOCK_THRESHOLD) {
        lowStock.push(product);
      } else {
        inStock.push(product);
      }
    });

    return {
      totalProducts: products.products.length,
      lowStock: lowStock,
      outOfStock: outOfStock,
      inStock: inStock
    };
  } catch (error) {
    return { error: error.toString() };
  }
}

/**
 * Get product information
 */
function getProductInfo(productName) {
  try {
    const products = getProducts();
    const searchName = productName.toLowerCase();
    
    const product = products.products.find((p) => 
      p.name.toLowerCase().includes(searchName)
    );

    return product || null;
  } catch (error) {
    return null;
  }
}

/**
 * Create Google Calendar event for restocking
 */
function createRestockCalendarEvent(productName, dateStr) {
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    if (!calendar) {
      return { success: false, error: "No calendar found" };
    }

    // Parse date
    let eventDate = new Date();
    if (dateStr && dateStr.toLowerCase() !== "tomorrow") {
      eventDate = new Date(dateStr);
    } else {
      eventDate.setDate(eventDate.getDate() + 1);
    }
    eventDate.setHours(9, 0, 0, 0); // 9 AM

    const title = productName 
      ? `Restock: ${productName}`
      : "Restock Inventory";
    
    const description = `Reminder to restock ${productName || "inventory items"}`;

    const event = calendar.createEvent(
      title,
      eventDate,
      new Date(eventDate.getTime() + 3600000), // 1 hour duration
      {
        description: description
      }
    );

    return { 
      success: true, 
      eventId: event.getId(),
      date: eventDate.toISOString()
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Send email report
 */
function sendEmailReport(period) {
  try {
    const report = getSalesReport({ period: period });
    const stockReport = getStockReport();

    const subject = `POS Sales Report - ${period}`;
    const body = `
POS System Report - ${period.toUpperCase()}

SALES SUMMARY:
- Total Transactions: ${report.transactionCount}
- Total Revenue: ₱${report.totalRevenue.toFixed(2)}

STOCK STATUS:
- Total Products: ${stockReport.totalProducts}
- Low Stock Items: ${stockReport.lowStock.length}
- Out of Stock: ${stockReport.outOfStock.length}

${stockReport.lowStock.length > 0 ? "\nLOW STOCK ITEMS:\n" + stockReport.lowStock.map(p => `- ${p.name}: ${p.stock} units`).join("\n") : ""}
${stockReport.outOfStock.length > 0 ? "\nOUT OF STOCK:\n" + stockReport.outOfStock.map(p => `- ${p.name}`).join("\n") : ""}

Generated: ${new Date().toLocaleString()}
    `.trim();

    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: subject,
      body: body
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Format sales report for display
 */
function formatSalesReport(report) {
  return `📊 SALES REPORT (${report.period.toUpperCase()})

💰 Total Revenue: ₱${report.totalRevenue.toFixed(2)}
📝 Transactions: ${report.transactionCount}

Generated: ${new Date().toLocaleString()}`;
}

/**
 * Format stock report for display
 */
function formatStockReport(report) {
  let message = `📦 STOCK STATUS\n\n`;
  message += `Total Products: ${report.totalProducts}\n`;
  message += `✅ In Stock: ${report.inStock.length}\n`;
  message += `⚠️ Low Stock: ${report.lowStock.length}\n`;
  message += `❌ Out of Stock: ${report.outOfStock.length}\n\n`;

  if (report.lowStock.length > 0) {
    message += `⚠️ LOW STOCK:\n`;
    report.lowStock.forEach((p) => {
      message += `• ${p.name}: ${p.stock} units\n`;
    });
    message += `\n`;
  }

  if (report.outOfStock.length > 0) {
    message += `❌ OUT OF STOCK:\n`;
    report.outOfStock.forEach((p) => {
      message += `• ${p.name}\n`;
    });
  }

  return message;
}

/**
 * Format low stock report
 */
function formatLowStockReport(report) {
  if (!report.lowStockProducts || report.lowStockProducts.length === 0) {
    return "✅ All products are well stocked!";
  }

  let message = `⚠️ LOW STOCK ALERT\n\n`;
  report.lowStockProducts.forEach((p) => {
    message += `• ${p.productName}: ${p.currentStock} units (threshold: ${p.threshold})\n`;
  });

  return message;
}

/**
 * Format product info
 */
function formatProductInfo(product) {
  if (!product) {
    return "Product not found.";
  }

  return `📦 ${product.name}\n\n` +
    `💰 Price: ₱${product.price.toFixed(2)}\n` +
    `📦 Stock: ${product.stock} units\n` +
    `🏷️ Category: ${product.category}\n` +
    `🆔 ID: ${product.id}`;
}

/**
 * Send message to specific user via Messenger
 */
function sendMessengerMessageToUser(recipientId, message) {
  try {
    Logger.log("Attempting to send message to: " + recipientId);
    Logger.log("Message content: " + message);
    
    if (!MESSENGER_PAGE_ACCESS_TOKEN) {
      Logger.log("ERROR: Messenger not configured - no access token");
      return { success: false, error: "Messenger not configured" };
    }

    const payload = {
      recipient: {
        id: recipientId
      },
      message: {
        text: message
      }
    };

    const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${MESSENGER_PAGE_ACCESS_TOKEN}`;
    
    Logger.log("Sending to Messenger API (token hidden)");
    
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload)
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();
    Logger.log("Response status: " + response.getResponseCode());
    Logger.log("Response body: " + responseText);
    
    const result = JSON.parse(responseText);

    if (result.error) {
      Logger.log("ERROR from Messenger API: " + JSON.stringify(result.error));
      return { success: false, error: result.error.message };
    }

    Logger.log("Message sent successfully!");
    return { success: true };
  } catch (error) {
    Logger.log("ERROR sending message: " + error.toString());
    Logger.log("Stack: " + error.stack);
    return { success: false, error: error.toString() };
  }
}

