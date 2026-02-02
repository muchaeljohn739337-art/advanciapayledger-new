# 🤖 Ava AI Assistant - Complete Setup Guide

## ✅ Implementation Complete

Ava AI Assistant has been integrated into your Advancia PayLedger backend!

---

## 📊 What's Been Implemented

### **1. Core Ava Configuration** ✅
- **File:** `backend/src/config/ava.ts`
- Company information
- Services and pricing
- Policies and guidelines
- Sample responses
- Escalation triggers
- Prohibited topics

### **2. Ava AI Service** ✅
- **File:** `backend/src/services/avaService.ts`
- AI-powered chat processing
- Multi-provider fallback (OpenAI → Claude → Gemini)
- Escalation detection
- Support ticket creation
- Slack integration
- Notion integration

### **3. API Routes** ✅
- **File:** `backend/src/routes/ava.ts`
- `POST /api/ava/chat` - Chat with Ava
- `POST /api/ava/ticket` - Create support ticket
- `GET /api/ava/status` - Service status

### **4. Environment Configuration** ✅
- Slack webhook URL
- Notion API key
- Notion database ID

---

## 🎯 API Endpoints

### **Chat with Ava**
```bash
POST /api/ava/chat
Content-Type: application/json

{
  "message": "How do I transfer money internationally?",
  "context": {
    "userId": "user123",
    "accountType": "premium"
  }
}
```

**Response:**
```json
{
  "response": "💰 International transfers are easy with Advancia! Our fee is 2.5% and transfers typically complete within 1-3 business days...",
  "confidence": 0.9,
  "shouldEscalate": false
}
```

### **Create Support Ticket**
```bash
POST /api/ava/ticket
Content-Type: application/json

{
  "customerName": "John Doe",
  "email": "john@example.com",
  "country": "United States",
  "issueType": "Technical",
  "priority": "High",
  "message": "I can't login to my account"
}
```

**Response:**
```json
{
  "success": true,
  "ticket": {
    "id": "AVA-1738396800000-ABC123",
    "status": "Open",
    "createdAt": "2026-02-01T09:00:00.000Z"
  },
  "message": "Support ticket created successfully. Our team will respond within 2 hours."
}
```

### **Check Service Status**
```bash
GET /api/ava/status
```

**Response:**
```json
{
  "status": "operational",
  "name": "Ava",
  "version": "1.0.0",
  "features": {
    "chat": true,
    "ticketing": true,
    "slackIntegration": false,
    "notionIntegration": false
  },
  "aiProviders": {
    "openai": true,
    "claude": true,
    "gemini": true
  }
}
```

---

## 🔧 Slack Integration Setup

### **Step 1: Create Slack Webhook**
1. Go to: https://api.slack.com/apps
2. Create new app or select existing
3. Go to "Incoming Webhooks"
4. Activate incoming webhooks
5. Click "Add New Webhook to Workspace"
6. Select channel (e.g., #support-tickets)
7. Copy webhook URL

### **Step 2: Add to .env**
```bash
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX"
```

### **Step 3: Test**
```bash
curl -X POST http://localhost:3001/api/ava/ticket \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "email": "test@example.com",
    "issueType": "General",
    "priority": "Medium",
    "message": "Test ticket"
  }'
```

**Check Slack channel for notification!**

---

## 📝 Notion Integration Setup

### **Step 1: Create Notion Integration**
1. Go to: https://www.notion.so/my-integrations
2. Click "New integration"
3. Name: "Advancia Support Bot"
4. Select workspace
5. Copy "Internal Integration Token"

### **Step 2: Create Support Database**
1. Create new page in Notion: "Advancia Support Center"
2. Add database with columns:
   - **Ticket ID** (Title)
   - **Customer Name** (Text)
   - **Email** (Email)
   - **Country** (Select)
   - **Issue Type** (Select: Billing, Technical, Account, General)
   - **Priority** (Select: Low, Medium, High, Urgent)
   - **Status** (Select: Open, In Progress, Resolved, Closed)
   - **AI Handled** (Checkbox)
   - **Messages** (Text)

### **Step 3: Share Database with Integration**
1. Click "..." on database
2. Click "Add connections"
3. Select "Advancia Support Bot"

### **Step 4: Get Database ID**
1. Open database as full page
2. Copy URL: `https://notion.so/workspace/DATABASE_ID?v=...`
3. Extract `DATABASE_ID` (32 character string)

### **Step 5: Add to .env**
```bash
NOTION_API_KEY="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
NOTION_DATABASE_ID="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### **Step 6: Test**
```bash
curl -X POST http://localhost:3001/api/ava/ticket \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "email": "test@example.com",
    "issueType": "General",
    "priority": "Medium",
    "message": "Test ticket"
  }'
```

**Check Notion database for new entry!**

---

## 🎨 Frontend Integration Example

### **React Chat Component**
```typescript
import { useState } from 'react';

export function AvaChat() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<Array<{role: string, content: string}>>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    // Add user message to chat
    setChat(prev => [...prev, { role: 'user', content: message }]);
    setLoading(true);

    try {
      const response = await fetch('/api/ava/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      // Add Ava's response to chat
      setChat(prev => [...prev, { role: 'assistant', content: data.response }]);

      // Check if escalation needed
      if (data.shouldEscalate) {
        alert('This issue requires human support. Creating ticket...');
        // Create ticket automatically
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
      setMessage('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {chat.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.role === 'assistant' && '🤖 Ava: '}
            {msg.content}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask Ava anything..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
```

---

## 🧪 Testing

### **Test Chat**
```bash
curl -X POST http://localhost:3001/api/ava/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are your fees?"}'
```

### **Test Ticket Creation**
```bash
curl -X POST http://localhost:3001/api/ava/ticket \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "email": "john@example.com",
    "issueType": "Billing",
    "priority": "High",
    "message": "I was charged twice"
  }'
```

### **Test Status**
```bash
curl http://localhost:3001/api/ava/status
```

---

## 📊 Ava Features

### **AI-Powered Responses:**
- ✅ Multi-provider fallback (OpenAI → Claude → Gemini)
- ✅ Context-aware responses
- ✅ Confidence scoring
- ✅ Automatic escalation detection

### **Support Ticketing:**
- ✅ Automatic ticket creation
- ✅ Priority assignment
- ✅ Status tracking
- ✅ Message history

### **Integrations:**
- ✅ Slack notifications
- ✅ Notion database sync
- ✅ Email notifications (via existing email service)

### **Security:**
- ✅ No sensitive data in responses
- ✅ Identity verification required
- ✅ Escalation for account-specific queries
- ✅ Prohibited topic filtering

---

## 🎯 Sample Interactions

### **Greeting:**
**User:** "Hello"  
**Ava:** "Hello! 👋 Welcome to Advancia Pay Ledger. I'm Ava, your AI assistant. How may I help you today?"

### **Fees Question:**
**User:** "What are your fees?"  
**Ava:** "💰 Our pricing is transparent:
- Standard Transfers: 0% fee
- Instant Transfers: 1.5%
- International: 2.5%
- Crypto Trading: 0.5%

Enterprise customers get additional discounts!"

### **Security Question:**
**User:** "Is my money safe?"  
**Ava:** "🔐 Your security is our top priority! Advancia uses bank-grade 256-bit AES encryption, multi-factor authentication, and AI-powered fraud detection. Your funds are protected 24/7."

### **Escalation:**
**User:** "My account is locked"  
**Ava:** "I appreciate your question! While I specialize in Advancia Pay Ledger services, I want to make sure you get the best help. Would you like me to connect you with our human support team?"

---

## 🔐 Environment Variables

### **Required:**
```bash
# AI Providers (at least one)
OPENAI_API_KEY="sk-proj-..."
ANTHROPIC_API_KEY="sk-ant-..."
GEMINI_API_KEY="AIzaSy..."
```

### **Optional (Integrations):**
```bash
# Slack Integration
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."

# Notion Integration
NOTION_API_KEY="secret_..."
NOTION_DATABASE_ID="..."
```

---

## ✅ Next Steps

1. **Configure Slack** (optional)
   - Create webhook
   - Add to `.env`
   - Test ticket creation

2. **Configure Notion** (optional)
   - Create integration
   - Setup database
   - Add to `.env`
   - Test ticket creation

3. **Integrate Frontend**
   - Add chat component
   - Style with your design system
   - Test user interactions

4. **Monitor Performance**
   - Check AI confidence scores
   - Review escalation rate
   - Optimize prompts as needed

---

## 📚 Documentation

- **Configuration:** `backend/src/config/ava.ts`
- **Service Logic:** `backend/src/services/avaService.ts`
- **API Routes:** `backend/src/routes/ava.ts`
- **Environment:** `backend/.env`

---

**Ava AI Assistant is ready to help your customers 24/7!** 🤖✨
