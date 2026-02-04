# 📚 **ADVANCIA PAYLEDGER - API DOCUMENTATION**

## 📋 **TABLE OF CONTENTS**

1. [API Overview](#api-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [API Endpoints](#api-endpoints)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Webhooks](#webhooks)
7. [SDKs & Libraries](#sdks--libraries)
8. [Examples & Use Cases](#examples--use-cases)

---

## 🎯 **API OVERVIEW**

### **Base URLs**
```
Production: https://api.advancia.com
Staging:    https://staging-api.advancia.com
Development: http://localhost:3000
```

### **API Versioning**
- **Current Version**: v1
- **Version Format**: `/api/v1/`
- **Backward Compatibility**: Maintained for 2 versions
- **Deprecation Notice**: 6 months advance notice

### **Supported Formats**
- **Request/Response**: JSON (default)
- **Alternative**: XML, Protocol Buffers
- **Content-Type**: `application/json` (recommended)

### **HTTP Methods**
- **GET**: Retrieve resources
- **POST**: Create resources
- **PUT**: Update resources (full replacement)
- **PATCH**: Update resources (partial update)
- **DELETE**: Remove resources

---

## 🔐 **AUTHENTICATION & AUTHORIZATION**

### **Authentication Methods**

#### **1. JWT Bearer Token (Recommended)**
```http
Authorization: Bearer <jwt_token>
```

#### **2. API Key**
```http
X-API-Key: <api_key>
```

#### **3. Service-to-Service (mTLS)**
- Client certificate authentication
- Mutual TLS for internal service communication

### **JWT Token Structure**
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_123",
    "iat": 1640995200,
    "exp": 1641081600,
    "iss": "advancia.com",
    "aud": "advancia-api",
    "tenant_id": "tenant_456",
    "role": "admin",
    "permissions": ["read:users", "write:payments"]
  }
}
```

### **Role-Based Access Control (RBAC)**

#### **Role Hierarchy**
```
SUPER_ADMIN > ADMIN > MANAGER > USER > GUEST
```

#### **Permission Scopes**
- **Users**: `read:users`, `write:users`, `delete:users`
- **Payments**: `read:payments`, `write:payments`, `refund:payments`
- **Web3**: `read:web3`, `write:web3`, `admin:web3`
- **AI**: `read:ai`, `write:ai`, `admin:ai`
- **System**: `read:system`, `write:system`, `admin:system`

---

## 🔌 **API ENDPOINTS**

### **Authentication Endpoints**

#### **POST /api/v1/auth/login**
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "mfa_code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "role": "admin",
      "tenant_id": "tenant_456"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJSUzI1NiIs...",
      "refresh_token": "eyJhbGciOiJSUzI1NiIs...",
      "expires_in": 3600
    }
  }
}
```

#### **POST /api/v1/auth/refresh**
Refresh JWT token using refresh token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

#### **POST /api/v1/auth/logout**
Invalidate current session.

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

---

### **User Management Endpoints**

#### **GET /api/v1/users**
Get list of users (requires `read:users` permission).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `search`: Search by email or name
- `role`: Filter by role
- `status`: Filter by status

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_123",
        "email": "user@example.com",
        "name": "John Doe",
        "role": "admin",
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z",
        "last_login": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "total_pages": 8
    }
  }
}
```

#### **POST /api/v1/users**
Create new user (requires `write:users` permission).

**Request:**
```json
{
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "role": "user",
  "password": "secure_password",
  "send_invite": true
}
```

#### **GET /api/v1/users/{user_id}**
Get user details.

#### **PUT /api/v1/users/{user_id}**
Update user information.

#### **DELETE /api/v1/users/{user_id}**
Delete user (requires `delete:users` permission).

---

### **Payment Endpoints**

#### **GET /api/v1/payments**
Get list of payments.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (`pending`, `completed`, `failed`, `refunded`)
- `from_date`: Start date filter (ISO 8601)
- `to_date`: End date filter (ISO 8601)
- `amount_min`: Minimum amount filter
- `amount_max`: Maximum amount filter

**Response:**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "pay_123",
        "amount": 9999,
        "currency": "USD",
        "status": "completed",
        "method": "credit_card",
        "description": "Payment for services",
        "created_at": "2024-01-15T10:30:00Z",
        "completed_at": "2024-01-15T10:31:00Z",
        "metadata": {
          "invoice_id": "inv_456",
          "customer_id": "cust_789"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1250,
      "total_pages": 63
    }
  }
}
```

#### **POST /api/v1/payments**
Create new payment.

**Request:**
```json
{
  "amount": 9999,
  "currency": "USD",
  "method": "credit_card",
  "description": "Payment for services",
  "customer_id": "cust_789",
  "metadata": {
    "invoice_id": "inv_456"
  },
  "payment_method": {
    "type": "card",
    "card_id": "card_123"
  }
}
```

#### **GET /api/v1/payments/{payment_id}**
Get payment details.

#### **POST /api/v1/payments/{payment_id}/refund**
Refund payment (requires `refund:payments` permission).

**Request:**
```json
{
  "amount": 5000,
  "reason": "Customer requested refund"
}
```

---

### **Web3 Endpoints**

#### **GET /api/v1/web3/events**
Get Web3 events.

**Query Parameters:**
- `chain`: Blockchain filter (`ethereum`, `solana`, `polygon`, `base`)
- `contract`: Contract address filter
- `event_type`: Event type filter
- `from_block`: Starting block number
- `to_block`: Ending block number
- `limit`: Number of events to return

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event_123",
        "chain": "ethereum",
        "contract": "0x1234567890123456789012345678901234567890",
        "event_name": "Transfer",
        "block_number": 12345678,
        "transaction_hash": "0xabcdef...",
        "timestamp": "2024-01-15T10:30:00Z",
        "payload": {
          "from": "0x111...",
          "to": "0x222...",
          "value": "1000000000000000000"
        }
      }
    ],
    "pagination": {
      "limit": 100,
      "total": 5000,
      "has_more": true
    }
  }
}
```

#### **POST /api/v1/web3/events/subscribe**
Subscribe to Web3 events.

**Request:**
```json
{
  "chain": "ethereum",
  "contract": "0x1234567890123456789012345678901234567890",
  "events": ["Transfer", "Approval"],
  "webhook_url": "https://your-app.com/webhooks/web3",
  "confirmations": 6
}
```

#### **GET /api/v1/web3/wallets/{wallet_address}/activity**
Get wallet activity.

#### **POST /api/v1/web3/fraud/analyze`
Analyze transaction for fraud.

**Request:**
```json
{
  "transaction_hash": "0xabcdef...",
  "wallet_address": "0x111...",
  "amount": 1000000000000000000,
  "token_address": "0x1234567890123456789012345678901234567890"
}
```

---

### **AI Endpoints**

#### **POST /api/v1/ai/tasks/submit**
Submit AI task for processing.

**Request:**
```json
{
  "type": "code",
  "input": "Generate a REST API for user management",
  "model": "claude-3-sonnet",
  "parameters": {
    "language": "typescript",
    "framework": "express",
    "database": "postgresql"
  },
  "priority": "normal"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "task_id": "task_123",
    "status": "queued",
    "estimated_duration": 30,
    "tokens_used": 0,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### **GET /api/v1/ai/tasks/{task_id}**
Get AI task status and result.

**Response:**
```json
{
  "success": true,
  "data": {
    "task_id": "task_123",
    "status": "completed",
    "type": "code",
    "model": "claude-3-sonnet",
    "input": "Generate a REST API for user management",
    "output": {
      "code": "// Generated TypeScript code...",
      "explanation": "This API provides CRUD operations...",
      "files": ["user-controller.ts", "user-model.ts", "user-routes.ts"]
    },
    "tokens_used": 1247,
    "duration": 25.3,
    "created_at": "2024-01-15T10:30:00Z",
    "completed_at": "2024-01-15T10:30:25Z"
  }
}
```

#### **GET /api/v1/ai/tasks/active**
Get list of active AI tasks.

#### **POST /api/v1/ai/tasks/{task_id}/cancel**
Cancel AI task.

---

### **Monitoring Endpoints**

#### **GET /api/v1/monitoring/health**
Get system health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "services": [
      {
        "name": "api-gateway",
        "status": "healthy",
        "uptime": 99.9,
        "response_time": 45
      },
      {
        "name": "database",
        "status": "healthy",
        "connections": 45,
        "response_time": 12
      },
      {
        "name": "redis",
        "status": "healthy",
        "memory_usage": 67,
        "response_time": 5
      }
    ]
  }
}
```

#### **GET /api/v1/monitoring/metrics**
Get system metrics.

**Query Parameters:**
- `service`: Service name filter
- `metric`: Metric type filter
- `from_time`: Start time (ISO 8601)
- `to_time`: End time (ISO 8601)
- `interval`: Aggregation interval (`1m`, `5m`, `1h`, `1d`)

#### **GET /api/v1/monitoring/alerts**
Get system alerts.

#### **POST /api/v1/monitoring/alerts**
Create custom alert.

---

### **Compliance Endpoints**

#### **GET /api/v1/compliance/controls**
Get compliance controls status.

#### **POST /api/v1/compliance/controls/check`
Run compliance assessment.

#### **GET /api/v1/compliance/report**
Generate compliance report.

#### **GET /api/v1/compliance/audit/history`
Get audit history.

---

## ❌ **ERROR HANDLING**

### **HTTP Status Codes**

#### **Success Codes**
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Request successful, no content returned

#### **Client Error Codes**
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `422 Unprocessable Entity`: Validation failed
- `429 Too Many Requests`: Rate limit exceeded

#### **Server Error Codes**
- `500 Internal Server Error`: Unexpected server error
- `502 Bad Gateway`: Upstream service error
- `503 Service Unavailable`: Service temporarily unavailable
- `504 Gateway Timeout`: Upstream service timeout

### **Error Response Format**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    },
    "request_id": "req_123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### **Common Error Codes**

#### **Authentication Errors**
- `INVALID_CREDENTIALS`: Invalid email or password
- `TOKEN_EXPIRED`: JWT token has expired
- `INVALID_TOKEN`: Invalid JWT token
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions

#### **Validation Errors**
- `VALIDATION_ERROR`: Request validation failed
- `MISSING_REQUIRED_FIELD`: Required field missing
- `INVALID_FORMAT`: Field format invalid
- `VALUE_OUT_OF_RANGE`: Value outside allowed range

#### **Business Logic Errors**
- `INSUFFICIENT_BALANCE`: Insufficient account balance
- `DUPLICATE_RESOURCE`: Resource already exists
- `RESOURCE_NOT_FOUND`: Resource does not exist
- `OPERATION_NOT_ALLOWED`: Operation not permitted

---

## ⚡ **RATE LIMITING**

### **Rate Limit Tiers**

#### **Free Tier**
- **Requests**: 1,000 per hour
- **Burst**: 100 requests per minute
- **Webhooks**: 100 per hour

#### **Professional Tier**
- **Requests**: 10,000 per hour
- **Burst**: 500 requests per minute
- **Webhooks**: 1,000 per hour

#### **Enterprise Tier**
- **Requests**: 100,000 per hour
- **Burst**: 2,000 requests per minute
- **Webhooks**: 10,000 per hour

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 60
```

### **Rate Limit Exceeded Response**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again later.",
    "details": {
      "limit": 1000,
      "remaining": 0,
      "reset_time": "2024-01-15T11:00:00Z",
      "retry_after": 300
    }
  }
}
```

---

## 🔗 **WEBHOOKS**

### **Webhook Configuration**

#### **Create Webhook**
```http
POST /api/v1/webhooks
```

**Request:**
```json
{
  "url": "https://your-app.com/webhooks/advancia",
  "events": ["payment.completed", "payment.failed", "user.created"],
  "secret": "whsec_1234567890abcdef",
  "active": true,
  "description": "Payment processing webhook"
}
```

#### **Webhook Events**
- `payment.completed`: Payment processed successfully
- `payment.failed`: Payment processing failed
- `payment.refunded`: Payment refunded
- `user.created`: New user registered
- `user.updated`: User information updated
- `web3.event.received`: New Web3 event processed
- `ai.task.completed`: AI task processing completed
- `system.alert.triggered`: System alert triggered

### **Webhook Delivery Format**

#### **Headers**
```http
X-Advancia-Webhook-Signature: sha256=abcdef1234567890
X-Advancia-Event: payment.completed
X-Advancia-Delivery: delivery_123
User-Agent: Advancia-Webhook/1.0
```

#### **Payload**
```json
{
  "id": "evt_123",
  "type": "payment.completed",
  "created_at": "2024-01-15T10:30:00Z",
  "data": {
    "payment": {
      "id": "pay_123",
      "amount": 9999,
      "currency": "USD",
      "status": "completed"
    }
  },
  "livemode": false
}
```

### **Webhook Signature Verification**
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return `sha256=${expectedSignature}` === signature;
}
```

---

## 📦 **SDKS & LIBRARIES**

### **Official SDKs**

#### **JavaScript/TypeScript**
```bash
npm install @advancia/api-sdk
```

```javascript
import { AdvanciaAPI } from '@advancia/api-sdk';

const client = new AdvanciaAPI({
  apiKey: 'advancia_live_1234567890',
  environment: 'production'
});

// Create payment
const payment = await client.payments.create({
  amount: 9999,
  currency: 'USD',
  method: 'credit_card'
});
```

#### **Python**
```bash
pip install advancia-python
```

```python
from advancia import AdvanciaAPI

client = AdvanciaAPI(
    api_key='advancia_live_1234567890',
    environment='production'
)

# Create payment
payment = client.payments.create(
    amount=9999,
    currency='USD',
    method='credit_card'
)
```

#### **Ruby**
```bash
gem install advancia-ruby
```

```ruby
require 'advancia'

client = Advancia::API.new(
  api_key: 'advancia_live_1234567890',
  environment: 'production'
)

# Create payment
payment = client.payments.create(
  amount: 9999,
  currency: 'USD',
  method: 'credit_card'
)
```

### **Community Libraries**

#### **Go**
```bash
go get github.com/advancia/go-sdk
```

#### **PHP**
```bash
composer require advancia/php-sdk
```

#### **Java**
```xml
<dependency>
  <groupId>com.advancia</groupId>
  <artifactId>advancia-java-sdk</artifactId>
  <version>1.0.0</version>
</dependency>
```

---

## 💡 **EXAMPLES & USE CASES**

### **Payment Processing Flow**

#### **1. Create Customer**
```javascript
const customer = await client.customers.create({
  email: 'customer@example.com',
  name: 'John Doe',
  metadata: {
    company: 'Acme Corp'
  }
});
```

#### **2. Create Payment Method**
```javascript
const paymentMethod = await client.paymentMethods.create({
  customer_id: customer.id,
  type: 'card',
  card: {
    number: '4242424242424242',
    exp_month: 12,
    exp_year: 2025,
    cvc: '123'
  }
});
```

#### **3. Process Payment**
```javascript
const payment = await client.payments.create({
  amount: 9999,
  currency: 'USD',
  customer_id: customer.id,
  payment_method_id: paymentMethod.id,
  description: 'Monthly subscription'
});
```

#### **4. Handle Webhook**
```javascript
app.post('/webhooks/advancia', (req, res) => {
  const signature = req.headers['x-advancia-webhook-signature'];
  const payload = JSON.stringify(req.body);
  
  if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = req.body;
  
  switch (event.type) {
    case 'payment.completed':
      handlePaymentCompleted(event.data);
      break;
    case 'payment.failed':
      handlePaymentFailed(event.data);
      break;
  }
  
  res.status(200).send('OK');
});
```

### **Web3 Event Monitoring**

#### **Subscribe to Events**
```javascript
const subscription = await client.web3.subscribe({
  chain: 'ethereum',
  contract: '0x1234567890123456789012345678901234567890',
  events: ['Transfer', 'Approval'],
  webhook_url: 'https://your-app.com/webhooks/web3'
});
```

#### **Process Webhook**
```javascript
app.post('/webhooks/web3', (req, res) => {
  const event = req.body;
  
  if (event.type === 'web3.event.received') {
    const web3Event = event.data.event;
    
    // Process blockchain event
    console.log(`Received ${web3Event.event_name} from ${web3Event.contract}`);
    
    // Update local database
    await updateLocalDatabase(web3Event);
  }
  
  res.status(200).send('OK');
});
```

### **AI Task Processing**

#### **Submit Code Generation Task**
```javascript
const task = await client.ai.tasks.submit({
  type: 'code',
  input: 'Create a REST API for user management with TypeScript',
  model: 'claude-3-sonnet',
  parameters: {
    language: 'typescript',
    framework: 'express',
    database: 'postgresql'
  }
});
```

#### **Monitor Task Progress**
```javascript
const checkTaskStatus = async (taskId) => {
  const task = await client.ai.tasks.get(taskId);
  
  console.log(`Task ${taskId} status: ${task.status}`);
  
  if (task.status === 'completed') {
    console.log('Generated code:', task.output.code);
    return task.output;
  } else if (task.status === 'failed') {
    console.error('Task failed:', task.error);
    throw new Error(task.error);
  } else {
    // Check again in 5 seconds
    setTimeout(() => checkTaskStatus(taskId), 5000);
  }
};

checkTaskStatus(task.task_id);
```

### **Error Handling Best Practices**

#### **Retry Logic**
```javascript
const retryRequest = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        // Rate limit error - wait and retry
        const retryAfter = error.headers['x-rate-limit-retry-after'] || 60;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      if (error.status >= 500 && i < maxRetries - 1) {
        // Server error - retry with exponential backoff
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
};

// Usage
const payment = await retryRequest(() => 
  client.payments.create(paymentData)
);
```

---

## 📞 **SUPPORT & RESOURCES**

### **Documentation**
- **API Reference**: https://docs.advancia.com/api
- **SDK Documentation**: https://docs.advancia.com/sdks
- **Webhook Guide**: https://docs.advancia.com/webhooks
- **Best Practices**: https://docs.advancia.com/best-practices

### **Support Channels**
- **Email**: api-support@advancia.com
- **Slack**: https://advancia.slack.com
- **Status Page**: https://status.advancia.com
- **GitHub**: https://github.com/advancia/api-sdks

### **Developer Resources**
- **Postman Collection**: https://api.advancia.com/postman
- **OpenAPI Spec**: https://api.advancia.com/openapi.json
- **Rate Limits**: https://docs.advancia.com/rate-limits
- **Changelog**: https://docs.advancia.com/changelog

---

*Last Updated: January 2026*
*Version: 2.0*
*API Version: v1*
