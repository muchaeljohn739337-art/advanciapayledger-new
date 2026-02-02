# Snyk Setup Guide - GitHub Integration

## 🎯 Goal: Free Security Scanning (No Docker Required)

Set up automated security scanning for your dependencies using Snyk's free tier.

**Time Required:** 10 minutes  
**Cost:** $0/month (200 tests free)

---

## Step 1: Sign Up for Snyk (3 minutes)

1. **Go to Snyk**: https://snyk.io
2. **Click "Sign up for free"**
3. **Choose "Sign up with GitHub"** (easiest method)
4. **Authorize Snyk** to access your GitHub account
5. **Select your repository**: `advanciapayledger-new`

---

## Step 2: Get Your Snyk API Token (2 minutes)

1. **Go to Snyk Dashboard**: https://app.snyk.io
2. **Click your profile icon** (top right)
3. **Select "Account settings"**
4. **Go to "General" tab**
5. **Scroll to "Auth Token" section**
6. **Click "Click to show"** to reveal your token
7. **Copy the token** (starts with something like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

---

## Step 3: Add Token to GitHub Secrets (2 minutes)

1. **Go to your GitHub repository**:
   ```
   https://github.com/muchaeljohn739337-art/advanciapayledger-new
   ```

2. **Click "Settings"** (top menu)

3. **Click "Secrets and variables"** → **"Actions"** (left sidebar)

4. **Click "New repository secret"**

5. **Add the secret**:
   - **Name**: `SNYK_TOKEN`
   - **Value**: Paste your Snyk token
   - **Click "Add secret"**

---

## Step 4: Verify Workflow File (1 minute)

The workflow file already exists at:
```
.github/workflows/snyk-free.yml
```

This workflow will:
- ✅ Run on every push to main/master
- ✅ Run on every pull request
- ✅ Run weekly on Sunday (scheduled scan)
- ✅ Scan both backend and frontend
- ✅ Monitor dependencies in Snyk dashboard

---

## Step 5: Trigger First Scan (2 minutes)

### Option A: Push a Commit
```bash
git add .
git commit -m "Enable Snyk security scanning"
git push origin main
```

### Option B: Manually Trigger
1. Go to GitHub → **Actions** tab
2. Click **"Snyk Security Scan (Free Tier)"**
3. Click **"Run workflow"** dropdown
4. Click **"Run workflow"** button

---

## Step 6: View Results (1 minute)

### In GitHub:
1. Go to **Actions** tab
2. Click on the running workflow
3. View scan results

### In Snyk Dashboard:
1. Go to https://app.snyk.io
2. Click **"Projects"**
3. See your `advancia-backend` and `advancia-frontend` projects
4. View vulnerabilities and recommendations

---

## 🎉 What You Get

### Automated Scanning
- ✅ Every code push scanned
- ✅ Pull request checks
- ✅ Weekly scheduled scans
- ✅ Dependency monitoring

### Vulnerability Detection
- ✅ Known security vulnerabilities
- ✅ License compliance issues
- ✅ Outdated dependencies
- ✅ Fix recommendations

### Free Tier Limits
- ✅ 200 tests per month
- ✅ Unlimited public repos
- ✅ Basic vulnerability database
- ✅ GitHub integration

---

## 📊 Understanding Results

### Severity Levels
- 🔴 **Critical**: Fix immediately
- 🟠 **High**: Fix soon
- 🟡 **Medium**: Fix when possible
- 🔵 **Low**: Monitor

### Workflow Threshold
The workflow is set to `--severity-threshold=high`, meaning:
- ✅ Low/Medium issues won't fail the build
- ❌ High/Critical issues will fail the build

---

## 🔧 Customization

### Change Scan Frequency

Edit `.github/workflows/snyk-free.yml`:

```yaml
schedule:
  - cron: '0 0 * * 0'  # Weekly on Sunday
  # Change to:
  - cron: '0 0 * * *'  # Daily
  # Or:
  - cron: '0 0 * * 1'  # Weekly on Monday
```

### Change Severity Threshold

```yaml
args: --severity-threshold=high
# Change to:
args: --severity-threshold=critical  # Only critical issues
# Or:
args: --severity-threshold=medium    # Include medium issues
```

### Scan Specific Directories

```yaml
with:
  args: --file=backend/package.json --severity-threshold=high
```

---

## 🐛 Troubleshooting

### "SNYK_TOKEN not found"
- Verify you added the secret in GitHub Settings → Secrets → Actions
- Name must be exactly `SNYK_TOKEN` (case-sensitive)
- Try removing and re-adding the secret

### "No vulnerabilities found"
- This is good! Your dependencies are secure
- Snyk will still monitor for new vulnerabilities

### "Rate limit exceeded"
- Free tier: 200 tests/month
- Reduce scan frequency or upgrade to paid plan

### Workflow not running
- Check `.github/workflows/snyk-free.yml` exists
- Verify GitHub Actions are enabled (Settings → Actions)
- Check workflow syntax is valid

---

## 📈 Next Steps

### After Setup:
1. ✅ Review initial scan results
2. ✅ Fix any critical/high vulnerabilities
3. ✅ Set up Slack/email notifications (optional)
4. ✅ Add Snyk badge to README

### Add Badge to README:

```markdown
[![Snyk Security](https://snyk.io/test/github/muchaeljohn739337-art/advanciapayledger-new/badge.svg)](https://snyk.io/test/github/muchaeljohn739337-art/advanciapayledger-new)
```

---

## 💡 Pro Tips

1. **Fix vulnerabilities early** - Easier to fix before production
2. **Review weekly reports** - Stay on top of new vulnerabilities
3. **Use Snyk CLI locally** - Test before pushing:
   ```bash
   npm install -g snyk
   snyk auth
   snyk test
   ```
4. **Monitor transitive dependencies** - Snyk checks all nested dependencies
5. **Enable auto-fix PRs** - Snyk can create PRs to fix vulnerabilities

---

## 🎯 Success Criteria

Snyk is working when:
- ✅ Workflow runs on push/PR
- ✅ Results appear in GitHub Actions
- ✅ Projects visible in Snyk dashboard
- ✅ Weekly scans running automatically

---

## 📞 Support

- **Snyk Docs**: https://docs.snyk.io
- **Snyk Support**: https://support.snyk.io
- **GitHub Actions Docs**: https://docs.github.com/actions

---

**Setup Time:** ~10 minutes  
**Cost:** $0/month  
**Maintenance:** Review weekly reports (~5 min/week)

🎉 **You're all set!** Snyk will now automatically scan your code for vulnerabilities.
