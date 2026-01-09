import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, date } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // Manus OAuth ID
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  loginMethod: varchar("loginMethod", { length: 64 }), // OAuth provider or 'email'
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  password: varchar("password", { length: 255 }),
  emailVerified: timestamp("emailVerified"),
  kycStatus: mysqlEnum("kycStatus", ["pending", "submitted", "approved", "rejected", "expired"]).default("pending").notNull(),
  kycSubmittedAt: timestamp("kycSubmittedAt"),
  kycApprovedAt: timestamp("kycApprovedAt"),
  kycRejectedReason: text("kycRejectedReason"),
  kycExpiresAt: timestamp("kycExpiresAt"),
  kycIdFrontPath: text("kycIdFrontPath"), // Local file path for ID front photo
  kycIdBackPath: text("kycIdBackPath"), // Local file path for ID back photo
  kycSelfiePath: text("kycSelfiePath"), // Local file path for selfie with ID
  twoFactorSecret: varchar("twoFactorSecret", { length: 255 }),
  twoFactorEnabled: boolean("twoFactorEnabled").default(false).notNull(),
  twoFactorBackupCodes: text("twoFactorBackupCodes"), // JSON array of backup codes
  accountStatus: mysqlEnum("accountStatus", ["active", "suspended"]).default("active").notNull(),
  antiPhishingCode: varchar("antiPhishingCode", { length: 50 }), // Personal code shown in emails
  ipWhitelist: text("ipWhitelist"), // JSON array of whitelisted IPs (admin only)
  referralCode: varchar("referralCode", { length: 20 }).unique(), // Unique referral code for this user
  referredBy: int("referredBy"), // User ID who referred this user
  notificationPreferences: text("notificationPreferences"), // JSON: {trade: true, deposit: true, withdrawal: true, security: true}
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  asset: varchar("asset", { length: 20 }).notNull(),
  balance: decimal("balance", { precision: 20, scale: 8 }).default("0").notNull(),
  locked: decimal("locked", { precision: 20, scale: 8 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Wallet = typeof wallets.$inferSelect;

export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["deposit", "withdrawal", "trade", "staking_reward", "promo", "internal_transfer", "admin_credit"]).notNull(),
  asset: varchar("asset", { length: 20 }).notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "cancelled"]).default("pending").notNull(),
  reference: text("reference"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  pair: varchar("pair", { length: 20 }).notNull(),
  side: mysqlEnum("side", ["buy", "sell"]).notNull(),
  type: mysqlEnum("type", ["limit", "market"]).default("limit").notNull(),
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  filled: decimal("filled", { precision: 20, scale: 8 }).default("0").notNull(),
  status: mysqlEnum("status", ["open", "partially_filled", "filled", "cancelled"]).default("open").notNull(),
  stopLoss: decimal("stopLoss", { precision: 20, scale: 8 }), // Stop loss price
  takeProfit: decimal("takeProfit", { precision: 20, scale: 8 }), // Take profit price
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const trades = mysqlTable("trades", {
  id: int("id").autoincrement().primaryKey(),
  buyOrderId: int("buyOrderId").notNull(),
  sellOrderId: int("sellOrderId").notNull(),
  buyerId: int("buyerId").notNull(),
  sellerId: int("sellerId").notNull(),
  pair: varchar("pair", { length: 20 }).notNull(),
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const stakingPlans = mysqlTable("stakingPlans", {
  id: int("id").autoincrement().primaryKey(),
  asset: varchar("asset", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  apr: decimal("apr", { precision: 5, scale: 2 }).notNull(),
  lockDays: int("lockDays").default(0).notNull(),
  minAmount: decimal("minAmount", { precision: 20, scale: 8 }).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const stakingPositions = mysqlTable("stakingPositions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: int("planId").notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  rewards: decimal("rewards", { precision: 20, scale: 8 }).default("0").notNull(),
  status: mysqlEnum("status", ["active", "withdrawn"]).default("active").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  maturesAt: timestamp("maturesAt"),
  withdrawnAt: timestamp("withdrawnAt"),
});

export const deposits = mysqlTable("deposits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  asset: varchar("asset", { length: 20 }).notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  network: varchar("network", { length: 50 }),
  provider: varchar("provider", { length: 50 }),
  externalId: varchar("externalId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const withdrawals = mysqlTable("withdrawals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  asset: varchar("asset", { length: 20 }).notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  network: varchar("network", { length: 50 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  fee: decimal("fee", { precision: 20, scale: 8 }).default("0").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "completed", "processing", "failed"]).default("pending").notNull(),
  adminNote: text("adminNote"),
  adminNotes: text("adminNotes"), // Alias for adminNote
  txHash: varchar("txHash", { length: 255 }),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
});

export const kycDocuments = mysqlTable("kycDocuments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  postalCode: varchar("postalCode", { length: 20 }),
  documentType: mysqlEnum("documentType", ["id_card", "passport", "drivers_license"]).notNull(),
  frontImageUrl: text("frontImageUrl").notNull(),
  backImageUrl: text("backImageUrl"),
  selfieUrl: text("selfieUrl"),
  proofOfAddressUrl: text("proofOfAddressUrl"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  adminNote: text("adminNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
});

// Support ticketing tables moved below (improved version with categories, assignment, etc.)

export const promoCodes = mysqlTable("promoCodes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  bonusType: mysqlEnum("bonusType", ["percentage", "fixed"]).notNull(),
  bonusValue: decimal("bonusValue", { precision: 10, scale: 2 }).notNull(),
  bonusAsset: varchar("bonusAsset", { length: 20 }).default("USDT").notNull(),
  maxUses: int("maxUses").default(0).notNull(),
  usedCount: int("usedCount").default(0).notNull(),
  expiresAt: timestamp("expiresAt"),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const walletAddresses = mysqlTable("walletAddresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  asset: varchar("asset", { length: 20 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  network: varchar("network", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const promoUsage = mysqlTable("promoUsage", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  promoId: int("promoId").notNull(),
  bonusAmount: decimal("bonusAmount", { precision: 20, scale: 8 }).notNull(),
  usedAt: timestamp("usedAt").defaultNow().notNull(),
});

export const systemLogs = mysqlTable("systemLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 100 }).notNull(),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["user", "admin"]).notNull(),
  ipAddress: varchar("ipAddress", { length: 50 }),
  userAgent: text("userAgent"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const loginHistory = mysqlTable("loginHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  email: varchar("email", { length: 320 }),
  ipAddress: varchar("ipAddress", { length: 50 }),
  userAgent: text("userAgent"),
  method: varchar("method", { length: 50 }),
  success: boolean("success").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const emailVerifications = mysqlTable("emailVerifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const passwordResets = mysqlTable("passwordResets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  used: boolean("used").default(false).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const passwordHistory = mysqlTable("passwordHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["deposit", "withdrawal", "kyc", "trade", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  relatedId: int("relatedId"), // ID of related deposit/withdrawal/trade
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

export const networks = mysqlTable("networks", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  chainId: varchar("chainId", { length: 50 }),
  type: varchar("type", { length: 50 }).notNull(),
  asset: varchar("asset", { length: 20 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  depositFee: decimal("depositFee", { precision: 20, scale: 8 }).default("0").notNull(),
  withdrawalFee: decimal("withdrawalFee", { precision: 20, scale: 8 }).default("0").notNull(),
  minDeposit: decimal("minDeposit", { precision: 20, scale: 8 }).default("0").notNull(),
  minWithdrawal: decimal("minWithdrawal", { precision: 20, scale: 8 }).default("0").notNull(),
  confirmations: int("confirmations").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Hot Wallet System Tables
export const masterWallets = mysqlTable("masterWallets", {
  id: int("id").autoincrement().primaryKey(),
  network: varchar("network", { length: 50 }).notNull().unique(), // BTC, ETH, TRX, BNB, SOL, MATIC
  asset: varchar("asset", { length: 20 }).notNull(), // BTC, ETH, USDT, USDC, etc.
  address: varchar("address", { length: 255 }).notNull(),
  encryptedPrivateKey: text("encryptedPrivateKey").notNull(), // AES-256 encrypted
  encryptedMnemonic: text("encryptedMnemonic"), // For HD wallets
  derivationPath: varchar("derivationPath", { length: 100 }), // m/44'/60'/0'/0 for ETH
  balance: decimal("balance", { precision: 20, scale: 8 }).default("0").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const depositAddresses = mysqlTable("depositAddresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  network: varchar("network", { length: 50 }).notNull(), // BTC, ETH, TRX, etc.
  asset: varchar("asset", { length: 20 }).notNull(),
  address: varchar("address", { length: 255 }).notNull().unique(),
  derivationIndex: int("derivationIndex"), // For HD wallet derivation
  masterWalletId: int("masterWalletId"),
  isUsed: boolean("isUsed").default(false).notNull(), // Mark as used after first deposit
  lastDepositAt: timestamp("lastDepositAt"),
  totalDeposited: decimal("totalDeposited", { precision: 20, scale: 8 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const blockchainTransactions = mysqlTable("blockchainTransactions", {
  id: int("id").autoincrement().primaryKey(),
  txHash: varchar("txHash", { length: 255 }).notNull().unique(),
  network: varchar("network", { length: 50 }).notNull(),
  asset: varchar("asset", { length: 20 }).notNull(),
  fromAddress: varchar("fromAddress", { length: 255 }),
  toAddress: varchar("toAddress", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  fee: decimal("fee", { precision: 20, scale: 8 }).default("0").notNull(),
  confirmations: int("confirmations").default(0).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "failed"]).default("pending").notNull(),
  type: mysqlEnum("type", ["deposit", "withdrawal"]).notNull(),
  userId: int("userId"), // Associated user for deposits
  depositAddressId: int("depositAddressId"), // Link to deposit address
  withdrawalId: int("withdrawalId"), // Link to withdrawal request
  blockNumber: int("blockNumber"),
  blockTimestamp: timestamp("blockTimestamp"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MasterWallet = typeof masterWallets.$inferSelect;
export type DepositAddress = typeof depositAddresses.$inferSelect;
export type BlockchainTransaction = typeof blockchainTransactions.$inferSelect;


// Withdrawal whitelist
export const withdrawalWhitelist = mysqlTable("withdrawalWhitelist", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  asset: varchar("asset", { length: 20 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  network: varchar("network", { length: 50 }).notNull(),
  label: varchar("label", { length: 100 }), // User-friendly name
  verified: boolean("verified").default(false).notNull(), // Email verification required
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Device fingerprints for security
export const deviceFingerprints = mysqlTable("deviceFingerprints", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fingerprint: varchar("fingerprint", { length: 255 }).notNull(), // Browser fingerprint hash
  userAgent: text("userAgent"),
  ip: varchar("ip", { length: 45 }),
  trusted: boolean("trusted").default(false).notNull(), // User marked as trusted
  lastSeen: timestamp("lastSeen").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Security audit log
export const securityAuditLog = mysqlTable("securityAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 100 }).notNull(), // e.g., "login", "withdrawal", "password_change"
  details: text("details"), // JSON with additional info
  ip: varchar("ip", { length: 45 }),
  userAgent: text("userAgent"),
  success: boolean("success").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Withdrawal delays (for large amounts)
export const withdrawalDelays = mysqlTable("withdrawalDelays", {
  id: int("id").autoincrement().primaryKey(),
  withdrawalId: int("withdrawalId").notNull(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  usdValue: decimal("usdValue", { precision: 20, scale: 2 }).notNull(),
  delayUntil: timestamp("delayUntil").notNull(), // When withdrawal can be processed
  reason: text("reason"), // Why delayed (e.g., "Large amount >$10k")
  cancelled: boolean("cancelled").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});


// Support Ticketing System
export const supportAgents = mysqlTable("supportAgents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["admin", "agent"]).notNull(),
  permissions: text("permissions"), // JSON string of permissions
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const supportTickets = mysqlTable("supportTickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["technical", "billing", "kyc", "withdrawal", "deposit", "trading", "other"]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "waiting_user", "resolved", "closed"]).default("open").notNull(),
  assignedTo: int("assignedTo"), // supportAgents.id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
});

export const ticketMessages = mysqlTable("ticketMessages", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  userId: int("userId").notNull(),
  message: text("message").notNull(),
  isStaff: boolean("isStaff").default(false).notNull(),
  attachments: text("attachments"), // JSON array of file URLs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Referral Program
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // The user who was referred
  referredBy: int("referredBy").notNull(), // The user who referred them
  referralCode: varchar("referralCode", { length: 20 }).notNull(),
  earnedCommission: decimal("earnedCommission", { precision: 20, scale: 8 }).default("0").notNull(),
  status: mysqlEnum("status", ["pending", "active", "inactive"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  activatedAt: timestamp("activatedAt"),
});

export const loyaltyTiers = mysqlTable("loyaltyTiers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  minVolume: decimal("minVolume", { precision: 20, scale: 2 }).notNull(), // 30-day volume in USD
  feeDiscount: decimal("feeDiscount", { precision: 5, scale: 2 }).notNull(), // Percentage discount
  benefits: text("benefits"), // JSON array of benefits
  color: varchar("color", { length: 20 }).default("#gray"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userLoyalty = mysqlTable("userLoyalty", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tierId: int("tierId").notNull(),
  volume30d: decimal("volume30d", { precision: 20, scale: 2 }).default("0").notNull(),
  referralCount: int("referralCount").default(0).notNull(),
  totalEarned: decimal("totalEarned", { precision: 20, scale: 8 }).default("0").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const rewards = mysqlTable("rewards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // User who triggered the reward (referee)
  referrerId: int("referrerId").notNull(), // User who receives the reward (referrer)
  amount: decimal("amount", { precision: 20, scale: 8 }).default("10.00000000").notNull(),
  currency: varchar("currency", { length: 10 }).default("USDT").notNull(),
  type: mysqlEnum("type", ["first_deposit", "first_trade", "manual"]).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
});

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = typeof rewards.$inferInsert;

// System Monitoring Tables
export const apiLogs = mysqlTable("apiLogs", {
  id: int("id").autoincrement().primaryKey(),
  method: varchar("method", { length: 10 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  statusCode: int("statusCode").notNull(),
  duration: int("duration").notNull(), // milliseconds
  userId: int("userId"),
  ip: varchar("ip", { length: 45 }),
  userAgent: text("userAgent"),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiLog = typeof apiLogs.$inferSelect;
export type InsertApiLog = typeof apiLogs.$inferInsert;

export const systemMetrics = mysqlTable("systemMetrics", {
  id: int("id").autoincrement().primaryKey(),
  metricType: mysqlEnum("metricType", [
    "api_response_time",
    "db_query_time",
    "cache_hit_rate",
    "active_users",
    "trading_volume",
    "error_rate",
    "cpu_usage",
    "memory_usage",
    "bundle_size",
    "redis_cache",
    "websocket",
    "db_query",
  ]).notNull(),
  value: decimal("value", { precision: 20, scale: 8 }).notNull(),
  unit: varchar("unit", { length: 20 }), // ms, %, count, MB, etc.
  metadata: text("metadata"), // JSON for additional context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = typeof systemMetrics.$inferInsert;

export const errorLogs = mysqlTable("errorLogs", {
  id: int("id").autoincrement().primaryKey(),
  errorType: varchar("errorType", { length: 100 }).notNull(),
  message: text("message").notNull(),
  stack: text("stack"),
  userId: int("userId"),
  context: text("context"), // JSON for additional context
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  resolved: boolean("resolved").default(false).notNull(),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: int("resolvedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = typeof errorLogs.$inferInsert;

export const exchangeApiLogs = mysqlTable("exchangeApiLogs", {
  id: int("id").autoincrement().primaryKey(),
  exchange: varchar("exchange", { length: 50 }).notNull(), // binance, kraken, etc.
  method: varchar("method", { length: 100 }).notNull(), // fetchTicker, createOrder, etc.
  success: boolean("success").notNull(),
  duration: int("duration").notNull(), // milliseconds
  rateLimitRemaining: int("rateLimitRemaining"),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExchangeApiLog = typeof exchangeApiLogs.$inferSelect;
export type InsertExchangeApiLog = typeof exchangeApiLogs.$inferInsert;

export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  alertType: mysqlEnum("alertType", [
    "high_error_rate",
    "slow_response_time",
    "exchange_api_failure",
    "low_balance",
    "suspicious_activity",
    "system_down",
    "error_rate",
    "response_time",
    "exchange_failure",
    "db_performance",
  ]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"), // JSON for additional context
  acknowledged: boolean("acknowledged").default(false).notNull(),
  acknowledgedBy: int("acknowledgedBy"),
  acknowledgedAt: timestamp("acknowledgedAt"),
  resolved: boolean("resolved").default(false).notNull(),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

// WebAuthn/FIDO2 Credentials for biometric authentication
export const webAuthnCredentials = mysqlTable("webAuthnCredentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  credentialId: text("credentialId").notNull().unique(), // Base64URL encoded credential ID
  publicKey: text("publicKey").notNull(), // Base64URL encoded public key
  counter: int("counter").default(0).notNull(), // Signature counter for replay protection
  deviceName: varchar("deviceName", { length: 100 }), // User-friendly name (e.g., "iPhone 15", "MacBook Pro")
  deviceType: varchar("deviceType", { length: 50 }), // "platform" or "cross-platform"
  transports: text("transports"), // JSON array of supported transports ["usb", "nfc", "ble", "internal"]
  aaguid: varchar("aaguid", { length: 100 }), // Authenticator Attestation GUID
  lastUsed: timestamp("lastUsed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WebAuthnCredential = typeof webAuthnCredentials.$inferSelect;
export type InsertWebAuthnCredential = typeof webAuthnCredentials.$inferInsert;

// Wallet Production System Tables
export const coldWallets = mysqlTable("coldWallets", {
  id: int("id").autoincrement().primaryKey(),
  network: varchar("network", { length: 50 }).notNull().unique(),
  asset: varchar("asset", { length: 20 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  balance: decimal("balance", { precision: 20, scale: 8 }).default("0").notNull(),
  lastVerifiedAt: timestamp("lastVerifiedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ColdWallet = typeof coldWallets.$inferSelect;
export type InsertColdWallet = typeof coldWallets.$inferInsert;

export const sweepTransactions = mysqlTable("sweepTransactions", {
  id: int("id").autoincrement().primaryKey(),
  fromAddress: varchar("fromAddress", { length: 255 }).notNull(),
  toAddress: varchar("toAddress", { length: 255 }).notNull(),
  network: varchar("network", { length: 50 }).notNull(),
  asset: varchar("asset", { length: 20 }).notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  txHash: varchar("txHash", { length: 255 }),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  type: mysqlEnum("type", ["deposit_to_hot", "hot_to_cold", "cold_to_hot"]).notNull(),
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type SweepTransaction = typeof sweepTransactions.$inferSelect;
export type InsertSweepTransaction = typeof sweepTransactions.$inferInsert;

export const walletThresholds = mysqlTable("walletThresholds", {
  id: int("id").autoincrement().primaryKey(),
  network: varchar("network", { length: 50 }).notNull().unique(),
  asset: varchar("asset", { length: 20 }).notNull(),
  minBalance: decimal("minBalance", { precision: 20, scale: 8 }).notNull(),
  maxBalance: decimal("maxBalance", { precision: 20, scale: 8 }).notNull(),
  targetBalance: decimal("targetBalance", { precision: 20, scale: 8 }).notNull(),
  alertEmail: varchar("alertEmail", { length: 320 }),
  lastAlertSent: timestamp("lastAlertSent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WalletThreshold = typeof walletThresholds.$inferSelect;
export type InsertWalletThreshold = typeof walletThresholds.$inferInsert;

// Trading Bot API Keys
export const apiKeys = mysqlTable("apiKeys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(), // User-friendly name for the key
  key: varchar("key", { length: 64 }).notNull().unique(), // API key (public)
  secret: varchar("secret", { length: 128 }).notNull(), // API secret (hashed)
  permissions: text("permissions").notNull(), // JSON array: ["trading", "read", "withdraw"]
  rateLimit: int("rateLimit").default(100).notNull(), // Requests per minute
  ipWhitelist: text("ipWhitelist"), // JSON array of allowed IPs (optional)
  enabled: boolean("enabled").default(true).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"), // Optional expiration date
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

export const apiRequestLogs = mysqlTable("apiRequestLogs", {
  id: int("id").autoincrement().primaryKey(),
  apiKeyId: int("apiKeyId").notNull(),
  userId: int("userId").notNull(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  statusCode: int("statusCode").notNull(),
  responseTime: int("responseTime").notNull(), // milliseconds
  ip: varchar("ip", { length: 45 }).notNull(),
  userAgent: text("userAgent"),
  requestBody: text("requestBody"), // JSON (for debugging, optional)
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiRequestLog = typeof apiRequestLogs.$inferSelect;
export type InsertApiRequestLog = typeof apiRequestLogs.$inferInsert;

// Copy Trading System
export const traderProfiles = mysqlTable("traderProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  totalFollowers: int("totalFollowers").default(0).notNull(),
  totalTrades: int("totalTrades").default(0).notNull(),
  winningTrades: int("winningTrades").default(0).notNull(),
  losingTrades: int("losingTrades").default(0).notNull(),
  winRate: decimal("winRate", { precision: 5, scale: 2 }).default("0").notNull(), // Percentage
  totalPnL: decimal("totalPnL", { precision: 20, scale: 8 }).default("0").notNull(), // Total profit/loss in USDT
  avgRoi: decimal("avgRoi", { precision: 10, scale: 2 }).default("0").notNull(), // Average ROI percentage
  maxDrawdown: decimal("maxDrawdown", { precision: 10, scale: 2 }).default("0").notNull(), // Max drawdown percentage
  sharpeRatio: decimal("sharpeRatio", { precision: 10, scale: 4 }).default("0").notNull(), // Risk-adjusted return
  riskScore: int("riskScore").default(5).notNull(), // 1-10 scale (1=conservative, 10=aggressive)
  tradingVolume30d: decimal("tradingVolume30d", { precision: 20, scale: 2 }).default("0").notNull(), // 30-day volume in USDT
  isPublic: boolean("isPublic").default(false).notNull(), // Allow others to follow
  bio: text("bio"), // Trader description
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TraderProfile = typeof traderProfiles.$inferSelect;
export type InsertTraderProfile = typeof traderProfiles.$inferInsert;

export const copyTradingFollows = mysqlTable("copyTradingFollows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(), // User who is following
  traderId: int("traderId").notNull(), // User being followed
  allocatedAmount: decimal("allocatedAmount", { precision: 20, scale: 8 }).notNull(), // Max amount to allocate
  maxRiskPerTrade: decimal("maxRiskPerTrade", { precision: 5, scale: 2 }).default("2.00").notNull(), // Max risk % per trade
  copyRatio: decimal("copyRatio", { precision: 5, scale: 2 }).default("100.00").notNull(), // Percentage of trader's position to copy
  status: mysqlEnum("status", ["active", "paused", "stopped"]).default("active").notNull(),
  totalCopiedTrades: int("totalCopiedTrades").default(0).notNull(),
  totalPnL: decimal("totalPnL", { precision: 20, scale: 8 }).default("0").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  stoppedAt: timestamp("stoppedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CopyTradingFollow = typeof copyTradingFollows.$inferSelect;
export type InsertCopyTradingFollow = typeof copyTradingFollows.$inferInsert;

export const copyTradingExecutions = mysqlTable("copyTradingExecutions", {
  id: int("id").autoincrement().primaryKey(),
  followId: int("followId").notNull(), // Reference to copyTradingFollows
  followerId: int("followerId").notNull(),
  traderId: int("traderId").notNull(),
  originalOrderId: int("originalOrderId").notNull(), // Trader's original order
  copiedOrderId: int("copiedOrderId").notNull(), // Follower's copied order
  pair: varchar("pair", { length: 20 }).notNull(),
  side: mysqlEnum("side", ["buy", "sell"]).notNull(),
  executionPrice: decimal("executionPrice", { precision: 20, scale: 8 }).notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  copyRatio: decimal("copyRatio", { precision: 5, scale: 2 }).notNull(), // Ratio used for this execution
  status: mysqlEnum("status", ["pending", "executed", "failed", "cancelled"]).default("pending").notNull(),
  pnl: decimal("pnl", { precision: 20, scale: 8 }).default("0").notNull(), // Profit/loss for this execution
  executedAt: timestamp("executedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CopyTradingExecution = typeof copyTradingExecutions.$inferSelect;
export type InsertCopyTradingExecution = typeof copyTradingExecutions.$inferInsert;


// ==================== Margin Trading & Futures ====================

export const marginAccounts = mysqlTable("marginAccounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  currency: varchar("currency", { length: 20 }).notNull(), // Base currency (e.g., USDT)
  balance: decimal("balance", { precision: 20, scale: 8 }).default("0").notNull(),
  available: decimal("available", { precision: 20, scale: 8 }).default("0").notNull(),
  locked: decimal("locked", { precision: 20, scale: 8 }).default("0").notNull(),
  leverage: int("leverage").default(1).notNull(), // 1x-100x
  marginLevel: decimal("marginLevel", { precision: 10, scale: 4 }).default("0").notNull(), // Margin ratio percentage
  totalDebt: decimal("totalDebt", { precision: 20, scale: 8 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarginAccount = typeof marginAccounts.$inferSelect;
export type InsertMarginAccount = typeof marginAccounts.$inferInsert;

export const positions = mysqlTable("positions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(), // e.g., BTC/USDT
  contractType: mysqlEnum("contractType", ["spot", "perpetual", "futures"]).default("spot").notNull(),
  side: mysqlEnum("side", ["long", "short"]).notNull(),
  size: decimal("size", { precision: 20, scale: 8 }).notNull(), // Position size in base currency
  entryPrice: decimal("entryPrice", { precision: 20, scale: 8 }).notNull(),
  markPrice: decimal("markPrice", { precision: 20, scale: 8 }).notNull(), // Current mark price
  liquidationPrice: decimal("liquidationPrice", { precision: 20, scale: 8 }).notNull(),
  leverage: int("leverage").notNull(), // 1x-100x
  marginMode: mysqlEnum("marginMode", ["isolated", "cross"]).default("isolated").notNull(),
  margin: decimal("margin", { precision: 20, scale: 8 }).notNull(), // Initial margin
  unrealizedPnL: decimal("unrealizedPnL", { precision: 20, scale: 8 }).default("0").notNull(),
  realizedPnL: decimal("realizedPnL", { precision: 20, scale: 8 }).default("0").notNull(),
  fundingFee: decimal("fundingFee", { precision: 20, scale: 8 }).default("0").notNull(), // Accumulated funding fees
  status: mysqlEnum("status", ["open", "closed", "liquidated"]).default("open").notNull(),
  openedAt: timestamp("openedAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Position = typeof positions.$inferSelect;
export type InsertPosition = typeof positions.$inferInsert;

export const futuresContracts = mysqlTable("futuresContracts", {
  id: int("id").autoincrement().primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull().unique(), // e.g., BTCUSDT
  baseAsset: varchar("baseAsset", { length: 20 }).notNull(), // e.g., BTC
  quoteAsset: varchar("quoteAsset", { length: 20 }).notNull(), // e.g., USDT
  contractType: mysqlEnum("contractType", ["perpetual", "quarterly", "bi-quarterly"]).default("perpetual").notNull(),
  fundingRate: decimal("fundingRate", { precision: 10, scale: 8 }).default("0").notNull(), // Current funding rate
  fundingInterval: int("fundingInterval").default(28800).notNull(), // Funding interval in seconds (8 hours = 28800s)
  nextFundingTime: timestamp("nextFundingTime").notNull(),
  markPrice: decimal("markPrice", { precision: 20, scale: 8 }).notNull(),
  indexPrice: decimal("indexPrice", { precision: 20, scale: 8 }).notNull(),
  lastPrice: decimal("lastPrice", { precision: 20, scale: 8 }).notNull(),
  volume24h: decimal("volume24h", { precision: 20, scale: 8 }).default("0").notNull(),
  openInterest: decimal("openInterest", { precision: 20, scale: 8 }).default("0").notNull(), // Total open positions
  maxLeverage: int("maxLeverage").default(100).notNull(),
  maintenanceMarginRate: decimal("maintenanceMarginRate", { precision: 5, scale: 4 }).default("0.005").notNull(), // 0.5%
  takerFeeRate: decimal("takerFeeRate", { precision: 5, scale: 4 }).default("0.0006").notNull(), // 0.06%
  makerFeeRate: decimal("makerFeeRate", { precision: 5, scale: 4 }).default("0.0002").notNull(), // 0.02%
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FuturesContract = typeof futuresContracts.$inferSelect;
export type InsertFuturesContract = typeof futuresContracts.$inferInsert;

export const fundingHistory = mysqlTable("fundingHistory", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  fundingRate: decimal("fundingRate", { precision: 10, scale: 8 }).notNull(),
  fundingTime: timestamp("fundingTime").notNull(),
  totalFunding: decimal("totalFunding", { precision: 20, scale: 8 }).notNull(), // Total funding paid/received
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FundingHistory = typeof fundingHistory.$inferSelect;
export type InsertFundingHistory = typeof fundingHistory.$inferInsert;

export const liquidationQueue = mysqlTable("liquidationQueue", {
  id: int("id").autoincrement().primaryKey(),
  positionId: int("positionId").notNull(),
  userId: int("userId").notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  side: mysqlEnum("side", ["long", "short"]).notNull(),
  size: decimal("size", { precision: 20, scale: 8 }).notNull(),
  entryPrice: decimal("entryPrice", { precision: 20, scale: 8 }).notNull(),
  liquidationPrice: decimal("liquidationPrice", { precision: 20, scale: 8 }).notNull(),
  currentPrice: decimal("currentPrice", { precision: 20, scale: 8 }).notNull(),
  leverage: int("leverage").notNull(),
  status: mysqlEnum("status", ["queued", "processing", "completed", "failed"]).default("queued").notNull(),
  queuedAt: timestamp("queuedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LiquidationQueue = typeof liquidationQueue.$inferSelect;
export type InsertLiquidationQueue = typeof liquidationQueue.$inferInsert;

export const insuranceFund = mysqlTable("insuranceFund", {
  id: int("id").autoincrement().primaryKey(),
  currency: varchar("currency", { length: 20 }).notNull().unique(),
  balance: decimal("balance", { precision: 20, scale: 8 }).default("0").notNull(),
  totalContributions: decimal("totalContributions", { precision: 20, scale: 8 }).default("0").notNull(),
  totalPayouts: decimal("totalPayouts", { precision: 20, scale: 8 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InsuranceFund = typeof insuranceFund.$inferSelect;
export type InsertInsuranceFund = typeof insuranceFund.$inferInsert;


// ==================== Staking & Yield Farming ====================

export const stakingPools = mysqlTable("stakingPools", {
  id: int("id").autoincrement().primaryKey(),
  asset: varchar("asset", { length: 20 }).notNull(),
  type: mysqlEnum("type", ["flexible", "locked"]).notNull(),
  apy: decimal("apy", { precision: 5, scale: 2 }).notNull(), // Annual Percentage Yield
  minAmount: decimal("minAmount", { precision: 20, scale: 8 }).default("0").notNull(),
  lockPeriod: int("lockPeriod").default(0).notNull(), // Lock period in days (0 for flexible)
  totalStaked: decimal("totalStaked", { precision: 20, scale: 8 }).default("0").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StakingPool = typeof stakingPools.$inferSelect;
export type InsertStakingPool = typeof stakingPools.$inferInsert;

export const userStakes = mysqlTable("userStakes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  poolId: int("poolId").notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate"), // NULL for flexible, set for locked
  status: mysqlEnum("status", ["active", "completed", "withdrawn"]).default("active").notNull(),
  accumulatedRewards: decimal("accumulatedRewards", { precision: 20, scale: 8 }).default("0").notNull(),
  lastRewardCalculation: timestamp("lastRewardCalculation").defaultNow().notNull(),
  autoCompound: boolean("autoCompound").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserStake = typeof userStakes.$inferSelect;
export type InsertUserStake = typeof userStakes.$inferInsert;

export const stakingRewards = mysqlTable("stakingRewards", {
  id: int("id").autoincrement().primaryKey(),
  stakeId: int("stakeId").notNull(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  type: mysqlEnum("type", ["daily", "compound", "withdrawal"]).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StakingReward = typeof stakingRewards.$inferSelect;
export type InsertStakingReward = typeof stakingRewards.$inferInsert;

export const liquidityPools = mysqlTable("liquidityPools", {
  id: int("id").autoincrement().primaryKey(),
  pair: varchar("pair", { length: 20 }).notNull().unique(), // e.g., "BTC/USDT"
  token0: varchar("token0", { length: 20 }).notNull(),
  token1: varchar("token1", { length: 20 }).notNull(),
  totalLiquidity: decimal("totalLiquidity", { precision: 20, scale: 8 }).default("0").notNull(),
  token0Reserve: decimal("token0Reserve", { precision: 20, scale: 8 }).default("0").notNull(),
  token1Reserve: decimal("token1Reserve", { precision: 20, scale: 8 }).default("0").notNull(),
  apy: decimal("apy", { precision: 5, scale: 2 }).default("0").notNull(),
  fees24h: decimal("fees24h", { precision: 20, scale: 8 }).default("0").notNull(),
  volume24h: decimal("volume24h", { precision: 20, scale: 8 }).default("0").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LiquidityPool = typeof liquidityPools.$inferSelect;
export type InsertLiquidityPool = typeof liquidityPools.$inferInsert;

export const userLiquidityPositions = mysqlTable("userLiquidityPositions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  poolId: int("poolId").notNull(),
  token0Amount: decimal("token0Amount", { precision: 20, scale: 8 }).notNull(),
  token1Amount: decimal("token1Amount", { precision: 20, scale: 8 }).notNull(),
  lpTokens: decimal("lpTokens", { precision: 20, scale: 8 }).notNull(), // Liquidity Provider tokens
  rewards: decimal("rewards", { precision: 20, scale: 8 }).default("0").notNull(),
  impermanentLoss: decimal("impermanentLoss", { precision: 20, scale: 8 }).default("0").notNull(),
  status: mysqlEnum("status", ["active", "withdrawn"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserLiquidityPosition = typeof userLiquidityPositions.$inferSelect;
export type InsertUserLiquidityPosition = typeof userLiquidityPositions.$inferInsert;

// ==================== Social Trading & Leaderboard ====================

export const leaderboard = mysqlTable("leaderboard", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  rank: int("rank").default(0).notNull(),
  totalPnL: decimal("totalPnL", { precision: 20, scale: 8 }).default("0").notNull(),
  winRate: decimal("winRate", { precision: 5, scale: 2 }).default("0").notNull(), // Percentage
  totalTrades: int("totalTrades").default(0).notNull(),
  followers: int("followers").default(0).notNull(),
  points: int("points").default(0).notNull(), // Gamification points
  streak: int("streak").default(0).notNull(), // Winning streak
  tier: mysqlEnum("tier", ["bronze", "silver", "gold", "platinum", "diamond"]).default("bronze").notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Leaderboard = typeof leaderboard.$inferSelect;
export type InsertLeaderboard = typeof leaderboard.$inferInsert;

export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementType: varchar("achievementType", { length: 50 }).notNull(), // e.g., "first_trade", "100_trades", "10k_profit"
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // Icon name or emoji
  points: int("points").default(0).notNull(),
  metadata: text("metadata"), // JSON metadata
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

export const socialFeed = mysqlTable("socialFeed", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["post", "trade_share", "achievement", "milestone"]).notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON metadata (trade details, achievement info, etc.)
  likes: int("likes").default(0).notNull(),
  comments: int("comments").default(0).notNull(),
  shares: int("shares").default(0).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SocialFeed = typeof socialFeed.$inferSelect;
export type InsertSocialFeed = typeof socialFeed.$inferInsert;

export const profitSharing = mysqlTable("profitSharing", {
  id: int("id").autoincrement().primaryKey(),
  traderId: int("traderId").notNull(),
  followerId: int("followerId").notNull(),
  tradeId: int("tradeId").notNull(),
  originalProfit: decimal("originalProfit", { precision: 20, scale: 8 }).notNull(),
  sharedProfit: decimal("sharedProfit", { precision: 20, scale: 8 }).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).default("10").notNull(), // Default 10% profit sharing
  status: mysqlEnum("status", ["pending", "paid", "cancelled"]).default("pending").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProfitSharing = typeof profitSharing.$inferSelect;
export type InsertProfitSharing = typeof profitSharing.$inferInsert;

// Hot Wallet System
export const hotWallets = mysqlTable("hotWallets", {
  id: int("id").autoincrement().primaryKey(),
  symbol: varchar("symbol", { length: 10 }).notNull(), // Cryptocurrency symbol (BTC, ETH, etc.)
  name: varchar("name", { length: 50 }).notNull(), // Full cryptocurrency name
  network: varchar("network", { length: 50 }).notNull(), // Blockchain network
  type: varchar("type", { length: 20 }).notNull(), // Wallet type (bitcoin, ethereum, etc.)
  address: varchar("address", { length: 255 }).notNull(), // Hot wallet address
  privateKeyEncrypted: text("privateKeyEncrypted").notNull(), // Encrypted private key (AES-256)
  mnemonic: text("mnemonic"), // Encrypted mnemonic phrase (if applicable)
  publicKey: text("publicKey"), // Public key (for Bitcoin-based coins)
  isActive: boolean("isActive").default(true).notNull(), // Whether this wallet is currently active
  balance: decimal("balance", { precision: 20, scale: 8 }).default("0").notNull(), // Current balance (updated periodically)
  lastBalanceCheck: timestamp("lastBalanceCheck"), // Last time balance was checked
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HotWallet = typeof hotWallets.$inferSelect;
export type InsertHotWallet = typeof hotWallets.$inferInsert;

// Payment Gateway Configuration
export const paymentGateways = mysqlTable("paymentGateways", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(), // Gateway name (ChangeNOW, Simplex, etc.)
  apiKeyEncrypted: text("apiKeyEncrypted"), // Encrypted API key
  apiSecretEncrypted: text("apiSecretEncrypted"), // Encrypted API secret
  webhookSecret: text("webhookSecret"), // Webhook secret for verification
  isActive: boolean("isActive").default(false).notNull(), // Whether this gateway is enabled
  isSandbox: boolean("isSandbox").default(true).notNull(), // Whether using sandbox/test mode
  supportedCurrencies: text("supportedCurrencies"), // JSON array of supported currencies
  config: text("config"), // JSON: Additional configuration (endpoints, limits, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentGateway = typeof paymentGateways.$inferSelect;
export type InsertPaymentGateway = typeof paymentGateways.$inferInsert;
