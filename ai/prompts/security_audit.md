# Security Audit Prompt

## Mission
Perform a comprehensive security audit of Advancia Pay Ledger codebase focusing on healthcare compliance and financial security.

## Audit Scope

### 1. Authentication & Authorization
**Check for:**
- JWT token validation on all protected routes
- Token expiration and refresh logic
- Session management security
- Password hashing (bcrypt with salt)
- 2FA implementation for admin accounts
- API key validation for external integrations

**Red Flags:**
- Hardcoded credentials
- Weak password requirements
- Missing authentication on sensitive endpoints
- Tokens stored in localStorage (use httpOnly cookies)
- No rate limiting on auth endpoints

### 2. Data Protection (HIPAA)
**Check for:**
- PHI encryption at rest (database level)
- PHI encryption in transit (TLS 1.2+)
- PHI access logging (audit trail)
- Data minimization (only collect necessary data)
- Proper data retention policies
- Secure data disposal

**Red Flags:**
- PHI in logs or error messages
- PHI in URLs or query parameters
- Unencrypted database connections
- Missing audit logs for PHI access
- PHI sent to third-party services without BAA

### 3. Payment Security (PCI-DSS)
**Check for:**
- No storage of CVV/CVC codes
- Only last 4 digits of card numbers stored
- Tokenization for card data
- Secure payment gateway integration
- Transaction signing for crypto payments
- Idempotency for payment operations

**Red Flags:**
- Full card numbers in database
- CVV stored anywhere
- Payment data in logs
- Missing transaction rollback on errors
- No idempotency keys

### 4. Input Validation
**Check for:**
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitize HTML)
- Command injection prevention
- Path traversal prevention
- CSRF protection
- Request size limits

**Red Flags:**
- Raw SQL queries with string concatenation
- User input directly in HTML without escaping
- File uploads without validation
- No CSRF tokens on state-changing operations

### 5. API Security
**Check for:**
- Rate limiting (general and per-endpoint)
- CORS properly configured
- Security headers (helmet.js)
- API versioning
- Request validation (schemas)
- Response sanitization

**Red Flags:**
- No rate limiting
- CORS set to `*` in production
- Missing security headers
- Verbose error messages in production
- Stack traces exposed to clients

### 6. Blockchain Security
**Check for:**
- Private keys never in code or logs
- Secure key storage (HSM or encrypted)
- Transaction signing validation
- Gas limit protection
- Reentrancy attack prevention
- Front-running protection

**Red Flags:**
- Private keys in environment variables
- Unsigned transactions
- No gas limit checks
- Missing nonce management

### 7. Infrastructure Security
**Check for:**
- Environment variables for secrets
- Secrets not in version control
- Database credentials rotated
- Least privilege access
- Network segmentation
- Backup encryption

**Red Flags:**
- `.env` file in git
- Hardcoded secrets
- Root database access
- Public database ports
- Unencrypted backups

## Audit Report Format

### Critical Issues (Fix Immediately)
```
Issue: [Specific vulnerability]
Location: [File:Line or endpoint]
Impact: [What could happen]
Fix: [Exact steps to remediate]
```

### High Priority
```
Issue: [Security weakness]
Location: [File:Line]
Risk: [Potential impact]
Recommendation: [How to fix]
```

### Medium Priority
```
Issue: [Security improvement needed]
Location: [File:Line]
Suggestion: [Enhancement]
```

### Compliance Gaps
```
Requirement: [HIPAA/PCI-DSS requirement]
Current State: [What's missing]
Required Action: [What needs to be done]
```

## Example Findings

### Critical - SQL Injection
```typescript
// ❌ CRITICAL: SQL Injection vulnerability
const user = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = '${email}'
`;

// ✅ FIX: Use parameterized query
const user = await prisma.user.findUnique({
  where: { email }
});
```

### High - PHI in Logs
```typescript
// ❌ HIGH: PHI exposed in logs
logger.info(`Processing payment for patient ${patientName}`);

// ✅ FIX: Log only non-PHI identifiers
logger.info(`Processing payment for transaction ${transactionId}`);
```

### Critical - Missing Authentication
```typescript
// ❌ CRITICAL: No authentication
app.get('/api/patients/:id', async (req, res) => {
  const patient = await getPatient(req.params.id);
  res.json(patient);
});

// ✅ FIX: Add authentication and authorization
app.get('/api/patients/:id', authenticateToken, async (req, res) => {
  const patient = await getPatient(req.params.id);
  
  // Verify user has access to this patient
  if (patient.facilityId !== req.user.facilityId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  res.json(patient);
});
```

## Automated Checks

Run these tools:
```bash
# Dependency vulnerabilities
npm audit

# Static analysis
npm run lint

# Secret scanning
git secrets --scan

# OWASP dependency check
npm run security-check
```

## Compliance Verification

### HIPAA Checklist
- [ ] PHI encrypted at rest
- [ ] PHI encrypted in transit
- [ ] Access logs for PHI
- [ ] User authentication required
- [ ] Session timeout implemented
- [ ] Audit trail complete

### PCI-DSS Checklist
- [ ] No full card numbers stored
- [ ] No CVV stored
- [ ] Secure transmission (TLS 1.2+)
- [ ] Access control implemented
- [ ] Logging and monitoring active
- [ ] Regular security testing

## Priority Matrix

**Critical (Fix Now):**
- Authentication bypass
- SQL injection
- Hardcoded secrets
- PHI exposure
- Payment data leaks

**High (Fix This Week):**
- Missing rate limiting
- Weak password policy
- Insufficient logging
- Missing input validation
- CORS misconfiguration

**Medium (Fix This Sprint):**
- Security header improvements
- Error message verbosity
- Session management enhancements
- Dependency updates

**Low (Backlog):**
- Code quality improvements
- Documentation updates
- Performance optimizations
