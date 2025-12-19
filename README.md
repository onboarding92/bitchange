# 🚀 BitChange Pro - Professional Cryptocurrency Exchange Platform

A modern, full-featured cryptocurrency exchange platform built with React 19, TypeScript, tRPC, and MySQL. Designed to showcase advanced full-stack development patterns and crypto exchange architecture.

![BitChange Pro](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React](https://img.shields.io/badge/React-19-blue)

## ✨ Features

### 🔐 User Features
- **Multi-Currency Wallet**: Support for 15+ cryptocurrencies (BTC, ETH, USDT, BNB, ADA, SOL, XRP, DOT, DOGE, AVAX, SHIB, MATIC, LTC, LINK, XLM)
- **Authentication System**: Email/password registration, password reset, 2FA with Google Authenticator, session management
- **Trading System**: Limit orders, real-time order book, trade history, and order management
- **Staking**: 9 pre-configured staking plans with APR from 4% to 15%
- **Deposit & Withdrawal**: Multi-network support, real crypto wallet address generation, withdrawal requests with admin approval
- **KYC System**: Complete identity verification with document upload and review
- **Support Tickets**: Priority-based ticket system with admin responses
- **Real-time Crypto Prices**: Live prices from CoinGecko API with auto-refresh
- **Profile Management**: Edit personal information, change password, 2FA settings
- **Notifications**: In-app notification system for deposits, withdrawals, KYC updates, and trades
- **Referral System**: Earn rewards by referring new users

### 👨‍💼 Admin Features
- **Admin Dashboard**: Real-time statistics, trading volume charts, user growth analytics
- **Analytics Dashboard**: Advanced metrics with time range filters (7d, 30d, 90d, 1y)
- **User Management Panel**: Search/filter users, edit roles, suspend accounts, manual balance adjustment
- **Hot Wallet Management**: Create and manage master wallets, view balances, monitor address pools
- **Transaction Logs**: Complete logs of all transactions with filters and CSV export
- **Withdrawal Management**: Approve/reject withdrawal requests with admin notes
- **KYC Verification**: Review and approve/reject KYC submissions with document preview
- **Support Management**: View and respond to user tickets with priority handling

### 🎨 Design
- **Modern Dark Theme**: Elegant design with improved contrast and readability
- **Responsive**: Mobile-first design that works seamlessly on all devices
- **Smooth Animations**: Professional transitions and micro-interactions
- **Live Price Ticker**: Real-time crypto prices on homepage
- **Interactive Charts**: Data visualization with Recharts library

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **tRPC** for type-safe API calls
- **Wouter** for routing
- **shadcn/ui** components
- **Recharts** for data visualization

### Backend
- **Express 4** server
- **tRPC 11** for API layer
- **MySQL** database (via Drizzle ORM)
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Redis** for caching (optional)

### Crypto Libraries
- **bitcoinjs-lib** for Bitcoin wallet generation
- **ethers.js** for Ethereum/EVM chains
- **tronweb** for Tron network
- **@solana/web3.js** for Solana network
- **speakeasy** for 2FA TOTP generation

## 📦 Installation

### Prerequisites
- Node.js 22+
- MySQL 8+
- pnpm (recommended) or npm
- Redis (optional, for caching)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/onboarding92/bitchange.git
cd bitchange
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/bitchange_pro

# JWT Secret (change this!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Wallet Master Seed (change this!)
WALLET_MASTER_SEED=your-random-hex-seed-64-chars

# Server
NODE_ENV=development
PORT=3000
DOMAIN=localhost

# Redis (optional)
REDIS_URL=redis://localhost:6379

# CoinGecko API (optional, uses free tier by default)
COINGECKO_API_KEY=your-api-key
```

4. **Initialize database**
```bash
# Push schema to database
pnpm db:push

# Seed initial data (networks, staking plans)
node scripts/seed-networks.mjs
node scripts/seed-staking-plans.mjs
```

5. **Start development server**
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## 🚀 Production Deployment

### Docker Deployment (Recommended)

The easiest way to deploy BitChange Pro is using Docker Compose.

**Quick Deploy:**
```bash
# On your VPS
git clone https://github.com/onboarding92/bitchange.git
cd bitchange

# Create .env file with production values
nano .env

# Run automated deployment
chmod +x deploy.sh
sudo ./deploy.sh
```

The script will:
- Install Docker & Docker Compose
- Setup SSL certificates (Let's Encrypt)
- Build and start all containers (app, database, nginx, redis)
- Run database migrations
- Seed initial data

**See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide.**

## 📁 Project Structure

```
bitchange-pro/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   └── lib/           # Utilities and tRPC client
│   └── public/            # Static assets
├── server/                # Backend Express + tRPC
│   ├── routers.ts        # tRPC routers
│   ├── db.ts             # Database helpers
│   ├── walletGenerator.ts # Crypto wallet generation
│   ├── cryptoPrices.ts   # Price fetching service
│   └── tradingEngine.ts  # Order matching engine
├── drizzle/              # Database schema and migrations
│   └── schema.ts         # Drizzle ORM schema
└── scripts/              # Utility scripts
```

## 🔑 Default Admin Access

**First registered user becomes admin automatically.**

Alternatively, update user role in database:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

Or use the provided test credentials (see `test-users.sql`):
- **Admin**: admin@bitchangemoney.xyz / Admin123!
- **User**: user@bitchange.test / User123!

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## 📚 Key Features Explained

### Trading Engine
- Real-time order matching algorithm
- Support for limit and market orders
- Order book with price aggregation
- Trade history with CSV export

### Wallet System
- Hierarchical Deterministic (HD) wallet generation
- Multi-network support (BTC, ETH, TRC20, etc.)
- Address pool management
- Master wallet for admin operations

### Security Features
- Password hashing with bcrypt
- JWT-based authentication
- 2FA with Google Authenticator
- Session management
- Role-based access control (RBAC)

### Admin Analytics
- Real-time platform metrics
- User growth charts
- Trading volume analytics
- Time range filters (7d, 30d, 90d, 1y)
- KYC status tracking

## ⚠️ Important Notes

1. **Security**: This project implements industry-standard security practices including password hashing, JWT authentication, and input validation. However, for production use, additional security audits are recommended.

2. **Wallet Security**: The wallet generation system uses HD wallets with BIP39 mnemonic phrases. For production, consider implementing hardware security modules (HSMs) and multi-signature wallets.

3. **Regulatory Compliance**: Operating a cryptocurrency exchange may require licenses and compliance with financial regulations in your jurisdiction. Ensure you understand and comply with all applicable laws.

4. **Testing**: Always test thoroughly in a staging environment before deploying to production.

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Developed by Luca Benzi** | [GitHub](https://github.com/onboarding92)
