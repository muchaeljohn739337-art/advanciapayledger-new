# 🔧 FIX DATABASE_URL - URL Encoding Required

**Error:** `invalid port number in database URL`
**Cause:** Special characters in password need URL encoding

---

## ⚠️ **THE PROBLEM**

Your Supabase password contains special characters: `Good_mother1!?`

The characters `!` and `?` need to be URL-encoded in the DATABASE_URL.

---

## ✅ **THE FIX**

### **Step 1: Open backend/.env**
```bash
# Open in your editor
notepad backend\.env
```

### **Step 2: Replace DATABASE_URL**

**WRONG (Current):**
```env
DATABASE_URL=postgresql://postgres.jwabwrcykdtpwdhwhmqq:Good_mother1!?@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
```

**CORRECT (URL-encoded):**
```env
DATABASE_URL=postgresql://postgres.jwabwrcykdtpwdhwhmqq:Good_mother1%21%3F@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
```

**Changes:**
- `!` → `%21`
- `?` → `%3F`

### **Step 3: Save the file**

---

## 📋 **COMPLETE BACKEND .ENV**

Your `backend/.env` should have:

```env
# Database (URL-encoded password)
DATABASE_URL=postgresql://postgres.jwabwrcykdtpwdhwhmqq:Good_mother1%21%3F@aws-1-eu-central-1.pooler.supabase.com:5432/postgres

# Supabase Auth
SUPABASE_URL=https://jwabwrcykdtpwdhwhmqq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3YWJ3cmN5a2R0cHdkaHdobXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NTY0NzcsImV4cCI6MjA1MjEzMjQ3N30.YcVJKqZxQxQxQxQxQxQxQxQxQxQxQxQxQxQxQxQ
SUPABASE_SERVICE_ROLE_KEY=sb_publishable_feavCnnLOlbVTiU0jkQrIg_GpIBiqYd
SUPABASE_JWT_SECRET=154fb428-003c-44e5-a8b1-42cf8729d0e5

# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# JWT (fallback)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
```

---

## 🚀 **AFTER FIXING**

Once you save the file, run:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
npm run dev
```

---

## 📝 **URL ENCODING REFERENCE**

Common special characters that need encoding:
- `!` → `%21`
- `?` → `%3F`
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `:` → `%3A`

---

**Please update `backend/.env` with the URL-encoded DATABASE_URL, then let me know to continue.**
