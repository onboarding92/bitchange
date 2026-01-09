# Hot Wallet System & Payment Gateway Integration

**Date**: January 9, 2026  
**Version**: 1.0  
**Status**: ✅ Implemented

---

## 📋 Overview

BitChange Pro now uses a **centralized hot wallet system** where each cryptocurrency has ONE master wallet address that all users deposit to. This replaces the previous system of generating unique addresses per user.

### Key Benefits

1. **Security**: Private keys are encrypted with AES-256-CBC and stored securely
2. **Simplicity**: Easier to manage and monitor balances
3. **Tracking**: Each deposit is tracked via unique reference IDs
4. **Cost-effective**: No need to monitor thousands of individual addresses

---

## 🏗️ Architecture

### Database Tables

#### `hotWallets`
Stores centralized wallet configurations for each cryptocurrency/network.

```sql
CREATE TABLE hotWallets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  symbol VARCHAR(10) NOT NULL,           -- BTC, ETH, USDT, etc.
  name VARCHAR(50) NOT NULL,             -- Bitcoin, Ethereum, etc.
  network VARCHAR(50) NOT NULL,          -- Bitcoin, Ethereum, BSC, etc.
  type VARCHAR(20) NOT NULL,             -- bitcoin, ethereum, etc.
  address VARCHAR(255) NOT NULL,         -- Hot wallet address
  privateKeyEncrypted TEXT NOT NULL,     -- AES-256 encrypted private key
  mnemonic TEXT,                         -- Encrypted mnemonic (if applicable)
  publicKey TEXT,                        -- Public key (for Bitcoin-based)
  isActive BOOLEAN DEFAULT TRUE,
  balance DECIMAL(20,8) DEFAULT 0,
  lastBalanceCheck TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

#### `paymentGateways`
Stores payment gateway configurations and API keys.

```sql
CREATE TABLE paymentGateways (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,      -- ChangeNOW, Simplex, etc.
  apiKeyEncrypted TEXT,                  -- Encrypted API key
  apiSecretEncrypted TEXT,               -- Encrypted API secret
  webhookSecret TEXT,                    -- Webhook verification secret
  isActive BOOLEAN DEFAULT FALSE,
  isSandbox BOOLEAN DEFAULT TRUE,
  supportedCurrencies TEXT,              -- JSON array
  config TEXT,                           -- JSON: Additional config
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

### Generated Wallets

**16 cryptocurrencies** across **14 unique wallet addresses**:

| Symbol | Network | Type | Notes |
|--------|---------|------|-------|
| BTC | Bitcoin | bitcoin | Native Bitcoin wallet |
| ETH | Ethereum | ethereum | ERC-20 compatible |
| USDT (ERC-20) | Ethereum | ethereum | Same address as ETH |
| USDC (ERC-20) | Ethereum | ethereum | Same address as ETH |
| LINK (ERC-20) | Ethereum | ethereum | Same address as ETH |
| BNB | Binance Smart Chain | ethereum | BEP-20 compatible |
| USDT (BEP-20) | Binance Smart Chain | ethereum | Same address as BNB |
| LTC | Litecoin | bitcoin | Bitcoin-based |
| DOGE | Dogecoin | bitcoin | Bitcoin-based |
| AVAX | Avalanche | ethereum | C-Chain compatible |
| MATIC | Polygon | ethereum | EVM compatible |
| ADA | Cardano | placeholder | *Requires Cardano lib* |
| SOL | Solana | placeholder | *Requires Solana lib* |
| XRP | Ripple | placeholder | *Requires Ripple lib* |
| DOT | Polkadot | placeholder | *Requires Polkadot lib* |
| XLM | Stellar | placeholder | *Requires Stellar lib* |

**Note**: Placeholder wallets (ADA, SOL, XRP, DOT, XLM) need production-grade libraries for real wallet generation.

---

## 🔐 Security

### Encryption

All private keys and API keys are encrypted using **AES-256-CBC** with:

- **Algorithm**: AES-256-CBC
- **Key Derivation**: scrypt (from JWT_SECRET)
- **Unique IV**: Each encrypted value has its own Initialization Vector
- **Storage Format**: `{IV_HEX}:{ENCRYPTED_DATA_HEX}`

### Private Key Storage

```typescript
// Encryption
const key = scryptSync(JWT_SECRET, 'salt', 32);
const iv = randomBytes(16);
const cipher = createCipheriv('aes-256-cbc', key, iv);
const encrypted = cipher.update(privateKey, 'utf8', 'hex') + cipher.final('hex');
const stored = `${iv.toString('hex')}:${encrypted}`;

// Decryption (ADMIN ONLY)
const [ivHex, encrypted] = stored.split(':');
const decipher = createDecipheriv('aes-256-cbc', key, Buffer.from(ivHex, 'hex'));
const privateKey = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
```

### CSV Export

**⚠️ CRITICAL**: The CSV file `BitChange_Hot_Wallets_CONFIDENTIAL.csv` contains **unencrypted private keys**!

**Security Measures**:
1. Download immediately to secure location
2. Store in encrypted USB drive or password manager
3. **NEVER** commit to version control
4. **NEVER** share via email or messaging
5. Delete from server after backup
6. Keep multiple encrypted backups in different locations

---

## 💰 Deposit Flow

### Old System (Per-User Addresses)
```
User → Selects crypto → System generates unique address → User deposits → Lost forever (no private keys!)
```

### New System (Centralized Hot Wallet)
```
User → Selects crypto → System shows master wallet + reference ID → User deposits with reference → Admin credits balance
```

### Reference ID System

Each deposit gets a unique reference ID for tracking:

**Format**: `{ASSET}-{USER_ID}-{TIMESTAMP_BASE36}-{RANDOM}`

**Example**: `BTC-42-lk3m9x-A7F2G9`

**Components**:
- `BTC`: Asset symbol
- `42`: User ID
- `lk3m9x`: Timestamp in base36
- `A7F2G9`: Random 6-character string

### tRPC Endpoints

#### `deposit.getHotWalletAddress`
Returns centralized wallet address + unique reference ID for user.

```typescript
const { data } = trpc.deposit.getHotWalletAddress.useQuery({
  asset: 'BTC',
  network: 'Bitcoin'
});

// Returns:
{
  address: 'bc1q...',
  symbol: 'BTC',
  name: 'Bitcoin',
  network: 'Bitcoin',
  type: 'bitcoin',
  referenceId: 'BTC-42-lk3m9x-A7F2G9',
  instructions: 'Send BTC to the address above and include this reference ID: BTC-42-lk3m9x-A7F2G9'
}
```

#### `deposit.listHotWallets` (Admin Only)
Lists all hot wallets with balances.

```typescript
const { data } = trpc.deposit.listHotWallets.useQuery();

// Returns array of hot wallets (without private keys)
```

---

## 💳 Payment Gateway Integration

### Supported Gateways

1. **ChangeNOW** - Crypto-to-crypto exchange
2. **Simplex** - Fiat-to-crypto (credit card)
3. **MoonPay** - Fiat-to-crypto (credit card, bank transfer)
4. **Transak** - Fiat-to-crypto (multiple payment methods)
5. **Mercuryo** - Fiat-to-crypto (credit card)
6. **CoinGate** - Crypto payments
7. **Changelly** - Crypto-to-crypto exchange
8. **Banxa** - Fiat-to-crypto (bank transfer, credit card)

### Configuration

Each gateway requires API keys to be configured by admin:

```typescript
// Admin configures gateway
await trpc.businessMetrics.updatePaymentGatewayKeys.mutate({
  gatewayId: 1, // ChangeNOW
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret', // Optional
  webhookSecret: 'your-webhook-secret' // Optional
});

// Enable gateway
await trpc.businessMetrics.togglePaymentGateway.mutate({
  gatewayId: 1,
  isActive: true
});

// Toggle sandbox mode
await trpc.businessMetrics.togglePaymentGatewaySandbox.mutate({
  gatewayId: 1,
  isSandbox: false // Use production mode
});
```

### tRPC Endpoints

#### `deposit.getPaymentGateways`
Returns list of active payment gateways.

```typescript
const { data } = trpc.deposit.getPaymentGateways.useQuery();

// Returns:
[
  {
    id: 1,
    name: 'changenow',
    supportedCurrencies: '["BTC","ETH","USDT",...]',
    config: '{...}'
  },
  ...
]
```

#### `deposit.getPaymentLink`
Generates payment link for specific gateway.

```typescript
const { data } = trpc.deposit.getPaymentLink.useQuery({
  gateway: 'moonpay',
  asset: 'BTC',
  amount: '100', // USD
  walletAddress: 'bc1q...'
});

// Returns:
{
  url: 'https://buy.moonpay.com',
  method: 'GET',
  params: {
    apiKey: '...',
    currencyCode: 'btc',
    baseCurrencyAmount: '100',
    walletAddress: 'bc1q...'
  }
}
```

---

## 🔧 Admin Management

### Hot Wallet Management

**Endpoints**:
- `businessMetrics.hotWallets` - List all hot wallets
- `businessMetrics.hotWalletStatus` - Get hot wallet health status
- `businessMetrics.walletThresholds` - Get balance thresholds
- `businessMetrics.updateWalletThreshold` - Update balance alerts

### Payment Gateway Management

**Endpoints**:
- `businessMetrics.paymentGateways` - List all gateways
- `businessMetrics.updatePaymentGatewayKeys` - Update API keys
- `businessMetrics.togglePaymentGateway` - Enable/disable gateway
- `businessMetrics.togglePaymentGatewaySandbox` - Toggle sandbox mode

---

## 📝 Implementation Checklist

### Backend ✅
- [x] Create `hotWallets` table
- [x] Create `paymentGateways` table
- [x] Generate 16 hot wallets
- [x] Export CSV with private keys
- [x] Create `hotWalletManager.ts` module
- [x] Create `paymentGatewayManager.ts` module
- [x] Add `deposit.getHotWalletAddress` endpoint
- [x] Add `deposit.getPaymentGateways` endpoint
- [x] Add `deposit.getPaymentLink` endpoint
- [x] Add admin management endpoints

### Frontend ⏳
- [ ] Update Deposit page to use `getHotWalletAddress`
- [ ] Display reference ID prominently
- [ ] Add QR code with reference ID
- [ ] Add payment gateway buttons
- [ ] Create admin UI for hot wallet management
- [ ] Create admin UI for payment gateway configuration

### Testing ⏳
- [ ] Test deposit flow with reference IDs
- [ ] Test payment gateway link generation
- [ ] Test admin management UI
- [ ] Verify encryption/decryption
- [ ] Test balance monitoring

---

## 🚀 Deployment Steps

### 1. Database Migration

```bash
# Already executed via import-hot-wallets.mjs
# Tables created: hotWallets, paymentGateways
# 16 wallets imported
# 8 payment gateways configured
```

### 2. Backup CSV File

```bash
# Download CSV from server
scp user@server:/home/ubuntu/bitchange-pro/BitChange_Hot_Wallets_CONFIDENTIAL.csv ~/secure-backup/

# Encrypt with GPG
gpg --symmetric --cipher-algo AES256 BitChange_Hot_Wallets_CONFIDENTIAL.csv

# Delete original
rm BitChange_Hot_Wallets_CONFIDENTIAL.csv

# Store encrypted file in multiple secure locations
```

### 3. Configure Payment Gateways

Admin must configure API keys for each gateway via Admin Panel:

1. Navigate to Admin Panel → Payment Gateways
2. For each gateway:
   - Enter API Key
   - Enter API Secret (if required)
   - Enter Webhook Secret (if required)
   - Toggle "Active" to enable
   - Toggle "Sandbox" for testing

### 4. Update Frontend

Update Deposit page to use new endpoints:

```typescript
// Get hot wallet address
const { data: walletInfo } = trpc.deposit.getHotWalletAddress.useQuery({
  asset: selectedAsset,
  network: selectedNetwork
});

// Display:
// - walletInfo.address (with QR code)
// - walletInfo.referenceId (prominently)
// - walletInfo.instructions

// Get payment gateways
const { data: gateways } = trpc.deposit.getPaymentGateways.useQuery();

// Display gateway buttons
gateways.map(gateway => (
  <Button onClick={() => handleGatewayClick(gateway)}>
    {gateway.name}
  </Button>
));
```

---

## ⚠️ Important Notes

### Security

1. **Private Keys**: Never expose private keys in frontend or logs
2. **CSV File**: Treat as TOP SECRET - equivalent to bank vault keys
3. **Admin Access**: Only trusted admins should access hot wallet management
4. **Encryption Key**: JWT_SECRET must be strong and never exposed

### Monitoring

1. **Balance Checks**: Implement periodic balance verification
2. **Deposit Tracking**: Monitor deposits with reference IDs
3. **Gateway Status**: Monitor payment gateway uptime
4. **Alert System**: Setup alerts for low balances or failed transactions

### Future Enhancements

1. **Blockchain Monitoring**: Automatic deposit detection via blockchain APIs
2. **Auto-Credit**: Automatically credit user balances when deposits detected
3. **Cold Wallet Integration**: Move excess funds to cold storage
4. **Multi-Signature**: Implement multi-sig for large withdrawals
5. **Hardware Security Module (HSM)**: Store private keys in HSM

---

## 📞 Support

For questions or issues:
- Check `server/hotWalletManager.ts` for implementation details
- Check `server/paymentGatewayManager.ts` for gateway integration
- Review `scripts/generate-hot-wallets.mjs` for wallet generation logic
- Contact system administrator for private key access

---

**Document Version**: 1.0  
**Last Updated**: January 9, 2026  
**Author**: BitChange Pro Development Team
