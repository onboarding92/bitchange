# 🎓 BitChange Pro - Educational Cryptocurrency Exchange

> **⚠️ EDUCATIONAL PURPOSE ONLY**  
> This is a demonstration cryptocurrency exchange platform built for learning and educational purposes.  
> **NOT intended for production use with real funds.**

A modern, full-featured cryptocurrency exchange platform built with React 19, TypeScript, tRPC, and MySQL. Perfect for learning about crypto exchange architecture, blockchain integration, and full-stack development.

![BitChange Pro](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React](https://img.shields.io/badge/React-19-blue)

## ✨ Features

### 🔐 User Features
- **Multi-Currency Wallet**: Support for 15+ cryptocurrencies (BTC, ETH, USDT, BNB, ADA, SOL, XRP, DOT, DOGE, AVAX, SHIB, MATIC, LTC, LINK, XLM)
- **Authentication System**: Email/password registration, password reset, 2FA with Google Authenticator, session management
- **Trading System**: Limit orders, order book, trade history, and order management
- **Staking**: 9 pre-configured staking plans with APR from 4% to 15%
- **Deposit & Withdrawal**: Network selector for deposits, real crypto wallet address generation, withdrawal requests with admin approval
- **KYC System**: Complete identity verification with document upload
- **Support Tickets**: Priority-based ticket system with admin responses
- **Real-time Crypto Prices**: Live prices from CoinGecko API with auto-refresh
- **Profile Management**: Edit personal information, change password, 2FA settings
- **Notifications**: In-app notification system for deposits, withdrawals, KYC updates

### 👨‍💼 Admin Features
- **Admin Dashboard**: Real-time statistics, trading volume charts, user growth charts, alert system
- **User Management Panel**: Search/filter users, edit roles, suspend accounts, manual balance adjustment
- **Hot Wallet Management**: Create and manage master wallets, view balances, monitor address pools
- **Transaction Logs**: Complete logs of all transactions with filters and CSV export
- **Withdrawal Management**: Approve/reject withdrawal requests
- **KYC Verification**: Review and approve/reject KYC submissions
- **Support Management**: View and respond to user tickets

### 🎨 Design
- **Modern Dark Theme**: Elegant design with improved contrast and readability
- **Responsive**: Mobile-first design that works on all devices
- **Smooth Animations**: Professional transitions and interactions
- **Live Price Ticker**: Real-time crypto prices on homepage

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

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/bitchange-pro.git
cd bitchange-pro
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
git clone https://github.com/YOUR_USERNAME/bitchange-pro.git
cd bitchange-pro

# Create .env file with production values
nano .env

# Run automated deployment
chmod +x deploy.sh
sudo ./deploy.sh
```

The script will:
- Install Docker & Docker Compose
- Setup SSL certificates (Let's Encrypt)
- Build and start all containers (app, database, nginx)
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
│   └── cryptoPrices.ts   # Price fetching service
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

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## 📚 Learning Resources

This project demonstrates:
- **Full-stack TypeScript development** with end-to-end type safety
- **tRPC integration** for type-safe APIs without code generation
- **Crypto wallet generation** for multiple blockchains
- **Real-time data** with live price updates
- **Authentication & Authorization** with JWT and role-based access
- **Database design** for financial applications
- **File uploads** and document management
- **Admin panel** development patterns

## ⚠️ Important Disclaimers

1. **Educational Use Only**: This platform is designed for learning purposes and should not be used with real funds or in production without significant security audits and enhancements.

2. **Security**: While this project implements basic security measures (password hashing, JWT auth, input validation), it has not undergone professional security audits. Do not use for real cryptocurrency transactions.

3. **Regulatory Compliance**: Operating a cryptocurrency exchange requires licenses and compliance with financial regulations in most jurisdictions. This is a demonstration project only.

4. **Wallet Security**: The wallet generation system is for demonstration purposes. Production systems require hardware security modules (HSMs) and multi-signature wallets.

5. **No Warranty**: This software is provided "as is" without warranty of any kind. Use at your own risk.

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For questions or issues, please open an issue on GitHub.

---

**Built with ❤️ for educational purposes**
