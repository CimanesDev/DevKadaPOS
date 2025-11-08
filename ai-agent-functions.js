// ============================================
// AI AGENT FUNCTIONS
// Add these functions to the end of google-apps-script.js
// ============================================

/**
 * Handle Messenger webhook - receives messages from users
 */
function handleMessengerWebhook(data) {
  try {
    if (data.object === "page") {
      data.entry.forEach((entry) => {
        const webhookEvent = entry.messaging[0];
        const senderId = webhookEvent.sender.id;
        const message = webhookEvent.message;

        if (message && message.text) {
          // Process the message with AI
          processAndRespondToMessage(senderId, message.text);
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
    // Step 1: Use AI to understand intent
    const intent = understandIntent(userMessage);
    
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

    // Step 3: Send response via Messenger
    sendMessengerMessageToUser(senderId, response);

    return { 
      success: true, 
      intent: intent,
      response: response,
      actionResult: actionResult
    };
  } catch (error) {
    sendMessengerMessageToUser(senderId, "Sorry, I encountered an error. Please try again.");
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
    if (!MESSENGER_PAGE_ACCESS_TOKEN) {
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
    
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload)
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

