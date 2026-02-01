# 🔧 UPDATE DATABASE CREDENTIALS - NEW PASSWORD

**New Password:** `F3vR2UQT49NK8ifI` (no special characters - no encoding needed!)

---

## ✅ **CORRECT DATABASE_URL**

**New connection string:**
```env
DATABASE_URL=postgresql://postgres:F3vR2UQT49NK8ifI@db.jwabwrcykdtpwdhwhmqq.supabase.co:5432/postgres
```

---

## 📋 **UPDATE BACKEND/.ENV**

### **Step 1: Open backend/.env**
```bash
notepad backend\.env
```

### **Step 2: Replace DATABASE_URL line**

**Replace with:**
```env
DATABASE_URL=postgresql://postgres:F3vR2UQT49NK8ifI@db.jwabwrcykdtpwdhwhmqq.supabase.co:5432/postgres
```

### **Step 3: Save the file**

---

## 🚀 **THEN RUN**

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
npm run dev
```

---

**This new password has no special characters, so no URL encoding needed! Much simpler! ✅**

**Please update `backend/.env` with this new DATABASE_URL and let me know to continue.**
