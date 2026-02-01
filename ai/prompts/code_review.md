# Code Review Prompt

## Context
You are reviewing code for Advancia Pay Ledger, a healthcare fintech platform processing both traditional and cryptocurrency payments.

## Critical Requirements
- **HIPAA Compliance**: No PHI in logs, errors, or responses
- **PCI-DSS Compliance**: No credit card data storage except last 4 digits
- **Security**: All sensitive operations must be authenticated and authorized
- **Data Integrity**: Financial transactions must be atomic and auditable

## Review Checklist

### 1. Security Issues
- [ ] Authentication required for sensitive endpoints
- [ ] Authorization checks for user-specific resources
- [ ] Input validation and sanitization
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention (sanitize user input)
- [ ] Rate limiting on sensitive operations
- [ ] Secrets not hardcoded (use environment variables)
- [ ] Sensitive data filtered from logs and error messages

### 2. HIPAA Compliance
- [ ] No patient names, SSN, DOB in logs
- [ ] PHI access is logged in audit trail
- [ ] Encryption at rest for sensitive data
- [ ] Encryption in transit (HTTPS/TLS)
- [ ] Session tokens properly secured

### 3. Financial Integrity
- [ ] Transactions are atomic (use database transactions)
- [ ] Amounts use precise decimal types (not floats)
- [ ] Currency conversions are accurate and auditable
- [ ] Idempotency keys for payment operations
- [ ] Proper error handling with rollback

### 4. Code Quality
- [ ] No unnecessary complexity
- [ ] Edge cases handled (null, undefined, empty arrays)
- [ ] Error messages are descriptive but not revealing
- [ ] Consistent error handling patterns
- [ ] TypeScript types are properly defined
- [ ] No any types without justification

### 5. Performance
- [ ] Database queries are optimized (use indexes)
- [ ] N+1 query problems avoided
- [ ] Caching used appropriately (Redis)
- [ ] Large datasets paginated
- [ ] Async operations don't block

### 6. Testing
- [ ] Critical paths have unit tests
- [ ] Payment flows have integration tests
- [ ] Error cases are tested
- [ ] Edge cases are covered

## Response Format

Provide concrete, actionable feedback:

**Security Issues:**
- Issue: [specific problem]
- Fix: [exact code change needed]
- Priority: Critical/High/Medium/Low

**Code Quality:**
- Issue: [specific problem]
- Fix: [exact code change needed]

**Missing Edge Cases:**
- Scenario: [what could go wrong]
- Fix: [how to handle it]

## Example Review

**Security Issue - Critical:**
```typescript
// ❌ BAD: No authentication check
app.post('/api/payments', async (req, res) => {
  const payment = await createPayment(req.body);
  res.json(payment);
});

// ✅ GOOD: Authentication required
app.post('/api/payments', authenticateToken, async (req, res) => {
  const payment = await createPayment(req.body, req.user.id);
  res.json(payment);
});
```

**Missing Edge Case:**
```typescript
// ❌ BAD: No null check
const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);

// ✅ GOOD: Handle null/undefined
const total = (transactions || []).reduce((sum, tx) => sum + (tx?.amount || 0), 0);
```

## Focus Areas by File Type

**Routes/Controllers:**
- Authentication and authorization
- Input validation
- Rate limiting
- Error handling

**Services:**
- Business logic correctness
- Transaction handling
- Error propagation
- Idempotency

**Database/Prisma:**
- Query optimization
- Transaction usage
- Index usage
- Data integrity constraints

**Blockchain:**
- Transaction signing security
- Gas estimation
- Error handling for network issues
- Idempotency for blockchain operations
