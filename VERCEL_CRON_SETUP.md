# ⏰ Vercel Cron Jobs - Complete Setup Guide

## ✅ What I've Created

I've set up **4 automated cron jobs** for your Advancia PayLedger system:

### 1. **Health Check** - Every 5 minutes
- **Path**: `/api/cron/health-check`
- **Schedule**: `*/5 * * * *` (every 5 minutes)
- **Purpose**: Monitors backend health and keeps it warm

### 2. **Session Cleanup** - Daily at 2 AM
- **Path**: `/api/cron/cleanup-sessions`
- **Schedule**: `0 2 * * *` (2:00 AM daily)
- **Purpose**: Removes expired sessions from database

### 3. **Booking Reminders** - Daily at 8 AM
- **Path**: `/api/cron/booking-reminders`
- **Schedule**: `0 8 * * *` (8:00 AM daily)
- **Purpose**: Sends appointment reminders to patients

### 4. **Daily Reports** - Daily at 9 AM
- **Path**: `/api/cron/daily-reports`
- **Schedule**: `0 9 * * *` (9:00 AM daily)
- **Purpose**: Generates and sends daily admin reports

---

## 📁 Files Created

```
frontend/
├── app/api/cron/
│   ├── health-check/route.ts       ✅ Created
│   ├── cleanup-sessions/route.ts   ✅ Created
│   ├── booking-reminders/route.ts  ✅ Created
│   └── daily-reports/route.ts      ✅ Created
└── vercel.json                      ✅ Updated with cron config
```

---

## 🔐 Step 1: Add CRON_SECRET to Vercel

**This is REQUIRED for security!**

```powershell
cd c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\frontend

# Add CRON_SECRET environment variable
vercel env add CRON_SECRET production

# When prompted, enter a strong random secret:
# Example: cron_secret_advancia_2026_xyz123abc456
```

**Or via Vercel Dashboard:**
1. Go to your project on Vercel
2. Settings → Environment Variables
3. Add new variable:
   - **Name**: `CRON_SECRET`
   - **Value**: `your-strong-random-secret-here`
   - **Environment**: Production

---

## 🚀 Step 2: Deploy to Vercel

```powershell
cd c:\Users\mucha.DESKTOP-H7T9NPM\Downloads\productution\frontend

# Deploy with cron jobs
vercel --prod
```

After deployment, Vercel will automatically:
- Register all cron jobs
- Start running them on schedule
- Add the `CRON_SECRET` to Authorization headers

---

## 📊 Cron Schedule Reference

```
*/5 * * * *  = Every 5 minutes
0 2 * * *    = Daily at 2:00 AM
0 8 * * *    = Daily at 8:00 AM
0 9 * * *    = Daily at 9:00 AM
0 */6 * * *  = Every 6 hours
0 0 * * 0    = Weekly on Sunday at midnight
0 0 1 * *    = Monthly on the 1st at midnight
```

---

## 🔧 Backend Endpoints Needed

Your backend needs to implement these endpoints for the cron jobs to work:

### 1. Session Cleanup
```typescript
// backend/src/routes/admin.ts
router.post('/cleanup/sessions', async (req, res) => {
  // Verify it's a cron job
  if (req.headers['x-cron-job'] !== 'true') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Delete expired sessions
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });

  res.json({ 
    ok: true, 
    deletedSessions: result.count 
  });
});
```

### 2. Booking Reminders
```typescript
// backend/src/routes/bookings.ts
router.post('/send-reminders', async (req, res) => {
  if (req.headers['x-cron-job'] !== 'true') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Get bookings for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const bookings = await prisma.booking.findMany({
    where: {
      bookingDate: tomorrow,
      status: 'confirmed'
    },
    include: {
      patient: true,
      doctor: true,
      chamber: true
    }
  });

  // Send reminder emails/SMS
  const sent = await Promise.all(
    bookings.map(booking => sendReminderEmail(booking))
  );

  res.json({ 
    ok: true, 
    remindersSent: sent.length 
  });
});
```

### 3. Daily Reports
```typescript
// backend/src/routes/admin.ts
router.post('/reports/daily', async (req, res) => {
  if (req.headers['x-cron-job'] !== 'true') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Generate daily statistics
  const stats = await generateDailyStats();
  
  // Send to admins
  await sendDailyReportEmail(stats);

  res.json({ 
    ok: true, 
    report: stats 
  });
});
```

---

## ✅ Verification

### Test Cron Jobs Manually

```powershell
# Test health check
curl https://your-app.vercel.app/api/cron/health-check `
  -H "Authorization: Bearer your-cron-secret"

# Test session cleanup
curl https://your-app.vercel.app/api/cron/cleanup-sessions `
  -H "Authorization: Bearer your-cron-secret"

# Test booking reminders
curl https://your-app.vercel.app/api/cron/booking-reminders `
  -H "Authorization: Bearer your-cron-secret"

# Test daily reports
curl https://your-app.vercel.app/api/cron/daily-reports `
  -H "Authorization: Bearer your-cron-secret"
```

### View Cron Logs in Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments"
4. Click on latest deployment
5. Go to "Functions" tab
6. Filter by `/api/cron/*`

---

## 📋 Deployment Checklist

- [ ] CRON_SECRET added to Vercel environment variables
- [ ] NEXT_PUBLIC_API_URL set to backend URL
- [ ] All 4 cron job routes created
- [ ] vercel.json updated with cron schedules
- [ ] Deployed to Vercel: `vercel --prod`
- [ ] Backend endpoints implemented
- [ ] Tested cron jobs manually
- [ ] Verified cron jobs in Vercel dashboard

---

## 🎯 Next Steps

1. **Add CRON_SECRET**:
   ```powershell
   vercel env add CRON_SECRET production
   ```

2. **Deploy**:
   ```powershell
   cd frontend
   vercel --prod
   ```

3. **Implement backend endpoints** (session cleanup, reminders, reports)

4. **Monitor** in Vercel dashboard

---

## 🔄 Modify Cron Schedules

Edit `frontend/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/health-check",
      "schedule": "*/10 * * * *"  // Change to every 10 minutes
    }
  ]
}
```

Then redeploy: `vercel --prod`

---

## 🚨 Troubleshooting

### Cron job returns 401 Unauthorized
- Check CRON_SECRET is set in Vercel
- Verify the secret matches in your test requests

### Cron job not running
- Check Vercel dashboard → Functions → Cron Jobs
- Verify `vercel.json` syntax is correct
- Ensure you're on a Pro plan (Hobby plan has limits)

### Backend endpoint fails
- Check backend logs
- Verify NEXT_PUBLIC_API_URL is correct
- Test backend endpoint directly

---

## 💡 Additional Cron Job Ideas

Add more cron jobs as needed:

```typescript
// Blockchain price updates - Every hour
{
  "path": "/api/cron/update-crypto-prices",
  "schedule": "0 * * * *"
}

// Database backups - Daily at 3 AM
{
  "path": "/api/cron/backup-database",
  "schedule": "0 3 * * *"
}

// Weekly analytics - Mondays at 10 AM
{
  "path": "/api/cron/weekly-analytics",
  "schedule": "0 10 * * 1"
}

// Monthly invoicing - 1st of month at 9 AM
{
  "path": "/api/cron/generate-invoices",
  "schedule": "0 9 1 * *"
}
```

---

**Your cron jobs are ready! Add the CRON_SECRET and deploy to activate them.** ⏰
