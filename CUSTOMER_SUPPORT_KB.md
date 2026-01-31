# Customer Support Knowledge Base

**Advancia PayLedger**  
**Version:** 1.0  
**Last Updated:** January 30, 2026  
**For:** Customer Support Team

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Account Management](#account-management)
3. [Payment Processing](#payment-processing)
4. [Cryptocurrency Payments](#cryptocurrency-payments)
5. [ACH & Bank Transfers](#ach--bank-transfers)
6. [Debit Card Processing](#debit-card-processing)
7. [Billing & Invoices](#billing--invoices)
8. [Technical Issues](#technical-issues)
9. [Security & Privacy](#security--privacy)
10. [Compliance & Regulations](#compliance--regulations)
11. [Common Error Messages](#common-error-messages)
12. [Escalation Procedures](#escalation-procedures)

---

## Getting Started

### Q: How do I create an account?

**Answer:**
1. Visit app.advanciapayledger.com
2. Click "Sign Up" in the top right
3. Enter your business information:
   - Business name
   - Email address
   - Password (minimum 8 characters)
   - Business type (Healthcare facility, Provider, etc.)
4. Verify your email address
5. Complete KYC verification (upload business documents)
6. Set up your first payment method

**Typical completion time:** 30-60 minutes

**Related Docs:** [User Onboarding Guide](advanciapayledger-new/USER_ONBOARDING_GUIDE.md)

---

### Q: What documents do I need for KYC verification?

**Answer:**
Required documents:
- **Business Registration:** Articles of incorporation, business license
- **Tax ID:** EIN (Employer Identification Number) or SSN for sole proprietors
- **Identity Verification:** Government-issued ID for authorized signers
- **Bank Information:** Voided check or bank statement (for ACH)
- **Healthcare License:** State medical license, facility license (if applicable)

**Processing time:** 1-3 business days

**Tip:** Have all documents ready before starting to speed up approval.

---

### Q: Why is my account pending approval?

**Answer:**
Accounts require approval for:
1. **KYC Verification:** We're reviewing your submitted documents
2. **Compliance Check:** Verifying healthcare licenses and credentials
3. **Risk Assessment:** Standard fraud prevention screening

**Status check:** Log in and check the banner at the top of your dashboard

**Expedite approval:** Email compliance@advanciapayledger.com with "Urgent - Account Approval" in the subject line

---

## Account Management

### Q: How do I reset my password?

**Answer:**
1. Go to login page
2. Click "Forgot Password?"
3. Enter your email address
4. Check email for reset link (valid for 1 hour)
5. Click link and create new password
6. Password requirements:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one number
   - At least one special character

**Not receiving email?**
- Check spam/junk folder
- Verify email address is correct
- Wait 5 minutes and try again
- Contact support if still not received

---

### Q: How do I add team members to my account?

**Answer:**
1. Go to Settings → Team Management
2. Click "Invite Team Member"
3. Enter their email and select role:
   - **Admin:** Full access, can manage billing
   - **Manager:** Can process payments, view reports
   - **Staff:** Can process payments only
   - **View Only:** Can view transactions and reports
4. Click "Send Invitation"
5. Team member receives email with setup link

**Limits:** Up to 10 team members on Basic plan, unlimited on Pro/Enterprise

---

### Q: How do I change my business information?

**Answer:**
1. Go to Settings → Business Profile
2. Update information (name, address, phone, etc.)
3. Click "Save Changes"

**Note:** Changes to legal business name or tax ID require re-verification (1-2 business days)

**Restricted fields:** Some fields require contacting support to change (for compliance reasons)

---

## Payment Processing

### Q: What payment methods do you support?

**Answer:**
**Traditional Payments:**
- Credit/Debit Cards (Visa, Mastercard, Amex, Discover)
- ACH Bank Transfers
- HSA/FSA Cards
- eChecks

**Cryptocurrency:**
- Bitcoin (BTC)
- Ethereum (ETH)
- Solana (SOL)
- Polygon (MATIC)
- USDC (Stablecoin)

**Coming Soon:** Apple Pay, Google Pay, PayPal

---

### Q: How long does it take for payments to settle?

**Answer:**
Settlement times vary by payment method:

| Payment Method | Settlement Time |
|---------------|----------------|
| Credit/Debit Card | 1-2 business days |
| ACH Transfer | 3-5 business days |
| HSA/FSA Card | 1-2 business days |
| Bitcoin | 10-60 minutes (after 1 confirmation) |
| Ethereum | 2-15 minutes (after 12 confirmations) |
| Solana | 1-3 minutes (after 32 confirmations) |
| USDC | 2-15 minutes (network dependent) |

**Weekends/Holidays:** Traditional payments may take longer. Crypto payments process 24/7.

---

### Q: What are your transaction fees?

**Answer:**
Fees vary by payment method and plan:

**Basic Plan:**
- Cards: 2.9% + $0.30 per transaction
- ACH: 1% (max $10)
- Crypto: 1% + network fees

**Pro Plan:**
- Cards: 2.7% + $0.30
- ACH: 0.8% (max $10)
- Crypto: 0.75% + network fees

**Enterprise:** Custom pricing

**Volume Discounts:** Available for >$100K/month

**Contact:** billing@advanciapayledger.com for custom pricing

---

### Q: How do I process a refund?

**Answer:**
1. Go to Transactions → Find the payment
2. Click on transaction to view details
3. Click "Refund" button
4. Enter refund amount (full or partial)
5. Add reason for refund (optional but recommended)
6. Click "Process Refund"

**Refund timeline:**
- Cards: 5-10 business days
- ACH: 3-5 business days
- Crypto: 24-48 hours

**Fees:** Refund fees apply (see your plan details)

**Note:** Crypto refunds require recipient wallet address

---

## Cryptocurrency Payments

### Q: How do cryptocurrency payments work?

**Answer:**
1. Customer selects "Pay with Crypto"
2. Chooses cryptocurrency (BTC, ETH, SOL, etc.)
3. System generates unique payment address and QR code
4. Customer sends payment from their wallet
5. System detects payment on blockchain
6. Payment confirms after required confirmations
7. Funds settle to your account

**Advantages:**
- Lower fees than cards
- Faster settlement (minutes vs. days)
- No chargebacks
- Global payments

---

### Q: What if a crypto payment is stuck or pending?

**Answer:**
**Check payment status:**
1. Go to Transactions → Find payment
2. Click "View on Blockchain" to see transaction details

**Common causes:**
- **Low gas fee:** Transaction waiting for confirmation (Ethereum)
- **Network congestion:** High traffic on blockchain
- **Incorrect amount:** Customer sent wrong amount
- **Wrong network:** Sent on different blockchain

**Solutions:**
- **Wait:** Most transactions confirm within 1 hour
- **Speed up:** Some wallets allow increasing gas fee
- **Contact customer:** Verify they sent correct amount to correct address

**Escalate if:** Payment not confirmed after 24 hours

---

### Q: Can I accept crypto without holding crypto?

**Answer:**
Yes! We offer **instant conversion** to USD:
1. Go to Settings → Payment Methods → Cryptocurrency
2. Enable "Auto-Convert to USD"
3. Select conversion timing:
   - Immediate (at payment confirmation)
   - Daily batch (end of day)
   - Weekly batch (Friday)

**Benefits:**
- No crypto price risk
- Receive USD in your bank account
- Still offer crypto payment option to customers

**Fee:** Additional 0.5% conversion fee

---

### Q: What are blockchain confirmations?

**Answer:**
Confirmations are how blockchain networks verify transactions:

| Cryptocurrency | Required Confirmations | Typical Time |
|---------------|----------------------|--------------|
| Bitcoin | 1 confirmation | 10-60 minutes |
| Ethereum | 12 confirmations | 2-15 minutes |
| Solana | 32 confirmations | 1-3 minutes |
| Polygon | 128 confirmations | 5-10 minutes |
| USDC | Varies by network | 2-15 minutes |

**Why wait for confirmations?**
- Prevents double-spending
- Ensures transaction is permanent
- Required for security

**Customer communication:** Set expectations about confirmation times

---

## ACH & Bank Transfers

### Q: How do I set up ACH payments?

**Answer:**
1. Go to Settings → Payment Methods
2. Click "Add Bank Account"
3. Choose verification method:
   - **Instant Verification (Plaid):** Connect bank account instantly
   - **Micro-Deposits:** 1-2 business days for verification
4. Follow prompts to connect bank
5. Verify account ownership
6. Start accepting ACH payments

**Requirements:**
- U.S. bank account
- Business checking account (recommended)
- Account must be in your business name

---

### Q: What are micro-deposits?

**Answer:**
Micro-deposits are small amounts (typically $0.01-$0.99) sent to your bank account to verify ownership.

**Process:**
1. We send 2 small deposits to your account
2. Wait 1-2 business days for deposits to appear
3. Check your bank statement for amounts
4. Return to platform and enter the two amounts
5. Account verified and ready to use

**Tip:** Check your bank's mobile app for faster notification

---

### Q: Why did an ACH payment fail?

**Answer:**
Common reasons for ACH failures:

**Insufficient Funds:**
- Customer's account doesn't have enough money
- **Solution:** Contact customer to retry with sufficient funds

**Invalid Account:**
- Account number or routing number incorrect
- Account closed
- **Solution:** Verify account details with customer

**Authorization Revoked:**
- Customer canceled the authorization
- **Solution:** Get new authorization from customer

**Bank Rejection:**
- Bank flagged transaction as suspicious
- Account frozen or restricted
- **Solution:** Customer must contact their bank

**Return Codes:** Check transaction details for specific ACH return code

---

## Debit Card Processing

### Q: How do I process a debit card payment?

**Answer:**
**In-Person (Card Present):**
1. Use card reader/terminal
2. Customer inserts/taps card
3. Enter amount
4. Customer enters PIN or signs
5. Transaction processes instantly

**Online (Card Not Present):**
1. Customer enters card details in payment form
2. Billing address for verification
3. CVV code for security
4. Submit payment
5. Approval typically instant

**Security:** All card data is encrypted and PCI-DSS compliant

---

### Q: What HSA/FSA cards do you accept?

**Answer:**
We accept all major HSA/FSA cards:
- Optum Bank
- HealthEquity
- Fidelity HSA
- WageWorks
- PayFlex
- And all other major providers

**Requirements:**
- Merchant Category Code (MCC) must be healthcare-related
- Services must be IRS-qualified medical expenses
- Itemized receipt may be required

**Declined HSA/FSA cards:**
- Service may not be IRS-qualified
- Card may not have sufficient balance
- Card may require additional documentation

---

### Q: What do I do if a card is declined?

**Answer:**
**Common decline reasons:**

**Insufficient Funds:**
- Ask customer to use different card
- Offer payment plan option

**Card Expired:**
- Request updated card information

**Incorrect Information:**
- Verify card number, expiration, CVV
- Check billing address matches

**Fraud Prevention:**
- Card issuer blocked transaction
- Customer should call number on back of card

**Technical Issue:**
- Retry transaction
- Try different payment method
- Contact support if persists

**Tip:** Always provide specific decline reason to customer (shown in transaction details)

---

## Billing & Invoices

### Q: How do I create and send an invoice?

**Answer:**
1. Go to Invoices → Create New Invoice
2. Enter customer information
3. Add line items (services, amounts)
4. Set due date
5. Add payment terms and notes
6. Preview invoice
7. Click "Send Invoice"

**Invoice includes:**
- Itemized services
- Payment link (customer can pay online)
- Due date and terms
- Your business information

**Automatic reminders:** System sends reminders 3 days before due date and on due date

---

### Q: Can customers pay invoices in installments?

**Answer:**
Yes! We offer flexible payment plans:

**Setting up payment plan:**
1. Create invoice as normal
2. Enable "Payment Plan" option
3. Choose plan type:
   - **Fixed installments:** Equal payments (e.g., 3 monthly payments)
   - **Custom schedule:** Set specific amounts and dates
4. System automatically charges customer per schedule

**Requirements:**
- Minimum $100 invoice amount
- Maximum 12 installments
- Customer must authorize recurring payments

**Fees:** Payment plan fee may apply (see your plan)

---

### Q: How do I track unpaid invoices?

**Answer:**
**Dashboard Overview:**
- Go to Invoices → Outstanding
- View all unpaid invoices sorted by due date
- See total outstanding amount

**Invoice Status:**
- **Draft:** Not sent yet
- **Sent:** Customer received, not paid
- **Viewed:** Customer opened invoice
- **Partial:** Partial payment received
- **Paid:** Fully paid
- **Overdue:** Past due date
- **Canceled:** Invoice canceled

**Actions:**
- Send reminder
- Mark as paid (if paid outside system)
- Edit invoice
- Cancel invoice

**Reports:** Export to CSV for accounting software

---

## Technical Issues

### Q: The dashboard won't load / I see a blank screen

**Answer:**
**Troubleshooting steps:**

1. **Check internet connection**
   - Verify you're online
   - Try loading other websites

2. **Clear browser cache**
   - Chrome: Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac)
   - Select "Cached images and files"
   - Clear data

3. **Try different browser**
   - Chrome (recommended)
   - Firefox
   - Safari
   - Edge

4. **Disable browser extensions**
   - Ad blockers can interfere
   - Temporarily disable and retry

5. **Check system status**
   - Visit status.advanciapayledger.com
   - Check for known outages

**Still not working?**
- Contact support with:
  - Browser and version
  - Screenshot of error (if any)
  - Steps you've tried

---

### Q: I'm getting a "Session Expired" error

**Answer:**
**Cause:** For security, sessions expire after 30 minutes of inactivity

**Solution:**
1. Click "Log In Again"
2. Enter your credentials
3. You'll return to where you were

**Prevent this:**
- Enable "Remember Me" at login (extends to 7 days)
- Keep tab active while working
- Save work frequently

**Security tip:** Never use "Remember Me" on shared computers

---

### Q: Payments are processing slowly

**Answer:**
**Check these factors:**

**Normal processing times:**
- Cards: Instant authorization, 1-2 days settlement
- ACH: 3-5 business days
- Crypto: 10-60 minutes (varies by network)

**Potential delays:**
- **Weekends/Holidays:** Traditional payments don't process
- **High volume:** Peak times may be slower
- **Verification required:** First-time customers may need additional verification
- **Network congestion:** Crypto networks can be congested

**Check status:**
- Transaction details show current status
- "Pending" is normal for ACH
- "Confirming" is normal for crypto

**Escalate if:**
- Card payment pending >24 hours
- ACH payment pending >7 days
- Crypto payment pending >24 hours

---

## Security & Privacy

### Q: Is my data secure?

**Answer:**
Yes! We implement multiple layers of security:

**Data Encryption:**
- TLS 1.3 for data in transit
- AES-256 for data at rest
- End-to-end encryption for sensitive data

**Access Controls:**
- Multi-factor authentication (MFA)
- Role-based access control
- IP whitelisting available

**Compliance:**
- HIPAA compliant (Business Associate)
- PCI-DSS Level 1 certified
- SOC 2 Type II audited

**Monitoring:**
- 24/7 security monitoring
- Automated threat detection
- Regular security audits

**Your responsibilities:**
- Use strong passwords
- Enable MFA
- Don't share credentials
- Log out on shared computers

---

### Q: How do I enable two-factor authentication (2FA)?

**Answer:**
1. Go to Settings → Security
2. Click "Enable Two-Factor Authentication"
3. Choose method:
   - **Authenticator App (recommended):** Google Authenticator, Authy
   - **SMS:** Text message to phone
   - **Email:** Code sent to email
4. Follow setup instructions
5. Save backup codes in safe place

**Why enable 2FA?**
- Protects against password theft
- Required for compliance
- Prevents unauthorized access

**Recommendation:** Use authenticator app (most secure)

---

### Q: What happens if my account is compromised?

**Answer:**
**Immediate actions:**
1. **Change password immediately**
2. **Enable 2FA** (if not already enabled)
3. **Review recent activity** (Settings → Activity Log)
4. **Contact support** (security@advanciapayledger.com)

**We will:**
- Investigate unauthorized access
- Freeze suspicious transactions
- Reset compromised credentials
- Implement additional security measures

**Prevention:**
- Never share passwords
- Use unique password for each service
- Enable 2FA
- Be cautious of phishing emails

---

## Compliance & Regulations

### Q: Are you HIPAA compliant?

**Answer:**
Yes! We are HIPAA compliant as a Business Associate.

**What this means:**
- We sign Business Associate Agreement (BAA) with you
- We protect Protected Health Information (PHI)
- We comply with HIPAA Security Rule
- We report breaches per HIPAA requirements

**Your BAA:**
- Automatically generated upon account creation
- Available in Settings → Legal Documents
- Must be signed before processing PHI

**PHI we handle:**
- Patient names (for payment matching)
- Medical record numbers (for reconciliation)
- Treatment dates (for billing)

**We do NOT:**
- Access medical records
- Store clinical information
- Share PHI without authorization

---

### Q: Do you report transactions to the IRS?

**Answer:**
**For payment processors (us):**
- We issue Form 1099-K for businesses processing:
  - >$600 in gross payments (2024 threshold)
  - Sent by January 31st following tax year

**For cryptocurrency:**
- Crypto transactions >$10,000 may be reported (IRS requirement)
- You are responsible for reporting crypto income

**Your responsibilities:**
- Report all income to IRS
- Keep accurate records
- Consult tax professional for guidance

**We provide:**
- Transaction reports for tax preparation
- Annual 1099-K (if applicable)
- Export to accounting software

---

## Common Error Messages

### Error: "Payment method declined"

**Meaning:** Payment processor rejected the transaction

**Common causes:**
- Insufficient funds
- Card expired
- Incorrect card information
- Fraud prevention

**Solution:**
- Ask customer to verify card details
- Try different payment method
- Customer should contact their bank

---

### Error: "Transaction limit exceeded"

**Meaning:** Transaction exceeds your account limits

**Limits vary by plan:**
- Basic: $10,000 per transaction, $50,000 per month
- Pro: $50,000 per transaction, $500,000 per month
- Enterprise: Custom limits

**Solution:**
- Split into multiple transactions
- Upgrade plan
- Contact support for limit increase

---

### Error: "Verification required"

**Meaning:** Additional verification needed for compliance

**Reasons:**
- Large transaction (>$10,000)
- First-time customer
- High-risk transaction
- Compliance check

**Solution:**
- Upload requested documents
- Provide additional information
- Wait for verification (1-24 hours)

---

### Error: "Blockchain network error"

**Meaning:** Issue with cryptocurrency network

**Common causes:**
- Network congestion
- Insufficient gas fee
- Wrong network selected
- Node connectivity issue

**Solution:**
- Wait and retry (network congestion)
- Increase gas fee (Ethereum)
- Verify correct network
- Contact support if persists

---

## Escalation Procedures

### When to Escalate

**Immediate Escalation (P0 - Critical):**
- Service completely down
- Data breach suspected
- Payment processing stopped
- Security incident

**High Priority (P1 - Urgent):**
- Large transaction stuck (>$10,000)
- Multiple customers affected
- Compliance issue
- VIP customer issue

**Medium Priority (P2 - Normal):**
- Single customer issue
- Feature not working
- Billing question
- General inquiry

**Low Priority (P3 - Low):**
- Feature request
- Documentation question
- Minor UI issue

---

### Escalation Contacts

**Level 1: Support Team**
- Email: support@advanciapayledger.com
- Response time: 1-4 hours
- Handles: General questions, basic troubleshooting

**Level 2: Technical Support**
- Email: tech-support@advanciapayledger.com
- Response time: 30 minutes - 2 hours
- Handles: Technical issues, payment problems

**Level 3: Engineering**
- Email: engineering@advanciapayledger.com
- Response time: 15 minutes - 1 hour
- Handles: Critical issues, bugs, outages

**Level 4: Management**
- Email: escalations@advanciapayledger.com
- Response time: Immediate for P0/P1
- Handles: VIP customers, major incidents

**Emergency Hotline:** [Phone Number]  
**PagerDuty:** For critical incidents only

---

### Escalation Template

```
Subject: [P0/P1/P2/P3] - [Brief Description]

Customer Name: [Name]
Account ID: [ID]
Issue: [Detailed description]
Impact: [How many customers affected, revenue impact]
Steps Taken: [What you've tried]
Urgency: [Why this needs escalation]
Customer Contact: [Email/Phone]

[Any relevant screenshots or logs]
```

---

## Support Resources

### Internal Resources
- [User Onboarding Guide](advanciapayledger-new/USER_ONBOARDING_GUIDE.md)
- [API Reference](advanciapayledger-new/API_REFERENCE.md)
- [Incident Response Playbook](INCIDENT_RESPONSE_PLAYBOOK.md)
- [Payment Integrations Guide](advanciapayledger-new/PAYMENT_INTEGRATIONS_COMPLETE.md)

### External Resources
- Status Page: status.advanciapayledger.com
- Help Center: help.advanciapayledger.com
- Community Forum: community.advanciapayledger.com
- Video Tutorials: youtube.com/advanciapayledger

### Support Channels
- **Email:** support@advanciapayledger.com
- **Phone:** [Phone Number] (Mon-Fri 9am-6pm EST)
- **Live Chat:** Available in dashboard (Mon-Fri 9am-9pm EST)
- **Emergency:** [Emergency Hotline] (24/7 for critical issues)

---

## Support Metrics & Goals

**Response Time Targets:**
- P0 (Critical): 15 minutes
- P1 (High): 1 hour
- P2 (Medium): 4 hours
- P3 (Low): 24 hours

**Resolution Time Targets:**
- P0: 4 hours
- P1: 24 hours
- P2: 3 days
- P3: 7 days

**Customer Satisfaction Goal:** >95%

---

**Document Version:** 1.0  
**Last Updated:** January 30, 2026  
**Next Review:** February 28, 2026  
**Maintained By:** Customer Success Team

---

*This knowledge base is a living document. Please submit updates and additions to support-docs@advanciapayledger.com*
