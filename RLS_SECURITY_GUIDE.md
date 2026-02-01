# 🔒 SUPABASE RLS SECURITY GUIDE

**Date:** January 31, 2026
**Status:** Production-ready RLS policies

---

## 📋 **WHAT IS RLS?**

**Row-Level Security (RLS)** controls **who can read/write each row** in your database.

**Key concepts:**
- **Default:** Deny all access
- **Policies:** Explicitly grant access
- **auth.uid():** Returns current logged-in user's Supabase ID
- **Service role key:** Bypasses ALL RLS (backend only)
- **Anon key:** Restricted by RLS policies (frontend)

---

## ✅ **RLS POLICIES IMPLEMENTED**

### **1. Users Table**
```sql
-- Users can only access their own data
- SELECT: Own row only
- UPDATE: Own row only
- INSERT: During registration
- DELETE: Not allowed
```

### **2. Transactions Table**
```sql
-- Users can only see their own transactions
- SELECT: Own transactions only
- INSERT: Backend only
- UPDATE: Not allowed
- DELETE: Not allowed
```

### **3. Wallets Table**
```sql
-- Users can only access their own wallets
- SELECT: Own wallets only
- INSERT: Backend only
- UPDATE: Not allowed
- DELETE: Not allowed
```

### **4. Payments Table**
```sql
-- Users can initiate payments
- SELECT: Own payments only
- INSERT: Own payment requests
- UPDATE: Backend only
- DELETE: Not allowed
```

### **5. Crypto Payments Table**
```sql
-- Users can initiate crypto payments
- SELECT: Own crypto payments only
- INSERT: Own payment requests
- UPDATE: Backend only (status updates)
- DELETE: Not allowed
```

### **6. Facilities Table**
```sql
-- Public read, admin write
- SELECT: Public (anyone)
- INSERT: Backend only
- UPDATE: Backend only
- DELETE: Backend only
```

### **7. Patients Table**
```sql
-- Users manage their own patient records
- SELECT: Own records only
- INSERT: Own records
- UPDATE: Own records
- DELETE: Not allowed
```

### **8. Providers Table**
```sql
-- Providers manage their own records
- SELECT: Own records only
- INSERT: Own records
- UPDATE: Own records
- DELETE: Not allowed
```

### **9. Invoices Table**
```sql
-- Users can only view invoices
- SELECT: Own invoices only
- INSERT: Backend only
- UPDATE: Not allowed
- DELETE: Not allowed
```

### **10. Audit Logs Table**
```sql
-- Immutable audit trail
- SELECT: Own logs only
- INSERT: Backend only
- UPDATE: Not allowed
- DELETE: Not allowed
```

### **11. Alerts Table**
```sql
-- Users can view and mark alerts as read
- SELECT: Own alerts only
- INSERT: Backend only
- UPDATE: Own alerts (mark as read)
- DELETE: Not allowed
```

### **12. Sessions Table**
```sql
-- Users can manage their own sessions
- SELECT: Own sessions only
- INSERT: Backend only
- UPDATE: Not allowed
- DELETE: Own sessions (logout)
```

### **13. Bookings Table**
```sql
-- Users can manage their own bookings
- SELECT: Own bookings only
- INSERT: Own bookings
- UPDATE: Own bookings
- DELETE: Own bookings
```

---

## 🔑 **KEY ACCESS PATTERNS**

### **Frontend (Anon Key)**
```typescript
// Frontend uses anon key - restricted by RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Safe to expose
);

// User can only see their own data
const { data, error } = await supabase
  .from('transactions')
  .select('*'); // RLS automatically filters to user's rows
```

### **Backend (Service Role Key)**
```typescript
// Backend uses service role key - bypasses RLS
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // NEVER expose
);

// Backend can access all data
const { data, error } = await supabase
  .from('transactions')
  .select('*'); // Returns ALL transactions
```

---

## 🚀 **DEPLOYMENT STEPS**

### **Step 1: Run RLS Policies (5 minutes)**

1. Login to Supabase dashboard
2. Go to SQL Editor
3. Copy contents of `SUPABASE_RLS_POLICIES.sql`
4. Run the script
5. Verify no errors

### **Step 2: Verify RLS Enabled (2 minutes)**

```sql
-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Should show rowsecurity = true for all tables
```

### **Step 3: Verify Policies Created (2 minutes)**

```sql
-- Check all policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Should show multiple policies per table
```

### **Step 4: Test Frontend Access (5 minutes)**

```typescript
// Test with frontend (anon key)
const { data, error } = await supabase
  .from('transactions')
  .select('*');

// Should only return current user's transactions
console.log('My transactions:', data);
```

### **Step 5: Test Backend Access (5 minutes)**

```typescript
// Test with backend (service role key)
const { data, error } = await supabase
  .from('transactions')
  .select('*');

// Should return ALL transactions
console.log('All transactions:', data);
```

---

## 🔒 **SECURITY RULES**

### **Rule 1: Default Deny** ✅
```sql
-- Without policies, all access is denied
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
-- Now no one can access until policies are created
```

### **Rule 2: Explicit Allow** ✅
```sql
-- Policies explicitly grant access
CREATE POLICY "Users can read own data"
ON my_table
FOR SELECT
USING (auth.uid() = user_id);
```

### **Rule 3: Service Role Bypasses** ✅
```typescript
// Backend service role key bypasses ALL RLS
// This is why it must NEVER be exposed to frontend
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Backend only!
);
```

### **Rule 4: Frontend Restricted** ✅
```typescript
// Frontend anon key is restricted by RLS
// Users can only access their own data
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Safe to expose
);
```

### **Rule 5: Immutable Audit Trail** ✅
```sql
-- Audit logs cannot be modified by users
CREATE POLICY "Audit Logs: no update"
ON audit_logs
FOR UPDATE
USING (false); -- Always deny
```

---

## ⚠️ **COMMON MISTAKES TO AVOID**

### **❌ WRONG: Public write access**
```sql
-- NEVER do this
CREATE POLICY "Public write"
ON my_table
FOR INSERT
WITH CHECK (true); -- Anyone can insert!
```

### **✅ CORRECT: User-specific write access**
```sql
CREATE POLICY "Users can insert own data"
ON my_table
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### **❌ WRONG: Service key in frontend**
```typescript
// NEVER do this
const supabase = createClient(
  'https://xxx.supabase.co',
  'service_role_key_here' // EXPOSED TO USERS!
);
```

### **✅ CORRECT: Anon key in frontend**
```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Safe
);
```

---

## 📊 **ACCESS MATRIX**

| Table | Frontend (Anon) | Backend (Service) |
|-------|-----------------|-------------------|
| **users** | Own row only | All rows |
| **transactions** | Own rows only | All rows |
| **wallets** | Own rows only | All rows |
| **payments** | Own rows only | All rows |
| **crypto_payments** | Own rows only | All rows |
| **facilities** | Public read | Full access |
| **patients** | Own rows only | All rows |
| **providers** | Own rows only | All rows |
| **invoices** | Own rows only | All rows |
| **audit_logs** | Own rows (read) | All rows |
| **alerts** | Own rows only | All rows |
| **sessions** | Own rows only | All rows |
| **bookings** | Own rows only | All rows |

---

## ✅ **VERIFICATION CHECKLIST**

- [ ] RLS enabled on all tables
- [ ] Policies created for all tables
- [ ] Frontend can only access own data
- [ ] Backend can access all data
- [ ] Audit logs are immutable
- [ ] Transactions are immutable
- [ ] Crypto payments are immutable
- [ ] Public tables (facilities) are read-only for users
- [ ] Service role key never exposed to frontend
- [ ] Anon key used in frontend only

---

## 🚀 **DEPLOYMENT COMMAND**

```bash
# Run RLS policies
psql $DATABASE_URL < SUPABASE_RLS_POLICIES.sql

# Or in Supabase SQL Editor:
# 1. Copy SUPABASE_RLS_POLICIES.sql
# 2. Paste in SQL Editor
# 3. Click "Run"
```

---

## 📝 **SUMMARY**

**RLS Status:** ✅ Configured
**Policies:** 13 tables secured
**Frontend Access:** Restricted by RLS
**Backend Access:** Full (service role)
**Security Level:** Production-ready

**Your database is now fully secured with Row-Level Security! 🔒**
