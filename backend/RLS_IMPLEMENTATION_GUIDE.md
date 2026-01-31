# 🔒 Row Level Security (RLS) Implementation Guide

**Priority**: 🔴 **CRITICAL**  
**Status**: Ready to Deploy  
**Date**: January 31, 2026

---

## 🚨 Security Vulnerability Summary

### Issue Identified:
**Sessions table exposed via API without RLS protection**

### Risk Level: 🔴 CRITICAL

**Potential Impact**:
- ✗ Refresh tokens can be used to mint new access tokens
- ✗ Exposure allows complete account takeover
- ✗ Bulk data exposure if table is readable by all API clients
- ✗ Regulatory/compliance issues (GDPR, HIPAA)
- ✗ Increased blast radius if API key is compromised

### Current Status:
- ✅ Comprehensive RLS migration script created
- ✅ Security middleware blocking API access
- ✅ Prisma schema updated with security documentation
- ⚠️ **Database RLS policies need to be applied**

---

## 📋 Implementation Checklist

### Phase 1: Immediate Protection (DONE ✅)
- [x] Security middleware blocks `/api/sessions` endpoints
- [x] Query parameter sanitization active
- [x] Response field sanitization active
- [x] Security headers on all responses
- [x] Comprehensive documentation created

### Phase 2: Database RLS (REQUIRED ⚠️)
- [ ] **Run RLS migration script** (see below)
- [ ] Verify RLS policies are active
- [ ] Test with authenticated users
- [ ] Test with anonymous users
- [ ] Verify service role access

### Phase 3: Verification (REQUIRED ⚠️)
- [ ] Confirm no unauthorized access possible
- [ ] Test session creation/deletion
- [ ] Verify audit logging works
- [ ] Check monitoring dashboard
- [ ] Rotate any potentially exposed tokens

---

## 🚀 How to Apply RLS

### Option 1: Via Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor**:
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Create new query

2. **Copy and Execute Migration**:
   ```bash
   # Copy the entire contents of:
   backend/scripts/add-session-rls.sql
   ```

3. **Execute the Script**:
   - Paste into SQL Editor
   - Click "Run"
   - Verify success messages

4. **Verify Policies**:
   - Go to Authentication > Policies
   - Confirm 5 policies exist for Session table
   - Verify RLS is enabled

### Option 2: Via Command Line

```bash
# Connect to your database
psql -d advancia_payledger -f backend/scripts/add-session-rls.sql

# Or if using Supabase connection string:
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -f backend/scripts/add-session-rls.sql
```

### Option 3: Via Prisma

```bash
# Create a new migration
cd backend
npx prisma migrate dev --name add_session_rls

# Then manually add the SQL from add-session-rls.sql to the migration file
```

---

## 🔐 What the RLS Migration Does

### 1. Revokes Public Access
```sql
REVOKE ALL ON "public"."Session" FROM public;
REVOKE ALL ON "public"."Session" FROM anon;
REVOKE ALL ON "public"."Session" FROM authenticated;
```

### 2. Enables Row Level Security
```sql
ALTER TABLE "public"."Session" ENABLE ROW LEVEL SECURITY;
```

### 3. Creates 5 Strict Policies

**Policy 1: SELECT (Read Own Sessions)**
- Users can only view their own sessions
- Matches `userId` with authenticated user ID

**Policy 2: DELETE (Logout)**
- Users can only delete their own sessions
- Enables "logout" functionality

**Policy 3: INSERT (Create Session)**
- Users can only create sessions for themselves
- Prevents session hijacking

**Policy 4: UPDATE (Modify Session)**
- Users can only update their own sessions
- Prevents session tampering

**Policy 5: BLOCK ANONYMOUS**
- Completely blocks all anonymous access
- No exceptions

### 4. Creates Safe View
```sql
CREATE VIEW "public"."sessions_safe" AS
SELECT id, userId, ipAddress, userAgent, expiresAt, createdAt
FROM "public"."Session";
-- Excludes: token, refreshToken
```

### 5. Adds Audit Logging
- Tracks all session access (INSERT, UPDATE, DELETE)
- Logs to AuditLog table
- Includes IP address and user ID

### 6. Helper Functions
- `get_user_sessions()` - Safely retrieve user sessions
- `revoke_all_user_sessions()` - Logout from all devices
- `cleanup_expired_sessions()` - Remove expired sessions

### 7. Performance Indexes
- `idx_session_user_id` - Fast user lookups
- `idx_session_expires_at` - Cleanup queries
- `idx_session_token` - Token validation
- `idx_session_user_expires` - Combined queries

### 8. Monitoring Dashboard
- `sessions_admin_monitor` view
- Shows active/expired session counts
- Unique user tracking

---

## 🧪 Testing & Verification

### Test 1: Verify RLS is Enabled
```sql
-- Should return true
SELECT relrowsecurity 
FROM pg_class 
WHERE relname = 'Session' AND relnamespace = 'public'::regnamespace;
```

### Test 2: Count Policies
```sql
-- Should return 5 or more
SELECT COUNT(*) 
FROM pg_policies 
WHERE tablename = 'Session' AND schemaname = 'public';
```

### Test 3: Test Anonymous Access (Should Fail)
```sql
-- Set role to anon
SET ROLE anon;

-- This should return 0 rows or error
SELECT * FROM "public"."Session";

-- Reset role
RESET ROLE;
```

### Test 4: Test Authenticated Access
```sql
-- As authenticated user, should only see own sessions
SELECT * FROM "public"."Session" 
WHERE "userId" = auth.uid()::text;
```

### Test 5: Test Safe View
```sql
-- Should work and exclude token/refreshToken
SELECT * FROM "public"."sessions_safe" LIMIT 5;
```

### Test 6: Test Helper Functions
```sql
-- Get user sessions (replace with actual user ID)
SELECT * FROM get_user_sessions('user_id_here');

-- Revoke all sessions (logout all devices)
SELECT revoke_all_user_sessions('user_id_here');
```

---

## 📊 Backend Code Updates Required

### Update Auth Controller

**Before** (Insecure):
```typescript
// DON'T DO THIS - Exposes refresh tokens
const sessions = await prisma.session.findMany({
  where: { userId: user.id }
});
```

**After** (Secure):
```typescript
// Use safe view that excludes tokens
const sessions = await prisma.$queryRaw`
  SELECT * FROM sessions_safe 
  WHERE "userId" = ${user.id}
`;

// Or use helper function
const sessions = await prisma.$queryRaw`
  SELECT * FROM get_user_sessions(${user.id})
`;
```

### Never Return Tokens in API Responses

**Bad** ❌:
```typescript
res.json({
  session: {
    id: session.id,
    token: session.token,           // ❌ NEVER
    refreshToken: session.refreshToken, // ❌ NEVER
    userId: session.userId
  }
});
```

**Good** ✅:
```typescript
res.json({
  session: {
    id: session.id,
    userId: session.userId,
    ipAddress: session.ipAddress,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt
    // token and refreshToken excluded
  }
});
```

### Use Service Role for Backend Operations

```typescript
// backend/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Service role bypasses RLS (use carefully!)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Never expose to client
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Use for backend session management
const session = await supabaseAdmin
  .from('Session')
  .select('*')
  .eq('userId', userId)
  .single();
```

---

## 🔍 Monitoring & Maintenance

### Daily Checks
```sql
-- Check for expired sessions
SELECT COUNT(*) FROM "public"."Session" 
WHERE "expiresAt" < NOW();

-- Run cleanup if needed
SELECT cleanup_expired_sessions();
```

### Weekly Monitoring
```sql
-- View session statistics
SELECT * FROM "public"."sessions_admin_monitor";

-- Check audit logs for suspicious activity
SELECT * FROM "public"."AuditLog" 
WHERE resource = 'Session' 
AND "createdAt" > NOW() - INTERVAL '7 days'
ORDER BY "createdAt" DESC;
```

### Monthly Security Audit
```sql
-- List all policies
SELECT * FROM pg_policies 
WHERE tablename = 'Session';

-- Verify RLS is still enabled
SELECT relrowsecurity FROM pg_class 
WHERE relname = 'Session';

-- Check for any public grants (should be none)
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'Session';
```

---

## ⚠️ Important Security Notes

### DO ✅
- ✅ Always use `sessions_safe` view for client queries
- ✅ Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- ✅ Use helper functions for session management
- ✅ Monitor audit logs regularly
- ✅ Run cleanup_expired_sessions() periodically
- ✅ Rotate tokens if exposure is suspected
- ✅ Test RLS policies after any schema changes

### DON'T ❌
- ❌ Never expose service role key to clients
- ❌ Never return `token` or `refreshToken` in API responses
- ❌ Never disable RLS on Session table
- ❌ Never grant public SELECT on Session table
- ❌ Never bypass RLS in client-side code
- ❌ Never log refresh tokens
- ❌ Never store tokens in localStorage (use httpOnly cookies)

---

## 🚨 Emergency Response

### If Tokens Are Exposed:

1. **Immediate Actions**:
   ```sql
   -- Revoke all sessions immediately
   DELETE FROM "public"."Session";
   ```

2. **Rotate Secrets**:
   ```bash
   # Generate new JWT secrets
   openssl rand -base64 32  # New JWT_SECRET
   openssl rand -base64 32  # New JWT_REFRESH_SECRET
   ```

3. **Force Re-authentication**:
   - Update JWT secrets in environment
   - Restart backend servers
   - All users will need to login again

4. **Audit & Investigate**:
   ```sql
   -- Check audit logs
   SELECT * FROM "public"."AuditLog" 
   WHERE resource = 'Session' 
   ORDER BY "createdAt" DESC 
   LIMIT 100;
   ```

5. **Notify Users** (if required by regulations):
   - Send security alert emails
   - Document the incident
   - Report to compliance team

---

## 📈 Success Metrics

### After RLS Implementation:

**Security**:
- ✅ 0 unauthorized session accesses
- ✅ 100% of sessions protected by RLS
- ✅ All token exposure vectors closed

**Performance**:
- ✅ No performance degradation
- ✅ Indexed queries remain fast
- ✅ Cleanup runs automatically

**Compliance**:
- ✅ GDPR compliant (data access control)
- ✅ HIPAA compliant (audit logging)
- ✅ SOC 2 ready (access controls)

---

## 🎯 Post-Implementation Checklist

- [ ] RLS migration executed successfully
- [ ] All 5 policies created and active
- [ ] Safe view `sessions_safe` exists
- [ ] Helper functions working
- [ ] Audit logging enabled
- [ ] Monitoring dashboard accessible
- [ ] Backend code updated to use safe view
- [ ] No API responses contain tokens
- [ ] Service role key secured
- [ ] Documentation updated
- [ ] Team trained on new procedures
- [ ] Incident response plan ready

---

## 📞 Support

### If You Need Help:

1. **Check Logs**:
   ```sql
   -- View recent errors
   SELECT * FROM pg_stat_activity 
   WHERE state = 'active';
   ```

2. **Verify Setup**:
   ```bash
   # Run verification script
   psql -d advancia_payledger -c "
     SELECT relrowsecurity FROM pg_class 
     WHERE relname = 'Session';
   "
   ```

3. **Rollback (Emergency Only)**:
   ```sql
   -- Disable RLS (NOT RECOMMENDED)
   ALTER TABLE "public"."Session" DISABLE ROW LEVEL SECURITY;
   
   -- Drop policies
   DROP POLICY IF EXISTS sessions_select_owner ON "public"."Session";
   DROP POLICY IF EXISTS sessions_delete_owner ON "public"."Session";
   DROP POLICY IF EXISTS sessions_insert_owner ON "public"."Session";
   DROP POLICY IF EXISTS sessions_update_owner ON "public"."Session";
   DROP POLICY IF EXISTS sessions_block_anon ON "public"."Session";
   ```

---

## 🎓 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Status**: ✅ **READY TO DEPLOY**  
**Priority**: 🔴 **CRITICAL - Deploy ASAP**  
**Estimated Time**: 15 minutes  
**Risk if Not Applied**: Account takeover, data breach, compliance violations

---

*Last Updated: January 31, 2026*  
*Prepared by: Cascade AI Assistant*
