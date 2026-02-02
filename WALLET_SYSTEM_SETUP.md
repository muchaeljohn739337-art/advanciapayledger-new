# Wallet System Setup Guide

## ✅ Installation Complete

The `@solana/spl-token` dependency has been successfully installed in the backend.

**Installed packages:** 34 packages added
**Status:** Ready for configuration

---

## 🔧 Environment Configuration

### Required Environment Variables

Add the following to your `backend/.env` file:

```env
# Platform Wallet Configuration (for admin crypto transfers)
PLATFORM_WALLET_PRIVATE_KEY=your_platform_wallet_secret_key_here
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
ACCOUNTANT_EMAIL=your_accountant@example.com
```

### Variable Details

#### 1. `PLATFORM_WALLET_PRIVATE_KEY`
- **Format:** Base58-encoded private key
- **Security:** ⚠️ **CRITICAL** - Never commit this to version control
- **How to get:**
  ```bash
  # If you have a Solana wallet JSON file
  solana-keygen pubkey /path/to/wallet.json
  
  # To export private key (keep this secure!)
  cat /path/to/wallet.json
  ```
- **Example format:** `5J7W...base58string...xyz` (64 characters base58)

#### 2. `SOLANA_RPC_URL`
- **Mainnet (Production):** `https://api.mainnet-beta.solana.com`
- **Devnet (Testing):** `https://api.devnet.solana.com`
- **Custom RPC (Recommended for production):**
  - QuickNode: `https://your-endpoint.solana-mainnet.quiknode.pro/`
  - Alchemy: `https://solana-mainnet.g.alchemy.com/v2/your-api-key`
  - Helius: `https://mainnet.helius-rpc.com/?api-key=your-api-key`

#### 3. `ACCOUNTANT_EMAIL`
- **Purpose:** Receives notifications for all crypto transfers
- **Format:** Valid email address
- **Example:** `accountant@advanciapayledger.com`

---

## 🔒 Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] `PLATFORM_WALLET_PRIVATE_KEY` is never committed to version control
- [ ] Private key is stored securely (consider using secrets manager in production)
- [ ] Email service is configured (`POSTMARK_API_KEY` or `RESEND_API_KEY`)
- [ ] `EMAIL_FROM` is set to a valid sender address
- [ ] Admin authentication is properly configured
- [ ] Audit logging is enabled in database

---

## 📝 Configuration Steps

### Step 1: Copy Environment Template
```bash
cd backend
cp .env.example .env
```

### Step 2: Generate or Import Wallet

**Option A: Create New Wallet**
```bash
solana-keygen new --outfile platform-wallet.json
```

**Option B: Use Existing Wallet**
- Ensure you have the private key in base58 format
- For Phantom/Solflare wallets, export the private key from wallet settings

### Step 3: Update `.env` File
```bash
# Edit backend/.env
nano .env  # or use your preferred editor
```

Add your actual values:
```env
PLATFORM_WALLET_PRIVATE_KEY=<your-actual-private-key>
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
ACCOUNTANT_EMAIL=accountant@yourdomain.com
```

### Step 4: Verify Email Service
Ensure one of these is configured:
```env
# Option 1: Postmark
POSTMARK_API_KEY=your-postmark-api-key-here
EMAIL_FROM=noreply@advanciapayledger.com

# Option 2: Resend
RESEND_API_KEY=your-resend-api-key-here
EMAIL_FROM=noreply@advanciapayledger.com
```

### Step 5: Test Configuration
```bash
# Start backend server
npm run dev

# Check logs for any configuration errors
```

---

## 🚀 Usage

### Admin Wallet Transfer Flow

1. **Access Admin Console**
   - Navigate to `/admin` in your frontend
   - Click on "Wallet" tab

2. **View Wallet Details**
   - Current USDC balance displayed
   - Platform wallet address shown

3. **Execute Transfer**
   - Fill in recipient Solana address
   - Enter amount in USDC
   - Add memo (optional)
   - Click "Transfer"
   - Confirm in modal

4. **Email Notification**
   - After successful transfer, click "Email Accountant"
   - Accountant receives detailed transaction notification
   - Includes transaction hash, amount, recipient, and Solscan link

5. **View History**
   - All transfers logged in transfer history
   - Audit trail maintained in database

---

## 🧪 Testing (Devnet)

For testing without real funds:

```env
# Use devnet for testing
SOLANA_RPC_URL=https://api.devnet.solana.com
```

Get devnet SOL:
```bash
solana airdrop 2 <your-wallet-address> --url devnet
```

Get devnet USDC from [Solana Faucet](https://spl-token-faucet.com/)

---

## 📊 Monitoring

### Transaction Verification
- Check Solscan: `https://solscan.io/tx/<transaction-hash>`
- Verify wallet balance: `https://solscan.io/account/<wallet-address>`

### Audit Logs
All transfers are logged in the `AuditLog` table:
- User ID
- Action type
- Metadata (recipient, amount, token, network)
- Timestamp
- IP address

---

## ⚠️ Production Considerations

### 1. Use Premium RPC Provider
Free public RPCs have rate limits. For production:
- **QuickNode** (recommended): $49/month for 40M credits
- **Alchemy**: Free tier available, paid plans for scale
- **Helius**: Optimized for Solana, $99/month

### 2. Secrets Management
Instead of `.env` file in production:
- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**
- **Google Cloud Secret Manager**

### 3. Multi-Signature Wallet
For large amounts, consider:
- Squads Protocol (Solana multi-sig)
- Require multiple admin approvals
- Implement spending limits

### 4. Rate Limiting
- Implement transfer limits per time period
- Add cooldown between large transfers
- Require additional verification for amounts > threshold

---

## 🐛 Troubleshooting

### Error: "Invalid private key format"
- Ensure private key is base58-encoded
- Check for extra whitespace or quotes
- Verify key length (typically 88 characters base58)

### Error: "Insufficient funds"
- Check wallet balance on Solscan
- Ensure wallet has SOL for transaction fees (~0.000005 SOL per tx)
- Verify USDC token account exists

### Error: "Email not sent"
- Verify `POSTMARK_API_KEY` or `RESEND_API_KEY` is set
- Check `EMAIL_FROM` is a verified sender domain
- Review email service logs

### Error: "RPC request failed"
- Check `SOLANA_RPC_URL` is accessible
- Verify network connectivity
- Consider switching to backup RPC provider

---

## 📚 Additional Resources

- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [SPL Token Documentation](https://spl.solana.com/token)
- [Solscan Explorer](https://solscan.io/)
- [Solana CLI Tools](https://docs.solana.com/cli)

---

## ✅ Setup Complete

Once configured, your wallet system will:
- ✅ Display real-time USDC balance
- ✅ Execute secure Solana transfers
- ✅ Maintain complete audit trail
- ✅ Send email notifications to accountant
- ✅ Provide transaction history

**Next Steps:**
1. Configure environment variables
2. Test with small amount on devnet
3. Verify email notifications work
4. Execute production transfer
