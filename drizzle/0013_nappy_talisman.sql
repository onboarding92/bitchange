DROP TABLE `alerts`;--> statement-breakpoint
DROP TABLE `apiLogs`;--> statement-breakpoint
DROP TABLE `blockchainTransactions`;--> statement-breakpoint
DROP TABLE `cryptoPrices`;--> statement-breakpoint
DROP TABLE `depositAddresses`;--> statement-breakpoint
DROP TABLE `deposits`;--> statement-breakpoint
DROP TABLE `deviceFingerprints`;--> statement-breakpoint
DROP TABLE `emailVerifications`;--> statement-breakpoint
DROP TABLE `errorLogs`;--> statement-breakpoint
DROP TABLE `exchangeApiLogs`;--> statement-breakpoint
DROP TABLE `kycDocuments`;--> statement-breakpoint
DROP TABLE `loginHistory`;--> statement-breakpoint
DROP TABLE `loyaltyTiers`;--> statement-breakpoint
DROP TABLE `masterWallets`;--> statement-breakpoint
DROP TABLE `networks`;--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
DROP TABLE `orders`;--> statement-breakpoint
DROP TABLE `passwordHistory`;--> statement-breakpoint
DROP TABLE `passwordResets`;--> statement-breakpoint
DROP TABLE `priceAlerts`;--> statement-breakpoint
DROP TABLE `promoCodes`;--> statement-breakpoint
DROP TABLE `promoUsage`;--> statement-breakpoint
DROP TABLE `referrals`;--> statement-breakpoint
DROP TABLE `rewards`;--> statement-breakpoint
DROP TABLE `securityAuditLog`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
DROP TABLE `stakingPlans`;--> statement-breakpoint
DROP TABLE `stakingPositions`;--> statement-breakpoint
DROP TABLE `supportAgents`;--> statement-breakpoint
DROP TABLE `supportTickets`;--> statement-breakpoint
DROP TABLE `systemLogs`;--> statement-breakpoint
DROP TABLE `systemMetrics`;--> statement-breakpoint
DROP TABLE `ticketMessages`;--> statement-breakpoint
DROP TABLE `trades`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
DROP TABLE `userLoyalty`;--> statement-breakpoint
DROP TABLE `walletAddresses`;--> statement-breakpoint
DROP TABLE `wallets`;--> statement-breakpoint
DROP TABLE `withdrawalDelays`;--> statement-breakpoint
DROP TABLE `withdrawalWhitelist`;--> statement-breakpoint
DROP TABLE `withdrawals`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_email_unique`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_referralCode_unique`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `password`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `emailVerified`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `kycStatus`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `kycSubmittedAt`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `kycApprovedAt`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `kycRejectedReason`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `kycExpiresAt`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `kycIdFrontPath`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `kycIdBackPath`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `kycSelfiePath`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `twoFactorSecret`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `twoFactorEnabled`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `twoFactorBackupCodes`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `accountStatus`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `antiPhishingCode`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `ipWhitelist`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `referralCode`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `referredBy`;