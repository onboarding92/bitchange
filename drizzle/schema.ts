import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, date } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  password: varchar("password", { length: 255 }),
  emailVerified: timestamp("emailVerified"),
  kycStatus: mysqlEnum("kycStatus", ["pending", "submitted", "approved", "rejected", "expired"]).default("pending").notNull(),
  kycSubmittedAt: timestamp("kycSubmittedAt"),
  kycApprovedAt: timestamp("kycApprovedAt"),
  kycRejectedReason: text("kycRejectedReason"),
  kycExpiresAt: timestamp("kycExpiresAt"),
  twoFactorSecret: varchar("twoFactorSecret", { length: 255 }),
  twoFactorEnabled: boolean("twoFactorEnabled").default(false).notNull(),
  twoFactorBackupCodes: text("twoFactorBackupCodes"), // JSON array of backup codes
  accountStatus: mysqlEnum("accountStatus", ["active", "suspended"]).default("active").notNull(),
  antiPhishingCode: varchar("antiPhishingCode", { length: 50 }), // Personal code shown in emails
  ipWhitelist: text("ipWhitelist"), // JSON array of whitelisted IPs (admin only)
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
  type: mysqlEnum("type", ["deposit", "withdrawal", "trade", "staking_reward", "promo", "internal_transfer"]).notNull(),
  asset: varchar("asset", { length: 20 }).notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "cancelled"]).default("pending").notNull(),
  reference: text("reference"),
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
