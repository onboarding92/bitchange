# 🚀 BitChange Pro - Professional Cryptocurrency Exchange

A modern, full-featured cryptocurrency exchange platform built with React 19, TypeScript, tRPC, and MySQL. Designed to handle 100+ users per day with professional-grade features.

![BitChange Pro](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React](https://img.shields.io/badge/React-19-blue)

## ✨ Features

### 🔐 User Features
- **Multi-Currency Wallet**: Support for 15+ cryptocurrencies (BTC, ETH, USDT, BNB, ADA, SOL, XRP, DOT, DOGE, AVAX, SHIB, MATIC, LTC, LINK, XLM)
- **Trading System**: Limit orders, order book, trade history, and order management
- **Staking**: 9 pre-configured staking plans with APR from 4% to 15% (flexible and locked periods)
- **Deposit & Withdrawal**: 
  - 8 payment gateway integrations (ChangeNOW, Simplex, MoonPay, Transak, Mercuryo, CoinGate, Changelly, Banxa)
  - Crypto deposits via unique wallet addresses (with QR codes)
  - Withdrawal requests with admin approval workflow
- **KYC System**: Complete identity verification with document upload (ID, selfie, proof of address)
- **Support Tickets**: Priority-based ticket system with admin responses
- **Real-time Crypto Prices**: Live prices from CoinGecko API with auto-refresh

### 👨‍💼 Admin Features
- **Dashboard**: Real-time statistics and overview
- **Withdrawal Management**: Approve/reject withdrawal requests
- **KYC Verification**: Review and approve/reject KYC submissions with document viewer
- **Support Management**: View and respond to user tickets
- **Staking Plans CRUD**: Create and delete staking plans
- **Promo Codes CRUD**: Create and manage promotional codes
- **User Management**: View users and change roles

### 🎨 Design
- **Dark Theme**: Elegant purple/blue gradient design
- **Glass Morphism**: Modern UI effects
- **Responsive**: Mobile-first design
- **Smooth Animations**: Professional transitions
- **Live Price Ticker**: Real-time crypto prices on homepage

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **tRPC** for type-safe API calls
- **Wouter** for routing
- **shadcn/ui** components
- **Recharts** for data visualization
- **QRCode.react** for QR code generation

### Backend
- **Express 4** server
- **tRPC 11** for API layer
- **MySQL** database (via Drizzle ORM)
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Multer** for file uploads
- **Ethers.js** for wallet address generation

### Database
- **MySQL** (compatible with TiDB, PlanetScale)
- **Drizzle ORM** for type-safe queries
- 15 tables: users, wallets, orders, trades, stakingPlans, stakingPositions, deposits, withdrawals, kycDocuments, supportTickets, ticketReplies, promoCodes, promoUsage, transactions, systemLogs, walletAddresses

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

# Manus OAuth (for development, optional)
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/oauth

# Owner Info (first user becomes admin)
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Admin Name

# CoinGecko API (optional, uses free tier by default)
COINGECKO_API_KEY=your-api-key

# Payment Gateway APIs (optional, add when ready)
# CHANGENOW_API_KEY=
# SIMPLEX_API_KEY=
# MOONPAY_API_KEY=
# TRANSAK_API_KEY=
# MERCURYO_API_KEY=
# COINGATE_API_KEY=
# CHANGELLY_API_KEY=
# BANXA_API_KEY=
```

4. **Initialize database**
```bash
# Push schema to database
pnpm db:push

# Seed staking plans (optional)
node scripts/seed-staking-plans.mjs
```

5. **Start development server**
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## 🚀 Production Deployment

### Build for production
```bash
pnpm build
pnpm start
```

### VPS Deployment (Ubuntu/Debian)

1. **Install dependencies**
```bash
sudo apt update
sudo apt install nodejs npm mysql-server nginx
sudo npm install -g pnpm pm2
```

2. **Clone and setup**
```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/bitchange-pro.git
cd bitchange-pro
pnpm install
pnpm build
```

3. **Configure MySQL**
```bash
sudo mysql
CREATE DATABASE bitchange_pro;
CREATE USER 'bitchange'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON bitchange_pro.* TO 'bitchange'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

4. **Setup environment**
```bash
cp .env.example .env
nano .env  # Edit with your production values
```

5. **Push database schema**
```bash
pnpm db:push
```

6. **Start with PM2**
```bash
pm2 start npm --name "bitchange-pro" -- start
pm2 save
pm2 startup
```

7. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /var/www/bitchange-pro/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

8. **Enable HTTPS with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 📁 Project Structure

```
bitchange-pro/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities and tRPC client
│   └── public/            # Static assets
├── server/                # Backend Express + tRPC
│   ├── _core/            # Core server setup
│   ├── routers.ts        # tRPC routers
│   ├── db.ts             # Database helpers
│   ├── walletGenerator.ts # Crypto wallet generation
│   ├── cryptoPrices.ts   # Price fetching service
│   └── upload.ts         # File upload handler
├── drizzle/              # Database schema and migrations
│   └── schema.ts         # Drizzle ORM schema
├── shared/               # Shared types and constants
├── uploads/              # User uploaded files (KYC documents)
└── scripts/              # Utility scripts
```

## 🔑 Default Admin Access

The first user to register with the `OWNER_OPEN_ID` (from .env) automatically becomes an admin. To create additional admins, update the user's role in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## 📊 Database Schema

### Core Tables
- **users**: User accounts with KYC status and role
- **wallets**: Multi-currency balances (available + locked)
- **walletAddresses**: Generated deposit addresses per user/asset
- **transactions**: All financial transactions history

### Trading
- **orders**: Limit orders (buy/sell)
- **trades**: Executed trades

### Staking
- **stakingPlans**: Available staking plans (asset, APR, lock period)
- **stakingPositions**: Active user staking positions

### Finance
- **deposits**: Deposit requests and history
- **withdrawals**: Withdrawal requests (pending/approved/rejected)

### Compliance
- **kycDocuments**: KYC submissions with document URLs
- **supportTickets**: User support tickets
- **ticketReplies**: Admin responses to tickets

### Marketing
- **promoCodes**: Promotional codes with usage limits
- **promoUsage**: Promo code redemption history

### System
- **systemLogs**: System events and admin actions

## 🔐 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **SQL Injection Protection**: Drizzle ORM parameterized queries
- **File Upload Validation**: Type and size restrictions
- **Role-Based Access Control**: Admin-only endpoints
- **CORS Protection**: Configured for production
- **Rate Limiting**: (TODO) Implement rate limiting

## 🚧 Roadmap

### Phase 1: Core Features (✅ Completed)
- [x] User registration and authentication
- [x] Multi-currency wallet system
- [x] Trading engine with order book
- [x] Staking system
- [x] Deposit & withdrawal
- [x] KYC verification
- [x] Admin panel
- [x] Support tickets

### Phase 2: Enhancements (🚧 In Progress)
- [ ] Email/Password authentication (independent from Manus OAuth)
- [ ] Network selector for deposits (ERC20, TRC20, BEP20, etc.)
- [ ] Matching engine for automatic order execution
- [ ] TradingView charts integration
- [ ] Email notifications
- [ ] 2FA authentication

### Phase 3: Advanced Features (📋 Planned)
- [ ] Payment gateway API integration (real APIs)
- [ ] Referral program
- [ ] API for third-party integrations
- [ ] Mobile app (React Native)
- [ ] Advanced trading features (stop-loss, take-profit)
- [ ] Margin trading
- [ ] Futures trading

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **CoinGecko** for crypto price data
- **shadcn/ui** for beautiful UI components
- **Manus** for development platform
- **Drizzle ORM** for type-safe database queries

## 📧 Support

For support, email support@bitchange.pro or create an issue in this repository.

## ⚠️ Disclaimer

This is a demonstration project. Before using in production:
1. Implement proper security audits
2. Add comprehensive error handling
3. Implement rate limiting
4. Add monitoring and logging
5. Comply with local regulations (KYC/AML)
6. Obtain necessary licenses for operating a cryptocurrency exchange

---

**Built with ❤️ by the BitChange Team**
