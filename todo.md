# BitChange Pro - Complete Exchange TODO

## Database Schema ✓
- [x] Users table extended (KYC, 2FA)
- [x] Wallets table (multi-currency)
- [x] Orders table (trading)
- [x] Trades table (executed trades)
- [x] Staking plans and positions
- [x] Deposits and withdrawals
- [x] KYC documents
- [x] Support tickets and replies
- [x] Promo codes and usage
- [x] System logs

## Backend Routers ✓
- [x] Wallet router (list, transactions)
- [ ] Trading router (orderBook, placeOrder, cancelOrder, myOrders, myTrades)
- [ ] Staking router (plans, stake, myPositions)
- [ ] Deposit router (create, list)
- [ ] Withdrawal router (create, list)
- [ ] KYC router (submit, status)
- [ ] Support router (createTicket, myTickets, replyTicket)
- [ ] Promo router (apply)
- [x] Admin router (stats)

## Frontend Pages ✓
- [x] Home (landing page elegante)
- [x] Dashboard (overview + stats)
- [ ] Wallet (balances + transactions)
- [ ] Trading (order book + place orders)
- [ ] Staking (plans + positions)
- [ ] Deposit (payment gateway)
- [ ] Withdraw (address + amount)
- [ ] KYC (document upload)
- [ ] Support (tickets)
- [ ] Profile & Security
- [ ] Admin Dashboard
- [ ] Admin Withdrawals
- [ ] Admin KYC
- [ ] Admin Promos
- [ ] Admin Logs

## Design & UX ✓
- [x] Dark theme elegante (purple/blue)
- [x] Responsive layout
- [x] Smooth animations
- [x] Glass morphism effects
- [x] Gradient accents

## Testing ✓
- [ ] Vitest tests per routers critici

## Bug Fixes
- [x] Correggere routing in App.tsx (spazi nelle route)


## Step 1: Trading System (COMPLETED)
- [x] Router trading.orderBook (get buy/sell orders)
- [x] Router trading.placeOrder (create limit/market orders)
- [x] Router trading.cancelOrder (cancel open orders)
- [x] Router trading.myOrders (user's orders history)
- [x] Router trading.myTrades (user's executed trades)
- [ ] Matching engine function (da implementare)
- [x] Pagina Trading con order book UI
- [x] Form per piazzare ordini buy/sell
- [x] Lista ordini aperti con cancel button
- [x] Trade history table


## Step 2: Staking System (COMPLETED)
- [x] Router staking.plans (lista piani disponibili)
- [x] Router staking.stake (creare posizione staking)
- [x] Router staking.myPositions (posizioni attive utente)
- [x] Router staking.unstake (ritirare staking + rewards)
- [x] Pagina Staking con piani disponibili
- [x] Card per ogni piano con APR, duration, min amount
- [x] Lista posizioni attive con rewards accumulated
- [x] Calcolo automatico rewards compound
- [x] Seed script con 9 piani staking (BTC, ETH, USDT)


## Step 3: Deposit & Withdrawal System (COMPLETED)
- [x] Router deposit.create (creare richiesta deposito)
- [x] Router deposit.list (lista depositi utente)
- [x] Router withdrawal.create (creare richiesta prelievo)
- [x] Router withdrawal.list (lista prelievi utente)
- [x] Router admin.withdrawals (lista prelievi pending)
- [x] Router admin.approveWithdrawal
- [x] Router admin.rejectWithdrawal
- [x] Pagina Deposit con 8 payment gateways:
  * ChangeNow
  * Simplex
  * MoonPay
  * Transak
  * Mercuryo
  * CoinGate
  * Changelly
  * Banxa
- [x] Pagina Withdrawal con form e lista pending
- [x] Admin panel per approval workflow (backend ready)


## Step 4: KYC & Support System (COMPLETED)
- [x] Router kyc.submit (submit KYC documents)
- [x] Router kyc.status (check KYC status)
- [x] Router admin.kycList (lista KYC pending)
- [x] Router admin.approveKyc
- [x] Router admin.rejectKyc
- [x] Router support.createTicket
- [x] Router support.myTickets
- [x] Router support.replyTicket
- [x] Router admin.tickets (lista tutti i tickets)
- [x] Router admin.replyToTicket
- [x] Pagina KYC con document upload (ID, Passport, Driver License)
- [x] Pagina Support con form create ticket e lista tickets
- [x] File upload UI (S3 integration ready)


## Step 5: Admin Panel Completo (COMPLETED)
- [x] Pagina Admin Dashboard con stats overview
- [x] Sezione Withdrawals Management (list, approve, reject)
- [x] Sezione KYC Management (list, view documents, approve/reject)
- [x] Sezione Support Tickets Management (list, reply placeholder)
- [x] Admin-only sidebar link (visible solo per role=admin)
- [x] Tabs navigation (Withdrawals, KYC, Support)
- [x] KYC document viewer dialog
- [x] Real-time stats display
- [x] Color-coded badges per status e priority
- [ ] Sezione Promo Codes (future)
- [ ] Sezione System Logs (future)
- [ ] Sezione Users Management (future)


## IMPROVEMENTS RICHIESTI (IN PROGRESS)

### 1. Sistema Login/Register
- [ ] Pagina Login con email/password
- [ ] Pagina Register con email verification
- [ ] Password recovery flow
- [ ] Backend auth router (register, login, verify email, reset password)
- [ ] JWT token management
- [ ] Session persistence
- [ ] Admin login separato con credenziali speciali

### 2. Trading Migliorato
- [x] Integrazione API CoinGecko per prezzi real-time
- [x] Router prices (get, getAll, getPair)
- [x] Auto-refresh prezzi ogni 30 secondi
- [x] Display live price nella pagina Trading
- [ ] Grafici TradingView embedded
- [ ] Order book più dettagliato con depth
- [ ] Recent trades feed
- [ ] Market orders (oltre ai limit)
- [ ] Price ticker animato
- [ ] 24h volume e price change display
- [ ] Matching engine automatico

### 3. Admin Panel Potenziato
- [ ] CRUD Staking Plans (create, edit, delete plans)
- [ ] CRUD Promo Codes (create, set limits, track usage)
- [ ] User Management (list all users, edit roles, suspend)
- [ ] Deposit Management (approve manual deposits)
- [ ] System Settings page
- [ ] Financial Reports dashboard
- [ ] System Logs Viewer

### 4. KYC Completo
- [ ] Campi aggiuntivi: firstName, lastName, dateOfBirth
- [ ] Address fields: street, city, zipCode, country
- [ ] Selfie with document upload
- [ ] Proof of address upload (utility bill)
- [ ] KYC levels (Basic, Intermediate, Advanced)
- [ ] Withdrawal limits based on KYC level
- [ ] Document expiration date check
- [ ] Better validation e error messages

### 5. S3 Integration
- [ ] Implementare storagePut per KYC documents
- [ ] Upload selfie to S3
- [ ] Upload proof of address to S3
- [ ] Generate presigned URLs per view
- [ ] File size validation (5MB limit)
- [ ] Allowed file types (jpg, png, pdf)


## NUOVI TASK RICHIESTI

### 1. Wallet Addresses per Depositi Crypto
- [x] Tabella walletAddresses nel database
- [x] Installare ethers per generazione addresses
- [x] Funzione generateWalletAddress(userId, asset) deterministica
- [x] Router wallet.getDepositAddress(asset)
- [x] Mostrare wallet addresses nella pagina Deposit
- [x] QR code per ogni address

### 2. KYC Completo
- [ ] Aggiungere campi: firstName, lastName, dateOfBirth, address, city, country, postalCode
- [ ] Upload documento ID (front + back)
- [ ] Upload selfie
- [ ] Upload proof of address
- [ ] Integrazione S3 upload reale con storagePut
- [ ] Validazione campi obbligatori
- [ ] Preview documenti uploaded

### 3. Fix Admin Panel Access
- [ ] Verificare che DashboardLayout filtri correttamente adminOnly items
- [ ] Testare con user non-admin
- [ ] Assicurarsi che adminProcedure backend blocchi non-admin

### 4. GitHub Push
- [ ] Creare .gitignore
- [ ] Creare README.md con setup instructions
- [ ] Init git repo
- [ ] Push su GitHub nuovo repository


### 5. Landing Page Spettacolare
- [ ] Hero section con animazioni
- [ ] Grafici live crypto prices (TradingView widget o Chart.js)
- [ ] Stats real-time (24h volume, users, trades)
- [ ] Features section con icons
- [ ] Testimonials/Trust badges
- [ ] CTA buttons prominenti
- [ ] Smooth scroll animations
- [ ] Gradient effects e glass morphism


## TASK IN PROGRESS

### KYC Completo
- [x] Aggiungere campi al form KYC: firstName, lastName, dateOfBirth, address, city, country, postalCode
- [x] Upload documento ID (front + back)
- [x] Upload selfie
- [x] Upload proof of address
- [x] Validazione campi obbligatori
- [x] File size validation (5MB max)
- [x] Requirements checklist display
- [ ] Integrazione S3 storage per upload reali (placeholder URLs per ora)

### Fix Admin Panel Access
- [x] Verificare che solo role='admin' veda menu Admin
- [x] Filter implementato: menuItems.filter(item => !item.adminOnly || user?.role === 'admin')
- [x] Admin menu nascosto per users normali
- [ ] Testare con user account (verificare role nel database)

### Sistema Login/Register
- [ ] Pagina Login con email/password
- [ ] Pagina Register con validazione
- [ ] Password recovery flow
- [ ] Email verification
- [ ] JWT token management
- [ ] Rimuovere dipendenze Manus OAuth


### Upload Locale Server (COMPLETED)
- [x] Installare multer per file upload
- [x] Creare cartella /uploads sul server
- [x] API endpoint /api/upload per upload file
- [x] Servire file statici da /uploads
- [x] Integrare upload nella pagina KYC
- [x] Validazione file type e size server-side (5MB max, JPEG/PNG/WEBP/PDF)
