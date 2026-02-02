---
description: Push code to GitHub with secret scanning protection
---

# Push to GitHub Workflow

## Prerequisites
- Git configured
- GitHub repository access
- Secrets sanitized

## Steps

### 1. Check for Secrets
Verify no secrets are being committed:
- Check `.gitignore` includes `.env`, `.env.production`
- Scan for hardcoded credentials
- Review documentation files for exposed keys

### 2. Stage Changes
```bash
git add .
```

### 3. Review Staged Files
```bash
git status
```

Ensure no sensitive files are staged:
- ❌ `.env` files
- ❌ Files with real credentials
- ❌ Private keys

### 4. Commit Changes
```bash
git commit -m "feat: [Your descriptive commit message]"
```

### 5. Push to GitHub
```bash
git push origin master
```

### 6. Handle Secret Detection
If GitHub blocks push due to secrets:
- Remove secrets from files
- Replace with placeholders
- Amend commit: `git commit --amend`
- Force push: `git push origin master --force`

## Success Criteria
- ✅ No secrets exposed
- ✅ Push successful
- ✅ GitHub Actions triggered
- ✅ No security warnings
