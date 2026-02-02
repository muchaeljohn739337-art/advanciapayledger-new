# 🔌 MCP SERVER SETUP GUIDE - Advancia PayLedger

## What are MCP Servers?

MCP (Model Context Protocol) servers allow Claude to integrate with external services like:
- GitHub (code repositories)
- Vercel (deployments)
- Supabase (database)
- AWS (cloud infrastructure)
- PostgreSQL (direct database access)
- Google Drive (documents)
- Slack (team communication)

---

## 🎯 RECOMMENDED MCP SERVERS FOR YOUR STACK

Based on your architecture (Vercel + AWS + Supabase + Cloudflare):

### **Essential (Setup Now)**
1. ✅ **Vercel** - Already connected
2. **GitHub** - Code repository management
3. **Supabase** - Database & auth
4. **AWS** - Cloud infrastructure

### **Nice to Have (Setup Later)**
5. **PostgreSQL** - Direct database access
6. **Google Drive** - Documentation & files
7. **Slack** - Team communication

---

## 📋 CURRENT PROJECT CREDENTIALS

### **Your Supabase Project:**
- **URL:** `https://fvceynqcxfwtbpbugtqr.supabase.co`
- **Project ID:** `fvceynqcxfwtbpbugtqr`
- **Region:** us-east-1

### **Your GitHub:**
- **Repository:** `muchaeljohn739337-art/advanciapayledger-new`
- **Token:** Available (used for previous pushes)

### **Your AWS:**
- **Account ID:** `032474760584`
- **Region:** `us-east-2`
- **Credentials:** Available

---

## 🚀 SETUP INSTRUCTIONS

### **1. VERCEL MCP SERVER** ✅ (Already Connected)

**Status:** Already working
**Features:**
- Deploy projects
- Check deployment status
- View build logs
- Manage domains

---

### **2. GITHUB MCP SERVER**

**Why:** Manage repos, create PRs, review code

#### **A. Generate GitHub Personal Access Token**

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Set name: "Claude MCP Access"
4. Select scopes:
   - ✅ `repo` (Full control of repositories)
   - ✅ `workflow` (Update GitHub Actions)
   - ✅ `read:org` (Read org data)
5. Click "Generate token"
6. **SAVE THE TOKEN**

#### **B. Configure in Claude Desktop**

**File:** `C:\Users\mucha.DESKTOP-H7T9NPM\AppData\Roaming\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "vercel": {
      "type": "url",
      "url": "https://mcp.vercel.com"
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

#### **C. Restart Claude Desktop**

Close and reopen Claude app.

**Test it:**
```
"List my GitHub repositories"
"Show recent commits on advanciapayledger-new"
```

---

### **3. SUPABASE MCP SERVER**

**Why:** Manage auth, query database, run migrations

#### **A. Get Supabase Service Role Key**

1. Go to: https://supabase.com/dashboard/project/fvceynqcxfwtbpbugtqr
2. Settings → API
3. Copy **Service Role Key** (secret key)

#### **B. Update Claude Config**

```json
{
  "mcpServers": {
    "vercel": {
      "type": "url",
      "url": "https://mcp.vercel.com"
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_..."
      }
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://fvceynqcxfwtbpbugtqr.supabase.co",
        "SUPABASE_SERVICE_KEY": "your_service_key_here"
      }
    }
  }
}
```

**Test it:**
```
"Show me all tables in Supabase"
"Query auth.users table"
```

---

### **4. AWS MCP SERVER**

**Why:** Manage EC2, RDS, ECS, CloudWatch

#### **A. Your AWS Credentials**

You already have:
- **Account ID:** `032474760584`
- **Region:** `us-east-2`
- **Access Key ID:** Available
- **Secret Access Key:** Available

#### **B. Update Claude Config**

```json
{
  "mcpServers": {
    "vercel": { ... },
    "github": { ... },
    "supabase": { ... },
    "aws": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-aws"],
      "env": {
        "AWS_ACCESS_KEY_ID": "AKIA...",
        "AWS_SECRET_ACCESS_KEY": "...",
        "AWS_REGION": "us-east-2"
      }
    }
  }
}
```

**Test it:**
```
"List my AWS RDS databases"
"Check ECS cluster status"
```

---

### **5. POSTGRESQL MCP SERVER** (Optional)

**Why:** Direct database queries, schema inspection

#### **A. Your Database Connection**

```
Host: db.fvceynqcxfwtbpbugtqr.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: ov0Zq3qP8wXhVlzq
```

#### **B. Update Claude Config**

```json
{
  "mcpServers": {
    "vercel": { ... },
    "github": { ... },
    "supabase": { ... },
    "aws": { ... },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "PGHOST": "db.fvceynqcxfwtbpbugtqr.supabase.co",
        "PGPORT": "5432",
        "PGDATABASE": "postgres",
        "PGUSER": "postgres",
        "PGPASSWORD": "ov0Zq3qP8wXhVlzq"
      }
    }
  }
}
```

**Test it:**
```
"Show me all tables in the database"
"Query users table"
"Show me the schema for the payments table"
```

---

## 🔐 COMPLETE CONFIGURATION FILE

**File:** `C:\Users\mucha.DESKTOP-H7T9NPM\AppData\Roaming\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "vercel": {
      "type": "url",
      "url": "https://mcp.vercel.com"
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_github_token_here"
      }
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://fvceynqcxfwtbpbugtqr.supabase.co",
        "SUPABASE_SERVICE_KEY": "your_service_key_here"
      }
    },
    "aws": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-aws"],
      "env": {
        "AWS_ACCESS_KEY_ID": "AKIA...",
        "AWS_SECRET_ACCESS_KEY": "...",
        "AWS_REGION": "us-east-2"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "PGHOST": "db.fvceynqcxfwtbpbugtqr.supabase.co",
        "PGPORT": "5432",
        "PGDATABASE": "postgres",
        "PGUSER": "postgres",
        "PGPASSWORD": "ov0Zq3qP8wXhVlzq"
      }
    }
  }
}
```

---

## 🎯 RECOMMENDED SETUP ORDER

**For your project:**

### **Phase 1: Essential (Do Now)**
1. ✅ Vercel (already done)
2. **GitHub** (30 min) - Manage code
3. **Supabase** (20 min) - Database access

### **Phase 2: Infrastructure (After Database Fixed)**
4. **PostgreSQL** (15 min) - Direct DB queries
5. **AWS** (30 min) - Cloud management

### **Phase 3: Team Tools (Later)**
6. Google Drive (if using docs)
7. Slack (if using team chat)

**Total time: ~2 hours for all essential servers**

---

## 🧪 TESTING YOUR MCP SETUP

After configuring each server:

### **GitHub**
```
"List my GitHub repositories"
"Show latest commits on main branch"
"Create a new branch called 'feature/sentry-integration'"
```

### **Vercel**
```
"List my Vercel deployments"
"Show build logs for latest deployment"
```

### **Supabase**
```
"Show all tables in Supabase"
"Query auth.users table"
"Check RLS policies on users table"
```

### **PostgreSQL**
```
"Show all tables"
"Describe the users table"
"Count rows in payments table"
```

### **AWS**
```
"List my RDS instances"
"Show ECS tasks"
"Get CloudWatch metrics"
```

---

## 🔒 SECURITY BEST PRACTICES

### **✅ DO:**
- Store config file in secure location
- Use environment-specific tokens (dev vs prod)
- Rotate tokens every 90 days
- Use least-privilege access
- Enable 2FA on all accounts

### **❌ DON'T:**
- Commit config file to git
- Share tokens in chat/email
- Use production tokens for development
- Grant unnecessary permissions
- Leave old tokens active

---

## 🚨 TROUBLESHOOTING

### **MCP Server Not Appearing**

**Solutions:**
1. Restart Claude Desktop completely
2. Check config file syntax (valid JSON)
3. Verify credentials are correct
4. Check Node.js version: `node --version` (needs 18+)

### **Authentication Errors**

**Solutions:**
1. Regenerate token with correct permissions
2. Check token isn't expired
3. Verify environment variables in config
4. Test token manually with API

### **Server Crashes**

**Solutions:**
1. Reinstall server: `npm install -g @modelcontextprotocol/server-xyz --force`
2. Check logs: `%APPDATA%\Claude\logs`
3. Remove and re-add to config

---

## 📞 NEXT STEPS

**Right now:**

1. **Create GitHub token** (5 min)
   - Go to: https://github.com/settings/tokens
   - Generate with `repo` scope
   - Save token securely

2. **Get Supabase Service Key** (2 min)
   - Go to: https://supabase.com/dashboard/project/fvceynqcxfwtbpbugtqr
   - Settings → API → Copy Service Role Key

3. **Update Claude config** (10 min)
   - Open: `%APPDATA%\Claude\claude_desktop_config.json`
   - Add GitHub and Supabase MCP servers
   - Save file

4. **Restart Claude** (1 min)
   - Close completely
   - Reopen

5. **Test it** (2 min)
   - Ask: "List my GitHub repos"
   - Ask: "Show Supabase tables"

---

**Your MCP setup will enable direct integration with all your infrastructure!** 🚀
