---
description: Setup SonarCloud for automated code quality analysis
---

# Setup SonarCloud Workflow

## Prerequisites
- SonarCloud account
- GitHub repository connected
- SonarCloud workflow file created

## Steps

### 1. Create SonarCloud Account
- Go to: https://sonarcloud.io/
- Login with GitHub
- Authorize SonarCloud

### 2. Import Repository
- Click "+" → "Analyze new project"
- Select: `muchaeljohn739337-art/advanciapayledger-new`
- Click "Set Up"

### 3. Get Organization Key
- Go to "My Account" → "Organizations"
- Copy organization key
- Verify in `sonar-project.properties`

### 4. Generate Token
- Go to: https://sonarcloud.io/account/security
- Generate new token
- Name: "GitHub Actions"
- Copy token

### 5. Add GitHub Secret
- Go to: https://github.com/muchaeljohn739337-art/advanciapayledger-new/settings/secrets/actions
- Click "New repository secret"
- Name: `SONAR_TOKEN`
- Value: [Paste token]
- Click "Add secret"

### 6. Configure Analysis Method
In SonarCloud project settings:
- Go to "Administration" → "Analysis Method"
- Select "GitHub Actions"
- Disable automatic analysis

### 7. Push Configuration
```bash
git add .github/workflows/sonarcloud.yml sonar-project.properties
git commit -m "feat: Add SonarCloud integration"
git push origin master
```

### 8. Verify Analysis
- Check GitHub Actions tab
- Wait for SonarCloud analysis
- View results in SonarCloud dashboard

## Success Criteria
- ✅ SonarCloud project created
- ✅ Token added to GitHub Secrets
- ✅ Workflow triggered on push
- ✅ Analysis completed successfully
- ✅ Quality gate passed
