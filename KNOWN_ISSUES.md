# BitChange Pro - Known Issues

## Critical Issues

### 1. Email/Password Authentication Not Working in Production

**Status**: 🔴 **CRITICAL** - Blocks manual testing

**Description**: The login form at `/auth/login` accepts email and password credentials, but the system maintains the OAuth session from Manus platform, completely ignoring the email/password authentication.

**Impact**:
- Cannot test with created test users (trader1@test.com, trader2@test.com)
- Always logs in as the Manus OAuth user regardless of credentials entered
- Makes it impossible to test multi-user trading scenarios via UI

**Root Cause**:
The authentication context in `server/_core/context.ts` checks for OAuth session first and returns that user, never checking the email/password session table.

**Reproduction Steps**:
1. Navigate to `/auth/login`
2. Enter `trader1@test.com` / `Test123!Test`
3. Click "Sign In"
4. Result: Logged in as Manus OAuth user (e.g., benziluca92@gmail.com) instead of trader1

**Workaround**:
- Clear all cookies before login attempt
- Even after clearing cookies, OAuth session persists
- Use admin panel to adjust balances for the OAuth user
- Test trading with SQL queries instead of UI

**Fix Required**:
```typescript
// server/_core/context.ts
// Current logic (WRONG):
if (oauthUser) return oauthUser;
// Never reaches email/password session check

// Should be:
if (oauthUser) return oauthUser;
if (emailPasswordSession) return emailPasswordUser;
return null;
```

**Priority**: P0 - Must fix before production deployment

---

### 2. Trading UI Button Not Triggering Orders

**Status**: 🔴 **CRITICAL** - Blocks trading functionality testing

**Description**: Clicking "Buy BTC" or "Sell BTC" buttons in the trading interface does not place orders. The form accepts input (price, amount) and calculates total correctly, but clicking the button has no effect.

**Impact**:
- Cannot test trading engine via UI
- Users cannot place orders
- Core exchange functionality broken

**Reproduction Steps**:
1. Login and navigate to `/trading`
2. Select "Sell" tab
3. Enter Price: 86000
4. Enter Amount: 0.5
5. Click "Sell BTC"
6. Result: Nothing happens, no order created, no error message

**Observations**:
- No console errors in browser
- No network requests visible in DevTools
- "Open Orders" section remains empty
- Database query confirms no orders were created
- Form validation seems to pass (Total is calculated correctly)

**Possible Causes**:
1. tRPC mutation not being called
2. onClick handler not firing
3. Button disabled state not updating
4. Silent validation failure
5. Missing error toast notification

**Workaround**:
Test trading engine via direct SQL insertion (see TESTING_GUIDE.md)

**Debug Steps Needed**:
```typescript
// Add to Trade.tsx handlePlaceOrder function:
const handlePlaceOrder = () => {
  console.log("handlePlaceOrder called"); // Check if function runs
  console.log({ orderType, price, amount }); // Check values
  
  if (orderType === "limit" && !price) {
    console.log("Price validation failed");
    toast.error("Price is required for limit orders");
    return;
  }
  if (!amount) {
    console.log("Amount validation failed");
    toast.error("Amount is required");
    return;
  }

  console.log("Calling placeOrderMutation.mutate");
  placeOrderMutation.mutate({
    pair: selectedPair,
    side: orderSide,
    type: orderType,
    price: orderType === "limit" ? price : undefined,
    amount,
  });
};
```

**Priority**: P0 - Must fix before production deployment

---

## High Priority Issues

### 3. SMTP Email Not Configured

**Status**: 🟡 **HIGH** - Blocks email-dependent features

**Description**: SMTP credentials are not configured, so no emails are being sent for:
- Email verification codes (OTP)
- Password reset links
- Login alerts
- Withdrawal notifications
- KYC status updates

**Impact**:
- New users cannot verify their email
- Users cannot reset forgotten passwords
- No email notifications for important events

**Fix Required**:
Configure SMTP in `.env.production`:
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<SendGrid API Key>
SMTP_FROM=info@bitchangemoney.xyz
```

**Recommended Service**: SendGrid (professional, reliable, good reputation)

**Alternative**: Gmail SMTP (for testing only, not production)

**Priority**: P1 - Required for production launch

---

### 4. Logout Functionality Missing

**Status**: 🟡 **HIGH** - UX issue

**Description**: There is no visible logout button or functionality in the UI. Clicking on the user profile menu doesn't show a logout option.

**Impact**:
- Users cannot logout
- Testing multiple users requires manual cookie clearing
- Security concern (shared computers)

**Workaround**:
```javascript
// Clear cookies via browser console:
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});
```

**Fix Required**:
Add logout button to DashboardLayout user menu dropdown

**Priority**: P1 - Should fix before production

---

### 5. Database Schema Missing Security Columns

**Status**: 🟡 **HIGH** - Schema inconsistency

**Description**: The users table in code references columns that don't exist in the database:
- `antiPhishingCode`
- `ipWhitelist`

**Impact**:
- Potential runtime errors if these fields are accessed
- Security features not functional

**Fix Required**:
```bash
cd /home/ubuntu/bitchange-pro
pnpm db:push
```

This will sync the database schema with the Drizzle schema definition.

**Priority**: P1 - Run before production deployment

---

## Medium Priority Issues

### 6. Trading Engine Not Auto-Matching

**Status**: 🟠 **MEDIUM** - Feature incomplete

**Description**: The trading engine code exists (`server/services/tradingEngine.ts`) but is not being called automatically when orders are placed. Orders are created but not matched.

**Impact**:
- Orders sit in order book without executing
- No automatic trade execution
- Manual intervention required

**Expected Behavior**:
When a new order is placed, the trading engine should:
1. Find matching orders on opposite side
2. Execute trades at best prices
3. Update order statuses (filled/partially_filled)
4. Transfer funds between users
5. Deduct trading fees

**Current Behavior**:
Orders are created with status "open" and never matched.

**Fix Required**:
Call `matchOrders()` from `tradingEngine.ts` after creating an order in `trade.placeOrder` mutation.

**Priority**: P2 - Core feature, but can be tested manually

---

### 7. Blockchain Monitoring Service Not Tested

**Status**: 🟠 **MEDIUM** - Needs verification

**Description**: The blockchain monitoring service (`server/services/blockchainMonitor.ts`) is implemented but not tested with real blockchain transactions.

**Impact**:
- Unknown if deposits will be detected correctly
- May have bugs in production
- Could miss deposits or credit wrong amounts

**Testing Needed**:
1. Configure testnet RPC endpoints
2. Send test transactions to user deposit addresses
3. Verify service detects deposits
4. Verify wallet balances update correctly
5. Verify email notifications sent

**Priority**: P2 - Test on testnet before mainnet

---

### 8. Withdrawal Processing Service Not Tested

**Status**: 🟠 **MEDIUM** - Needs verification

**Description**: The withdrawal processing service (`server/services/withdrawalProcessor.ts`) is implemented but not tested with real blockchain transactions.

**Impact**:
- Unknown if withdrawals will execute correctly
- May have bugs that could lose funds
- Could send to wrong addresses

**Testing Needed**:
1. Configure testnet hot wallets
2. Request test withdrawals
3. Admin approve withdrawals
4. Verify service executes on-chain transactions
5. Verify txHash is recorded
6. Verify wallet balances update correctly

**Priority**: P2 - MUST test on testnet before mainnet

---

### 9. Real-Time Price Feeds May Hit Rate Limits

**Status**: 🟠 **MEDIUM** - Scalability concern

**Description**: The system uses CoinGecko free API for price feeds. Free tier has rate limits (50 calls/minute).

**Impact**:
- With 100+ users, may exceed rate limits
- Prices may become stale
- Trading experience degraded

**Fix Required**:
1. Implement price caching (Redis)
2. Upgrade to CoinGecko Pro API
3. Or use alternative price feed (Binance API, CoinMarketCap)

**Priority**: P2 - Monitor in production, upgrade if needed

---

## Low Priority Issues

### 10. No Market Orders Implementation

**Status**: 🟢 **LOW** - Feature gap

**Description**: The UI has a "Market Order" option, but the trading engine only implements limit orders. Market orders are not executed.

**Impact**:
- Users expect market orders to work
- Confusing UX

**Fix Required**:
Either:
1. Implement market order logic in trading engine
2. Remove market order option from UI

**Priority**: P3 - Nice to have

---

### 11. No Order Cancellation in UI

**Status**: 🟢 **LOW** - UX gap

**Description**: Users can place orders but cannot cancel them via UI (though backend endpoint exists).

**Impact**:
- Users stuck with unwanted orders
- Poor UX

**Fix Required**:
Add "Cancel" button to Open Orders table

**Priority**: P3 - Should add eventually

---

### 12. No Trading Charts

**Status**: 🟢 **LOW** - Feature gap

**Description**: Professional exchanges have price charts (candlestick, line charts). BitChange Pro has none.

**Impact**:
- Less professional appearance
- Traders prefer visual data

**Fix Required**:
Integrate charting library (TradingView, Lightweight Charts)

**Priority**: P3 - Enhancement for future

---

### 13. No Mobile Responsive Design Testing

**Status**: 🟢 **LOW** - Testing gap

**Description**: The UI uses Tailwind responsive classes but hasn't been tested on mobile devices.

**Impact**:
- May have layout issues on mobile
- Poor mobile UX

**Testing Needed**:
Test all pages on:
- iPhone (Safari)
- Android (Chrome)
- Tablet (iPad)

**Priority**: P3 - Test before launch

---

### 14. No API Documentation

**Status**: 🟢 **LOW** - Documentation gap

**Description**: There is no API documentation for developers who want to integrate with BitChange Pro.

**Impact**:
- Harder for third-party integrations
- Support burden

**Fix Required**:
Generate API docs from tRPC schema (use tRPC OpenAPI generator)

**Priority**: P3 - Nice to have

---

### 15. No Referral Program UI

**Status**: 🟢 **LOW** - Feature incomplete

**Description**: Database schema has referral tables but no UI to:
- Generate referral codes
- Track referrals
- View referral earnings

**Impact**:
- Marketing feature not usable
- Cannot incentivize user growth

**Fix Required**:
Build referral dashboard page

**Priority**: P3 - Future enhancement

---

## Test Results Summary

### Vitest Unit Tests
- **Status**: 11/15 tests passing (73%)
- **Failed Tests**:
  - `auth.register` - Email verification not mocked
  - `auth.verifyEmail` - OTP validation failing
  - `trade.placeOrder` - Trading engine not called
  - `withdrawal.create` - Wallet locking issue

### Manual UI Tests
- **Authentication**: ❌ Email/password login broken
- **2FA Setup**: ✅ Working (QR code generation, backup codes)
- **KYC Submission**: ✅ Working (file upload, form validation)
- **Wallet Display**: ✅ Working (shows balances correctly)
- **Deposit Address**: ✅ Working (generates unique addresses with QR)
- **Trading UI**: ❌ Order placement broken
- **Admin Dashboard**: ✅ Working (stats, charts, user management)
- **Admin KYC Approval**: ✅ Working
- **Admin Withdrawal Approval**: ⚠️ Not tested (no withdrawals to approve)

### Database Tests
- **Schema**: ⚠️ Missing columns (antiPhishingCode, ipWhitelist)
- **Indexes**: ✅ Proper indexes on orders, trades, transactions
- **Constraints**: ✅ Foreign keys working
- **Migrations**: ⚠️ Need to run `pnpm db:push`

### Security Tests
- **SQL Injection**: ✅ Protected (using Drizzle ORM)
- **XSS**: ✅ Protected (React escapes by default)
- **CSRF**: ✅ Protected (tRPC uses session cookies)
- **Rate Limiting**: ✅ Implemented (50 login attempts per IP/15min)
- **Password Hashing**: ✅ Using bcrypt
- **2FA**: ✅ Using speakeasy TOTP

### Performance Tests
- **Not Conducted**: Need load testing with Apache Bench or similar

---

## Recommendations

### Before Production Deployment

1. **FIX CRITICAL ISSUES** (P0):
   - Fix email/password authentication
   - Fix trading UI button
   - Configure SMTP email

2. **FIX HIGH PRIORITY ISSUES** (P1):
   - Add logout functionality
   - Run database migration (`pnpm db:push`)
   - Test blockchain monitoring on testnet
   - Test withdrawal processing on testnet

3. **TESTING**:
   - Fix failing unit tests
   - Conduct load testing
   - Test on mobile devices
   - Security audit

4. **DOCUMENTATION**:
   - Update README with production setup
   - Create admin user guide
   - Create user guide

### After Production Launch

1. **Monitor**:
   - Set up error tracking (Sentry)
   - Set up uptime monitoring (UptimeRobot)
   - Monitor API rate limits
   - Monitor database performance

2. **Enhancements**:
   - Implement market orders
   - Add trading charts
   - Build referral program UI
   - Add API documentation
   - Implement advanced order types (stop-loss, take-profit)

---

## Contact

For questions or issues, refer to:
- **TESTING_GUIDE.md** - Comprehensive testing procedures
- **SYSTEM_TEST_REPORT.md** - Detailed test results
- **PROFESSIONAL_EXCHANGE_ROADMAP.md** - Future enhancements
- **DEPLOYMENT.md** - Production deployment guide
