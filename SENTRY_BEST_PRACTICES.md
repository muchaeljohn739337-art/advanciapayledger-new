# 🎯 Sentry Best Practices - Advancia PayLedger

## 📊 Current Implementation vs Best Practices

### ✅ What You Already Have

1. **Exception Catching** ✅
   - `captureException()` helper in backend
   - `captureComponentError()` for React errors in frontend
   - `captureAPIError()` for API errors in frontend

2. **HIPAA Compliance** ✅
   - PII filtering (email, IP, SSN, DOB)
   - Sensitive header removal
   - Query parameter sanitization

3. **Performance Monitoring** ✅
   - Traces sample rate configured
   - Browser tracing integration (frontend)
   - Node profiling integration (backend)

### ⚠️ What's Missing

1. **Custom Span Instrumentation** ❌
   - No `Sentry.startSpan()` usage
   - No UI interaction tracking
   - No API call tracing

2. **Logger Integration** ❌
   - No `enableLogs: true` in config
   - No `consoleLoggingIntegration`
   - No structured logging with Sentry

3. **NextJS-Specific Files** ⚠️
   - Missing `instrumentation-client.ts`
   - Missing `sentry.server.config.ts`
   - Missing `sentry.edge.config.ts`

---

## 🔧 Recommended Improvements

### 1. Add Custom Span Instrumentation

#### **Backend API Calls**
```typescript
// backend/src/controllers/paymentController.ts
import * as Sentry from '@sentry/node';

export async function createPayment(req: Request, res: Response) {
  return Sentry.startSpan(
    {
      op: 'payment.create',
      name: 'Create Payment',
    },
    async (span) => {
      try {
        const { amount, patientId, facilityId } = req.body;
        
        span.setAttribute('payment.amount', amount);
        span.setAttribute('payment.currency', 'USD');
        span.setAttribute('facility.id', facilityId);
        
        const payment = await prisma.payment.create({
          data: { amount, patientId, facilityId, status: 'PENDING' }
        });
        
        span.setAttribute('payment.id', payment.id);
        span.setAttribute('payment.status', payment.status);
        
        res.json(payment);
      } catch (error) {
        span.setStatus({ code: 2, message: 'Payment creation failed' });
        Sentry.captureException(error);
        res.status(500).json({ error: 'Payment creation failed' });
      }
    }
  );
}
```

#### **Frontend UI Interactions**
```typescript
// frontend/components/PaymentForm.tsx
import * as Sentry from '@sentry/nextjs';

function PaymentForm() {
  const handleSubmitPayment = async (data: PaymentData) => {
    Sentry.startSpan(
      {
        op: 'ui.action',
        name: 'Submit Payment Form',
      },
      async (span) => {
        span.setAttribute('payment.amount', data.amount);
        span.setAttribute('payment.method', data.paymentMethod);
        
        try {
          const response = await fetch('/api/payments', {
            method: 'POST',
            body: JSON.stringify(data),
          });
          
          span.setAttribute('response.status', response.status);
          
          if (!response.ok) {
            throw new Error('Payment failed');
          }
          
          const result = await response.json();
          span.setAttribute('payment.id', result.id);
          
        } catch (error) {
          span.setStatus({ code: 2, message: 'Payment submission failed' });
          Sentry.captureException(error);
        }
      }
    );
  };
  
  return (
    <form onSubmit={handleSubmitPayment}>
      {/* form fields */}
    </form>
  );
}
```

#### **Frontend API Calls**
```typescript
// frontend/lib/api.ts
import * as Sentry from '@sentry/nextjs';

export async function fetchPatientData(patientId: string) {
  return Sentry.startSpan(
    {
      op: 'http.client',
      name: `GET /api/patients/${patientId}`,
    },
    async (span) => {
      span.setAttribute('patient.id', patientId);
      
      try {
        const response = await fetch(`/api/patients/${patientId}`);
        
        span.setAttribute('http.status_code', response.status);
        span.setAttribute('http.method', 'GET');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        return data;
        
      } catch (error) {
        span.setStatus({ code: 2, message: 'Patient fetch failed' });
        Sentry.captureException(error);
        throw error;
      }
    }
  );
}
```

### 2. Add Logger Integration

#### **Backend Logger Config**
```typescript
// backend/src/config/sentry.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  
  // Enable structured logging
  enableLogs: true,
  
  integrations: [
    nodeProfilingIntegration(),
    
    // Console logging integration
    Sentry.consoleLoggingIntegration({
      levels: ['log', 'warn', 'error']
    }),
  ],
  
  // ... rest of config
});

// Export logger
export const { logger } = Sentry;
```

#### **Frontend Logger Config**
```typescript
// frontend/instrumentation-client.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  
  // Enable structured logging
  enableLogs: true,
  
  integrations: [
    // Console logging integration
    Sentry.consoleLoggingIntegration({
      levels: ['log', 'warn', 'error']
    }),
    
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
    
    new Sentry.BrowserTracing(),
  ],
  
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

export const { logger } = Sentry;
```

#### **Logger Usage Examples**
```typescript
// backend/src/controllers/paymentController.ts
import { logger } from '../config/sentry';

export async function processPayment(req: Request, res: Response) {
  const { paymentId, amount } = req.body;
  
  logger.info('Processing payment', {
    paymentId,
    amount,
    currency: 'USD',
  });
  
  try {
    const result = await stripeService.charge(amount);
    
    logger.info('Payment processed successfully', {
      paymentId,
      stripeChargeId: result.id,
    });
    
    res.json(result);
    
  } catch (error) {
    logger.error('Payment processing failed', {
      paymentId,
      amount,
      error: error.message,
    });
    
    res.status(500).json({ error: 'Payment failed' });
  }
}
```

```typescript
// Example with template literals
const userId = '12345';
logger.debug(logger.fmt`Cache miss for user: ${userId}`);

// Rate limiting warning
logger.warn('Rate limit reached for endpoint', {
  endpoint: '/api/payments',
  userId: req.user.id,
  isEnterprise: false,
});

// Critical database error
logger.fatal('Database connection pool exhausted', {
  database: 'postgres',
  activeConnections: 100,
  maxConnections: 100,
});
```

---

## 📁 Required File Structure for Next.js

### **1. Client-Side Initialization**
**File:** `frontend/instrumentation-client.ts`
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  
  enableLogs: true,
  
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
    new Sentry.Replay({ maskAllText: true, blockAllMedia: true }),
    new Sentry.BrowserTracing(),
  ],
  
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### **2. Server-Side Initialization**
**File:** `frontend/sentry.server.config.ts`
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  
  enableLogs: true,
  
  tracesSampleRate: 0.1,
  
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
});
```

### **3. Edge Runtime Initialization**
**File:** `frontend/sentry.edge.config.ts`
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  
  tracesSampleRate: 0.1,
});
```

---

## 🎯 Implementation Checklist

### **Phase 1: Logger Integration** (1 hour)
- [ ] Add `enableLogs: true` to backend Sentry config
- [ ] Add `enableLogs: true` to frontend Sentry config
- [ ] Add `consoleLoggingIntegration` to both
- [ ] Export `logger` from config files
- [ ] Replace console.log with Sentry logger in critical paths

### **Phase 2: Span Instrumentation** (2 hours)
- [ ] Add spans to payment processing
- [ ] Add spans to crypto transactions
- [ ] Add spans to database queries
- [ ] Add spans to API calls (frontend)
- [ ] Add spans to UI interactions (buttons, forms)

### **Phase 3: Next.js Structure** (30 min)
- [ ] Create `instrumentation-client.ts`
- [ ] Create `sentry.server.config.ts`
- [ ] Create `sentry.edge.config.ts`
- [ ] Move initialization from `lib/sentry.ts` to proper files

### **Phase 4: Testing** (1 hour)
- [ ] Test logger output in Sentry dashboard
- [ ] Test span creation and attributes
- [ ] Test error capture with context
- [ ] Verify HIPAA compliance still works

---

## 📊 Expected Benefits

### **With Logger Integration:**
- ✅ Structured logs in Sentry dashboard
- ✅ Better debugging with context
- ✅ Automatic log aggregation
- ✅ Search and filter logs easily

### **With Span Instrumentation:**
- ✅ Performance bottleneck identification
- ✅ API call timing analysis
- ✅ User interaction tracking
- ✅ End-to-end transaction tracing

### **With Proper Next.js Structure:**
- ✅ Correct initialization for all runtimes
- ✅ Better error capture coverage
- ✅ Proper source map support
- ✅ Edge function monitoring

---

## 🚀 Quick Start

### **1. Update Backend Config**
```bash
# Edit backend/src/config/sentry.ts
# Add enableLogs: true and consoleLoggingIntegration
```

### **2. Create Next.js Config Files**
```bash
cd frontend
touch instrumentation-client.ts sentry.server.config.ts sentry.edge.config.ts
```

### **3. Add Span to Critical Path**
```typescript
// Example: Add to payment creation
Sentry.startSpan({ op: 'payment.create', name: 'Create Payment' }, async (span) => {
  // payment logic
});
```

### **4. Test**
```bash
npm run dev
# Trigger errors and check Sentry dashboard
```

---

## 📚 Resources

- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Performance Monitoring:** https://docs.sentry.io/platforms/javascript/performance/
- **Structured Logging:** https://docs.sentry.io/platforms/javascript/guides/node/logs/

---

**Your Sentry setup is 95% complete - add these enhancements for production-grade monitoring!** 🎯
