# Code Refactoring Prompt

## Mission
Improve code quality, maintainability, and performance while preserving functionality.

## Refactoring Principles

### 1. Preserve Behavior
- All existing tests must pass
- No breaking changes to public APIs
- Maintain backward compatibility
- Document any behavioral changes

### 2. Improve Readability
- Clear variable and function names
- Consistent code style
- Reduce cognitive complexity
- Self-documenting code

### 3. Reduce Complexity
- Break down large functions (< 50 lines)
- Single Responsibility Principle
- DRY (Don't Repeat Yourself)
- Remove dead code

### 4. Enhance Maintainability
- Type safety (avoid `any`)
- Error handling consistency
- Logging standards
- Documentation where needed

## Refactoring Targets

### High Priority

**1. Duplicate Code**
```typescript
// ❌ BEFORE: Duplicate validation logic
function createPayment(data) {
  if (!data.amount || data.amount <= 0) throw new Error('Invalid amount');
  if (!data.currency) throw new Error('Invalid currency');
  // ... create payment
}

function updatePayment(id, data) {
  if (!data.amount || data.amount <= 0) throw new Error('Invalid amount');
  if (!data.currency) throw new Error('Invalid currency');
  // ... update payment
}

// ✅ AFTER: Extract validation
function validatePaymentData(data) {
  if (!data.amount || data.amount <= 0) {
    throw new Error('Invalid amount');
  }
  if (!data.currency) {
    throw new Error('Invalid currency');
  }
}

function createPayment(data) {
  validatePaymentData(data);
  // ... create payment
}

function updatePayment(id, data) {
  validatePaymentData(data);
  // ... update payment
}
```

**2. Long Functions**
```typescript
// ❌ BEFORE: 100+ line function
async function processPayment(paymentData) {
  // Validate
  if (!paymentData.amount) throw new Error('...');
  if (!paymentData.currency) throw new Error('...');
  
  // Create transaction
  const transaction = await prisma.transaction.create({...});
  
  // Process payment
  if (paymentData.method === 'CRYPTO') {
    // 30 lines of crypto logic
  } else if (paymentData.method === 'CREDIT_CARD') {
    // 30 lines of card logic
  }
  
  // Send notifications
  // 20 lines of notification logic
  
  // Update analytics
  // 20 lines of analytics logic
  
  return transaction;
}

// ✅ AFTER: Break into smaller functions
async function processPayment(paymentData) {
  validatePaymentData(paymentData);
  const transaction = await createTransaction(paymentData);
  await executePayment(transaction, paymentData.method);
  await sendPaymentNotifications(transaction);
  await updatePaymentAnalytics(transaction);
  return transaction;
}
```

**3. Complex Conditionals**
```typescript
// ❌ BEFORE: Nested conditionals
if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
  if (user.facility && user.facility.status === 'ACTIVE') {
    if (user.permissions.includes('MANAGE_PAYMENTS')) {
      // Allow access
    }
  }
}

// ✅ AFTER: Extract to function
function canManagePayments(user) {
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
  const hasActiveFacility = user.facility?.status === 'ACTIVE';
  const hasPermission = user.permissions.includes('MANAGE_PAYMENTS');
  
  return isAdmin && hasActiveFacility && hasPermission;
}

if (canManagePayments(user)) {
  // Allow access
}
```

**4. Magic Numbers/Strings**
```typescript
// ❌ BEFORE: Magic values
if (transaction.amount > 10000) {
  // Require additional verification
}

setTimeout(() => retryPayment(), 5000);

// ✅ AFTER: Named constants
const LARGE_TRANSACTION_THRESHOLD = 10000; // USD
const PAYMENT_RETRY_DELAY_MS = 5000;

if (transaction.amount > LARGE_TRANSACTION_THRESHOLD) {
  // Require additional verification
}

setTimeout(() => retryPayment(), PAYMENT_RETRY_DELAY_MS);
```

**5. Type Safety**
```typescript
// ❌ BEFORE: Using any
function processData(data: any) {
  return data.amount + data.fee;
}

// ✅ AFTER: Proper types
interface PaymentData {
  amount: number;
  fee: number;
  currency: string;
}

function processData(data: PaymentData): number {
  return data.amount + data.fee;
}
```

### Medium Priority

**6. Error Handling**
```typescript
// ❌ BEFORE: Inconsistent error handling
try {
  const result = await someOperation();
  return result;
} catch (e) {
  console.log(e);
  return null;
}

// ✅ AFTER: Consistent error handling
try {
  const result = await someOperation();
  return result;
} catch (error) {
  logger.error('Operation failed', { error, context });
  throw new OperationError('Failed to complete operation', { cause: error });
}
```

**7. Async/Await Patterns**
```typescript
// ❌ BEFORE: Unnecessary awaits
async function getData() {
  const user = await getUser();
  const facility = await getFacility();
  const payments = await getPayments();
  return { user, facility, payments };
}

// ✅ AFTER: Parallel execution
async function getData() {
  const [user, facility, payments] = await Promise.all([
    getUser(),
    getFacility(),
    getPayments()
  ]);
  return { user, facility, payments };
}
```

**8. Database Queries**
```typescript
// ❌ BEFORE: N+1 query problem
const facilities = await prisma.facility.findMany();
for (const facility of facilities) {
  facility.payments = await prisma.payment.findMany({
    where: { facilityId: facility.id }
  });
}

// ✅ AFTER: Use includes
const facilities = await prisma.facility.findMany({
  include: {
    payments: true
  }
});
```

## Refactoring Checklist

### Before Refactoring
- [ ] All tests passing
- [ ] Code coverage measured
- [ ] Performance baseline established
- [ ] Backup/branch created

### During Refactoring
- [ ] Make small, incremental changes
- [ ] Run tests after each change
- [ ] Commit frequently
- [ ] Document significant changes

### After Refactoring
- [ ] All tests still passing
- [ ] Code coverage maintained or improved
- [ ] Performance not degraded
- [ ] Code review completed
- [ ] Documentation updated

## Refactoring Patterns

### Extract Function
When: Function > 50 lines or doing multiple things
```typescript
// Extract complex logic into named functions
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
}

function calculateItemTotal(item) {
  return item.price * item.quantity * (1 + item.taxRate);
}
```

### Extract Variable
When: Complex expressions or repeated calculations
```typescript
// Give meaningful names to intermediate values
const isEligibleForDiscount = user.isPremium && order.total > 100;
const discountAmount = isEligibleForDiscount ? order.total * 0.1 : 0;
```

### Replace Conditional with Polymorphism
When: Large switch/if-else on type
```typescript
// Use strategy pattern
interface PaymentProcessor {
  process(amount: number): Promise<void>;
}

class CryptoPaymentProcessor implements PaymentProcessor {
  async process(amount: number) { /* crypto logic */ }
}

class CardPaymentProcessor implements PaymentProcessor {
  async process(amount: number) { /* card logic */ }
}
```

### Introduce Parameter Object
When: Function has many parameters
```typescript
// ❌ BEFORE
function createPayment(amount, currency, method, facilityId, userId, metadata) {
  // ...
}

// ✅ AFTER
interface PaymentParams {
  amount: number;
  currency: string;
  method: string;
  facilityId: string;
  userId: string;
  metadata?: Record<string, any>;
}

function createPayment(params: PaymentParams) {
  // ...
}
```

## Code Smells to Fix

### Critical
- Hardcoded secrets
- SQL injection vulnerabilities
- Missing error handling
- Memory leaks
- Blocking operations in async code

### High
- Functions > 100 lines
- Cyclomatic complexity > 10
- Duplicate code blocks
- Missing type definitions
- Inconsistent error handling

### Medium
- Magic numbers/strings
- Deep nesting (> 3 levels)
- Long parameter lists (> 5)
- Comments explaining what (not why)
- Unused imports/variables

## Testing Strategy

### Unit Tests
```typescript
describe('Payment Processing', () => {
  it('should validate payment amount', () => {
    expect(() => validatePaymentData({ amount: -100 }))
      .toThrow('Invalid amount');
  });
  
  it('should process valid payment', async () => {
    const payment = await processPayment(validPaymentData);
    expect(payment.status).toBe('COMPLETED');
  });
});
```

### Integration Tests
```typescript
describe('Payment API', () => {
  it('should create payment end-to-end', async () => {
    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send(paymentData);
    
    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
  });
});
```

## Performance Considerations

### Before Refactoring
```bash
# Measure baseline
npm run benchmark
```

### After Refactoring
```bash
# Verify no regression
npm run benchmark
```

**Acceptable:**
- Performance within 5% of baseline
- Improved readability worth minor performance cost

**Not Acceptable:**
- > 10% performance degradation
- Increased memory usage without justification

## Documentation Updates

After refactoring, update:
- [ ] API documentation
- [ ] Code comments (why, not what)
- [ ] README if public API changed
- [ ] Architecture diagrams if structure changed
- [ ] Runbook if operational changes

## Refactoring Anti-Patterns

### Don't
- ❌ Refactor without tests
- ❌ Change behavior during refactoring
- ❌ Refactor everything at once
- ❌ Optimize prematurely
- ❌ Refactor during feature development

### Do
- ✅ Refactor in small steps
- ✅ Keep tests green
- ✅ Focus on one smell at a time
- ✅ Measure before and after
- ✅ Get code review

## Review Criteria

**Code Quality:**
- Readability improved
- Complexity reduced
- Duplication eliminated
- Types properly defined

**Functionality:**
- All tests passing
- No breaking changes
- Performance acceptable
- Error handling consistent

**Maintainability:**
- Easier to understand
- Easier to modify
- Easier to test
- Better documented
