# 🚀 BitChange Pro - Professional Cryptocurrency Exchange Platform

A modern, full-featured cryptocurrency exchange platform built with React 19, TypeScript, tRPC, and MySQL. Designed to showcase advanced full-stack development patterns and crypto exchange architecture.

![BitChange Pro](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React](https://img.shields.io/badge/React-19-blue)

## ✨ Features

### 🔐 User Features
- **Multi-Currency Wallet**: Support for 15+ cryptocurrencies (BTC, ETH, USDT, BNB, ADA, SOL, XRP, DOT, DOGE, AVAX, SHIB, MATIC, LTC, LINK, XLM)
- **Authentication System**: Email/password registration, email verification, password reset, 2FA with Google Authenticator, session management
- **Email Notifications**: SendGrid integration for welcome emails, verification codes, password reset, login alerts, withdrawal notifications, and KYC status updates
- **Trading System**: Limit orders, real-time order book, trade history, and order management
- **TradingView Charts**: Professional real-time price charts with technical indicators (RSI, MA) and multiple timeframes (1m, 15m, 30m, 1h)
- **Order Book Depth Visualization**: Interactive depth chart showing cumulative bid/ask liquidity
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

### 🎨 Design & Performance
- **Modern Dark Theme**: Elegant design with improved contrast and readability
- **Responsive**: Mobile-first design that works seamlessly on all devices
- **Smooth Animations**: Professional transitions and micro-interactions
- **Live Price Ticker**: Real-time crypto prices on homepage
- **Interactive Charts**: Data visualization with Recharts library
- **TradingView Integration**: Professional trading charts with real-time data
- **Depth Charts**: Visual representation of order book liquidity
- **⚡ Performance Optimized**: 95% bundle size reduction with code-splitting and lazy loading (1.3MB → 36KB initial load)

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **tRPC** for type-safe API calls
- **Wouter** for routing
- **shadcn/ui** components
- **Recharts** for data visualization
- **React.lazy()** for code-splitting

### Backend
- **Express 4** server
- **tRPC 11** for API layer
- **MySQL** database (via Drizzle ORM)
- **JWT** for authentication
- **Bcrypt** for password hashing
- **SendGrid** for email delivery
- **Redis** for caching (price data, sessions)
- **cookie-parser** for session management

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

# SendGrid Email (required for email notifications)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME="BitChange Pro"

# Redis (recommended for production)
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
│   │   ├── pages/         # Page components (lazy-loaded)
│   │   ├── components/    # Reusable UI components
│   │   └── lib/           # Utilities and tRPC client
│   └── public/            # Static assets
├── server/                # Backend Express + tRPC
│   ├── routers.ts        # tRPC routers
│   ├── db.ts             # Database helpers
│   ├── email.ts          # SendGrid email templates
│   ├── walletGenerator.ts # Crypto wallet generation
│   ├── cryptoPrices.ts   # Price fetching service
│   └── tradingEngine.ts  # Order matching engine
├── drizzle/              # Database schema and migrations
│   └── schema.ts         # Drizzle ORM schema
├── vite.config.ts        # Vite with code-splitting config
└── scripts/              # Utility scripts
```

## 🔑 Default Admin Access

**First registered user becomes admin automatically.**

Alternatively, update user role in database:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

Or use the provided test credentials:
- **Admin**: admin@bitchangemoney.xyz / Admin123!
- **User**: trader1@test.com / Test123!

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Test SendGrid email integration
pnpm test server/email.test.ts
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
- JWT-based authentication with secure cookies
- 2FA with Google Authenticator
- Session management with cookie-parser
- Role-based access control (RBAC)
- Rate limiting on sensitive endpoints

### Email System
- SendGrid integration with 6 email templates:
  * Welcome email (registration confirmation)
  * Email verification with code
  * Password reset with secure link
  * Login alert notifications
  * Withdrawal request notifications
  * KYC status updates (approved/rejected)

### Performance Optimization
- **95% bundle size reduction**: 1.3MB → 36KB initial load (gzip: 8.36KB)
- React.lazy() for code-splitting all non-critical pages
- Vite manualChunks for optimal vendor splitting:
  * react-vendor: 671KB (gzip: 184KB)
  * vendor: 261KB (gzip: 89KB)
  * admin-pages: 161KB (gzip: 27KB) - loaded only for admins
  * trpc-vendor: 23KB (gzip: 7KB)
  * chart-vendor: 6KB (gzip: 2KB)
- Individual page chunks: 5-17KB each
- Loading spinner for lazy-loaded routes

## ⚠️ Important Notes

1. **Email Configuration**: SendGrid is required for email notifications (registration verification, password reset, etc.). Sign up at [SendGrid](https://sendgrid.com/) and configure the API key in your `.env` file.

2. **Security**: This project implements industry-standard security practices including password hashing, JWT authentication, and input validation. However, for production use, additional security audits are recommended.

3. **Wallet Security**: The wallet generation system uses HD wallets with BIP39 mnemonic phrases. For production, consider implementing hardware security modules (HSMs) and multi-signature wallets.

4. **Regulatory Compliance**: Operating a cryptocurrency exchange may require licenses and compliance with financial regulations in your jurisdiction. Ensure you understand and comply with all applicable laws.

5. **Testing**: Always test thoroughly in a staging environment before deploying to production.

## 🎯 Current Status

**Live Production Site:** [https://bitchangemoney.xyz/](https://bitchangemoney.xyz/)

### ✅ Fully Operational
- User registration with email verification
- Email/password authentication with secure session management
- SendGrid email delivery (6 templates: welcome, verification, password reset, login alerts, withdrawals, KYC)
- Trading engine with order matching
- TradingView charts with real-time data
- Multi-currency wallets
- Admin panel with full management capabilities
- Real-time crypto price updates
- KYC verification system
- Staking and referral programs
- Performance optimized (95% bundle reduction)

### 🚀 Recent Updates (Dec 19, 2025)

#### Phase 5: Authentication & Performance
- ✅ **Fixed critical authentication bug**: Added cookie-parser middleware for session management
- ✅ **Fixed logout redirect**: Now properly redirects to `/auth/login`
- ✅ **Fixed homepage navigation**: All buttons (Sign In, Get Started, View Markets) working correctly
- ✅ **Performance optimization**: Implemented lazy loading and code-splitting
  * 95% reduction in initial bundle size (1.3MB → 36KB)
  * React.lazy() for all non-critical pages
  * Vite manualChunks for vendor splitting
  * Loading spinner for lazy-loaded routes
- ✅ **Verified TradingView charts**: Working perfectly in production with RSI, volume, and timeframe controls
- ✅ **Verified SendGrid emails**: All 6 email templates tested and working
- ✅ **Deployed to production**: All fixes and optimizations live on bitchangemoney.xyz

### 🔧 Technical Improvements
- Added cookie-parser middleware for proper session cookie handling
- Changed cookie sameSite from 'none' to 'lax' for better security
- Fixed optional chaining for headers access (user-agent, x-forwarded-proto)
- Replaced shadcn/ui Button onClick with Link component for navigation
- Implemented React.Suspense with PageLoader fallback
- Configured Vite rollupOptions for manual chunk splitting

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Developed by Luca Benzi** | [GitHub](https://github.com/onboarding92)
