# Changelog

All notable changes to Advancia Pay Ledger will be documented in this file.

## [2.0.0] - 2026-02-01

### 🔄 Infrastructure Migration
- **BREAKING**: Migrated from DigitalOcean to GCP Cloud Run for backend hosting
- Updated all deployment workflows to use GCP instead of DigitalOcean
- Removed deprecated DigitalOcean SSH deployment methods

### 📝 Documentation Updates
- Updated README.md with current production architecture
- Added status badges (MRR, facilities, growth rate)
- Modernized deployment instructions for Vercel + GCP + Supabase
- Updated ARCHITECTURE_DIAGRAM.md to reflect GCP Cloud Run infrastructure
- Removed all DigitalOcean references from documentation

### 🔧 Configuration Changes
- Updated GitHub secrets setup scripts (`.github/setup-secrets.sh` and `.github/setup-secrets.ps1`)
- Replaced `DO_HOST`, `DO_USERNAME`, `DO_SSH_KEY` with `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_SERVICE_ACCOUNT_KEY`
- Updated default API URL from `http://147.182.193.11:3001` to `https://api.advanciapayledger.com`
- Updated benchmark scripts to use production URLs

### 🚀 Deployment
- Frontend: Vercel (Global Edge Network)
- Backend: GCP Cloud Run (Auto-scaling)
- Database: Supabase PostgreSQL 18
- CDN: Cloudflare
- CI/CD: GitHub Actions

### 📊 Current Metrics
- MRR: $247,000
- Growth: 42% MoM
- Facilities: 24 healthcare facilities
- Uptime: 99.9%
- Stage: Production (Seed fundraising active)

### 🔐 Security
- Maintained HIPAA compliance throughout migration
- All secrets properly managed via GitHub Secrets
- Row Level Security (RLS) enabled on all database tables

### 📚 New Documentation
- Added EXECUTIVE_SUMMARY_WORKSPACE.md for multi-agent AI setup
- Added QUICK_START_TEMPLATES.md with copy-paste templates
- Enhanced ARCHITECTURE_DIAGRAM.md with detailed Mermaid diagrams
- Added PERFORMANCE_BENCHMARKS.md with comprehensive testing suite

### ⚠️ Deprecated
- `.github/workflows/deploy-backend.yml` - Replaced by GCP deployment
- DigitalOcean deployment methods - No longer supported

---

## [1.0.0] - 2026-01-29

### 🎉 Initial Production Release
- Healthcare payment processing platform
- Multi-blockchain support (Solana, Ethereum, Polygon, Base)
- HIPAA-compliant architecture
- Stripe and Plaid integrations
- Real-time analytics and reporting

---

**Version Format**: [Major.Minor.Patch]
- **Major**: Breaking changes or significant architecture updates
- **Minor**: New features or enhancements
- **Patch**: Bug fixes and minor improvements
