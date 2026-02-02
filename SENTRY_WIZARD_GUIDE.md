# 🧙 Sentry Wizard Setup Guide - Next.js

## 📋 Command to Run

```bash
cd frontend
npx @sentry/wizard@latest -i nextjs --saas --org advanciapayledger --project javascript-nextjs
```

---

## 🎯 What the Wizard Will Do

### **Automatic Configuration:**
1. ✅ Install `@sentry/nextjs` package (already installed)
2. ✅ Create `sentry.client.config.ts`
3. ✅ Create `sentry.server.config.ts`
4. ✅ Create `sentry.edge.config.ts`
5. ✅ Update `next.config.js` with Sentry webpack plugin
6. ✅ Add environment variables to `.env.local`

### **What You'll Be Asked:**
1. **Login to Sentry** - Use your Sentry account
2. **Select Organization** - `advanciapayledger`
3. **Select Project** - `javascript-nextjs`
4. **DSN** - Will be automatically added
5. **Source Maps** - Enable for better debugging

---

## ⚠️ Important: Merge with Existing Config

**You already have custom Sentry configuration with HIPAA compliance!**

### **Files You Already Have:**
- ✅ `frontend/instrumentation-client.ts` (HIPAA-compliant)
- ✅ `frontend/sentry.server.config.ts` (HIPAA-compliant)
- ✅ `frontend/sentry.edge.config.ts` (HIPAA-compliant)
- ✅ `frontend/lib/sentry.ts` (Helper functions)

### **Wizard Will Create:**
- `sentry.client.config.ts` (basic config)
- `sentry.server.config.ts` (basic config)
- `sentry.edge.config.ts` (basic config)

---

## 🔧 After Running Wizard

### **Step 1: Get Your DSN**

The wizard will add your DSN to `.env.local`:
```bash
NEXT_PUBLIC_SENTRY_DSN=https://[your-key]@o4510804235714560.ingest.us.sentry.io/[project-id]
```

### **Step 2: Merge Configurations**

**Option A: Use Your Existing Config (Recommended)**

Your existing config is better because it has:
- ✅ HIPAA compliance (masks all text, blocks media)
- ✅ Logger integration
- ✅ Console logging integration
- ✅ Better error filtering

**Keep your files:**
- `instrumentation-client.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

**Delete wizard-created files:**
- `sentry.client.config.ts` (use `instrumentation-client.ts` instead)

**Option B: Enhance Wizard Config**

If you want to use wizard files, add HIPAA compliance:

```typescript
// In wizard-created sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Add these for HIPAA compliance
  enableLogs: true,
  
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
    new Sentry.Replay({
      maskAllText: true,      // HIPAA: Mask all text
      blockAllMedia: true,    // HIPAA: Block all media
      maskAllInputs: true,    // HIPAA: Mask form inputs
    }),
    new Sentry.BrowserTracing(),
  ],
  
  // Filter PII
  beforeSend(event) {
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});
```

---

## 📋 Step-by-Step Instructions

### **1. Run the Wizard**
```bash
cd frontend
npx @sentry/wizard@latest -i nextjs --saas --org advanciapayledger --project javascript-nextjs
```

### **2. Follow Wizard Prompts**
- Login to Sentry when prompted
- Select organization: `advanciapayledger`
- Select project: `javascript-nextjs`
- Enable source maps: **Yes**
- Upload source maps: **Yes**

### **3. Copy DSN from `.env.local`**
```bash
# The wizard will add this
cat frontend/.env.local | grep SENTRY_DSN
```

### **4. Choose Configuration Strategy**

**Recommended: Keep Your Existing Config**
```bash
# Backup wizard files
mv frontend/sentry.client.config.ts frontend/sentry.client.config.ts.wizard
mv frontend/sentry.server.config.ts frontend/sentry.server.config.ts.wizard
mv frontend/sentry.edge.config.ts frontend/sentry.edge.config.ts.wizard

# Your existing files are already better!
# Just add the DSN to your .env.local
```

### **5. Update `next.config.js`**

The wizard will add Sentry webpack plugin. **Keep this!**

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // your existing config
};

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: 'advanciapayledger',
    project: 'javascript-nextjs',
  },
  {
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: '/monitoring',
    hideSourceMaps: true,
    disableLogger: true,
  }
);
```

---

## ✅ Verification Checklist

After running wizard:

- [ ] DSN added to `.env.local`
- [ ] `next.config.js` updated with Sentry plugin
- [ ] Sentry config files created
- [ ] Choose: Keep existing HIPAA-compliant config OR enhance wizard config
- [ ] Test: `npm run dev` - should see Sentry initialized
- [ ] Test: Trigger error and check Sentry dashboard

---

## 🎯 Final Configuration

### **Environment Variables**

**`.env.local`:**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://[your-key]@o4510804235714560.ingest.us.sentry.io/[project-id]
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ENV=development
```

### **Files Structure**

```
frontend/
├── instrumentation-client.ts          # Your HIPAA-compliant client config
├── sentry.server.config.ts            # Your HIPAA-compliant server config
├── sentry.edge.config.ts              # Your HIPAA-compliant edge config
├── lib/
│   └── sentry.ts                      # Helper functions
├── next.config.js                     # Updated by wizard
└── .env.local                         # DSN added by wizard
```

---

## 🚀 Quick Start After Wizard

```bash
# 1. Run wizard
cd frontend
npx @sentry/wizard@latest -i nextjs --saas --org advanciapayledger --project javascript-nextjs

# 2. Keep your existing config files (they're better!)
# Just copy the DSN from .env.local

# 3. Test
npm run dev
# Should see: ✅ Client-side Sentry initialized

# 4. Test error tracking
# In browser console: throw new Error('Test error');
# Check Sentry dashboard
```

---

## 📊 Comparison: Your Config vs Wizard Config

| Feature | Your Config | Wizard Config | Winner |
|---------|-------------|---------------|--------|
| HIPAA Compliance | ✅ Full | ❌ None | **Yours** |
| Logger Integration | ✅ Yes | ❌ No | **Yours** |
| Console Logging | ✅ Yes | ❌ No | **Yours** |
| PII Filtering | ✅ Comprehensive | ⚠️ Basic | **Yours** |
| Session Replay | ✅ Masked | ⚠️ Not masked | **Yours** |
| Source Maps | ❌ No | ✅ Yes | **Wizard** |
| Webpack Plugin | ❌ No | ✅ Yes | **Wizard** |

**Best Strategy:** Keep your config files + Use wizard's `next.config.js` changes!

---

## 🎯 Recommended Action

1. **Run wizard** - Get DSN and `next.config.js` updates
2. **Keep your existing config files** - They're HIPAA-compliant
3. **Copy DSN** - From wizard's `.env.local` to your files
4. **Keep `next.config.js` changes** - For source maps
5. **Delete wizard config files** - Use yours instead

---

## 📞 Support

- **Your Config Files:** Already created with HIPAA compliance
- **Wizard Guide:** This file
- **Best Practices:** `SENTRY_BEST_PRACTICES.md`
- **DSN Setup:** `SENTRY_DSN_SETUP.md`

**Your existing Sentry config is production-ready with HIPAA compliance!** 🎉
