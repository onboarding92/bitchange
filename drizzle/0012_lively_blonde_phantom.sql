CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertType` enum('high_error_rate','slow_response_time','exchange_api_failure','low_balance','suspicious_activity','system_down','error_rate','response_time','exchange_failure','db_performance') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`message` text NOT NULL,
	`metadata` text,
	`acknowledged` boolean NOT NULL DEFAULT false,
	`acknowledgedBy` int,
	`acknowledgedAt` timestamp,
	`resolved` boolean NOT NULL DEFAULT false,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apiLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`method` varchar(10) NOT NULL,
	`url` varchar(500) NOT NULL,
	`statusCode` int NOT NULL,
	`duration` int NOT NULL,
	`userId` int,
	`ip` varchar(45),
	`userAgent` text,
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `apiLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blockchainTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`txHash` varchar(255) NOT NULL,
	`network` varchar(50) NOT NULL,
	`asset` varchar(20) NOT NULL,
	`fromAddress` varchar(255),
	`toAddress` varchar(255) NOT NULL,
	`amount` decimal(20,8) NOT NULL,
	`fee` decimal(20,8) NOT NULL DEFAULT '0',
	`confirmations` int NOT NULL DEFAULT 0,
	`status` enum('pending','confirmed','failed') NOT NULL DEFAULT 'pending',
	`type` enum('deposit','withdrawal') NOT NULL,
	`userId` int,
	`depositAddressId` int,
	`withdrawalId` int,
	`blockNumber` int,
	`blockTimestamp` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blockchainTransactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `blockchainTransactions_txHash_unique` UNIQUE(`txHash`)
);
--> statement-breakpoint
CREATE TABLE `cryptoPrices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`asset` varchar(20) NOT NULL,
	`price` decimal(20,8) NOT NULL,
	`change24h` decimal(10,2) NOT NULL DEFAULT '0',
	`volume24h` decimal(30,2) NOT NULL DEFAULT '0',
	`high24h` decimal(20,8) NOT NULL DEFAULT '0',
	`low24h` decimal(20,8) NOT NULL DEFAULT '0',
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cryptoPrices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `depositAddresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`network` varchar(50) NOT NULL,
	`asset` varchar(20) NOT NULL,
	`address` varchar(255) NOT NULL,
	`derivationIndex` int,
	`masterWalletId` int,
	`isUsed` boolean NOT NULL DEFAULT false,
	`lastDepositAt` timestamp,
	`totalDeposited` decimal(20,8) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `depositAddresses_id` PRIMARY KEY(`id`),
	CONSTRAINT `depositAddresses_address_unique` UNIQUE(`address`)
);
--> statement-breakpoint
CREATE TABLE `deposits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`asset` varchar(20) NOT NULL,
	`amount` decimal(20,8) NOT NULL,
	`network` varchar(50),
	`provider` varchar(50),
	`externalId` varchar(255),
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `deposits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deviceFingerprints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fingerprint` varchar(255) NOT NULL,
	`userAgent` text,
	`ip` varchar(45),
	`trusted` boolean NOT NULL DEFAULT false,
	`lastSeen` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deviceFingerprints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailVerifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`code` varchar(10) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailVerifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `errorLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`errorType` varchar(100) NOT NULL,
	`message` text NOT NULL,
	`stack` text,
	`userId` int,
	`context` text,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`resolved` boolean NOT NULL DEFAULT false,
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `errorLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exchangeApiLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exchange` varchar(50) NOT NULL,
	`method` varchar(100) NOT NULL,
	`success` boolean NOT NULL,
	`duration` int NOT NULL,
	`rateLimitRemaining` int,
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exchangeApiLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kycDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`firstName` varchar(100),
	`lastName` varchar(100),
	`dateOfBirth` varchar(10),
	`address` text,
	`city` varchar(100),
	`country` varchar(100),
	`postalCode` varchar(20),
	`documentType` enum('id_card','passport','drivers_license') NOT NULL,
	`frontImageUrl` text NOT NULL,
	`backImageUrl` text,
	`selfieUrl` text,
	`proofOfAddressUrl` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`adminNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `kycDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loginHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`email` varchar(320),
	`ipAddress` varchar(50),
	`userAgent` text,
	`method` varchar(50),
	`success` boolean NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `loginHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loyaltyTiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`minVolume` decimal(20,2) NOT NULL,
	`feeDiscount` decimal(5,2) NOT NULL,
	`benefits` text,
	`color` varchar(20) DEFAULT '#gray',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `loyaltyTiers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `masterWallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`network` varchar(50) NOT NULL,
	`asset` varchar(20) NOT NULL,
	`address` varchar(255) NOT NULL,
	`encryptedPrivateKey` text NOT NULL,
	`encryptedMnemonic` text,
	`derivationPath` varchar(100),
	`balance` decimal(20,8) NOT NULL DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `masterWallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `masterWallets_network_unique` UNIQUE(`network`)
);
--> statement-breakpoint
CREATE TABLE `networks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`chainId` varchar(50),
	`type` varchar(50) NOT NULL,
	`asset` varchar(20) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`depositFee` decimal(20,8) NOT NULL DEFAULT '0',
	`withdrawalFee` decimal(20,8) NOT NULL DEFAULT '0',
	`minDeposit` decimal(20,8) NOT NULL DEFAULT '0',
	`minWithdrawal` decimal(20,8) NOT NULL DEFAULT '0',
	`confirmations` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `networks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('deposit','withdrawal','kyc','trade','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`relatedId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`pair` varchar(20) NOT NULL,
	`side` enum('buy','sell') NOT NULL,
	`type` enum('limit','market') NOT NULL DEFAULT 'limit',
	`price` decimal(20,8) NOT NULL,
	`amount` decimal(20,8) NOT NULL,
	`filled` decimal(20,8) NOT NULL DEFAULT '0',
	`status` enum('open','partially_filled','filled','cancelled') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `passwordHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passwordHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `passwordResets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passwordResets_id` PRIMARY KEY(`id`),
	CONSTRAINT `passwordResets_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `priceAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`asset` varchar(20) NOT NULL,
	`targetPrice` decimal(20,8) NOT NULL,
	`condition` enum('above','below') NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`triggeredAt` timestamp,
	`notificationSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `priceAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promoCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` text,
	`bonusType` enum('percentage','fixed') NOT NULL,
	`bonusValue` decimal(10,2) NOT NULL,
	`bonusAsset` varchar(20) NOT NULL DEFAULT 'USDT',
	`maxUses` int NOT NULL DEFAULT 0,
	`usedCount` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp,
	`enabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `promoCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `promoCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `promoUsage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`promoId` int NOT NULL,
	`bonusAmount` decimal(20,8) NOT NULL,
	`usedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `promoUsage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`referredBy` int NOT NULL,
	`referralCode` varchar(20) NOT NULL,
	`earnedCommission` decimal(20,8) NOT NULL DEFAULT '0',
	`status` enum('pending','active','inactive') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`activatedAt` timestamp,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`referrerId` int NOT NULL,
	`amount` decimal(20,8) NOT NULL DEFAULT '10.00000000',
	`currency` varchar(10) NOT NULL DEFAULT 'USDT',
	`type` enum('first_deposit','first_trade','manual') NOT NULL,
	`status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`notes` text,
	CONSTRAINT `rewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `securityAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`details` text,
	`ip` varchar(45),
	`userAgent` text,
	`success` boolean NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `securityAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('user','admin') NOT NULL,
	`ipAddress` varchar(50),
	`userAgent` text,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `stakingPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`asset` varchar(20) NOT NULL,
	`name` varchar(100) NOT NULL,
	`apr` decimal(5,2) NOT NULL,
	`lockDays` int NOT NULL DEFAULT 0,
	`minAmount` decimal(20,8) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stakingPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stakingPositions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`amount` decimal(20,8) NOT NULL,
	`rewards` decimal(20,8) NOT NULL DEFAULT '0',
	`status` enum('active','withdrawn') NOT NULL DEFAULT 'active',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`maturesAt` timestamp,
	`withdrawnAt` timestamp,
	CONSTRAINT `stakingPositions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supportAgents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('admin','agent') NOT NULL,
	`permissions` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supportAgents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supportTickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subject` varchar(255) NOT NULL,
	`category` enum('technical','billing','kyc','withdrawal','deposit','trading','other') NOT NULL,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`status` enum('open','in_progress','waiting_user','resolved','closed') NOT NULL DEFAULT 'open',
	`assignedTo` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	CONSTRAINT `supportTickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`details` text,
	`ipAddress` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `systemLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricType` enum('api_response_time','db_query_time','cache_hit_rate','active_users','trading_volume','error_rate','cpu_usage','memory_usage','bundle_size','redis_cache','websocket','db_query') NOT NULL,
	`value` decimal(20,8) NOT NULL,
	`unit` varchar(20),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `systemMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticketMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`userId` int NOT NULL,
	`message` text NOT NULL,
	`isStaff` boolean NOT NULL DEFAULT false,
	`attachments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticketMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buyOrderId` int NOT NULL,
	`sellOrderId` int NOT NULL,
	`buyerId` int NOT NULL,
	`sellerId` int NOT NULL,
	`pair` varchar(20) NOT NULL,
	`price` decimal(20,8) NOT NULL,
	`amount` decimal(20,8) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('deposit','withdrawal','trade','staking_reward','promo','internal_transfer') NOT NULL,
	`asset` varchar(20) NOT NULL,
	`amount` decimal(20,8) NOT NULL,
	`status` enum('pending','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`reference` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userLoyalty` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tierId` int NOT NULL,
	`volume30d` decimal(20,2) NOT NULL DEFAULT '0',
	`referralCount` int NOT NULL DEFAULT 0,
	`totalEarned` decimal(20,8) NOT NULL DEFAULT '0',
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userLoyalty_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `walletAddresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`asset` varchar(20) NOT NULL,
	`address` varchar(255) NOT NULL,
	`network` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `walletAddresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`asset` varchar(20) NOT NULL,
	`balance` decimal(20,8) NOT NULL DEFAULT '0',
	`locked` decimal(20,8) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `withdrawalDelays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`withdrawalId` int NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(20,8) NOT NULL,
	`usdValue` decimal(20,2) NOT NULL,
	`delayUntil` timestamp NOT NULL,
	`reason` text,
	`cancelled` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `withdrawalDelays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `withdrawalWhitelist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`asset` varchar(20) NOT NULL,
	`address` varchar(255) NOT NULL,
	`network` varchar(50) NOT NULL,
	`label` varchar(100),
	`verified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `withdrawalWhitelist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `withdrawals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`asset` varchar(20) NOT NULL,
	`amount` decimal(20,8) NOT NULL,
	`network` varchar(50) NOT NULL,
	`address` varchar(255) NOT NULL,
	`fee` decimal(20,8) NOT NULL DEFAULT '0',
	`status` enum('pending','approved','rejected','completed','processing','failed') NOT NULL DEFAULT 'pending',
	`adminNote` text,
	`adminNotes` text,
	`txHash` varchar(255),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `withdrawals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `kycStatus` enum('pending','submitted','approved','rejected','expired') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `kycSubmittedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `kycApprovedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `kycRejectedReason` text;--> statement-breakpoint
ALTER TABLE `users` ADD `kycExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `kycIdFrontPath` text;--> statement-breakpoint
ALTER TABLE `users` ADD `kycIdBackPath` text;--> statement-breakpoint
ALTER TABLE `users` ADD `kycSelfiePath` text;--> statement-breakpoint
ALTER TABLE `users` ADD `twoFactorSecret` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `twoFactorEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `twoFactorBackupCodes` text;--> statement-breakpoint
ALTER TABLE `users` ADD `accountStatus` enum('active','suspended') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `antiPhishingCode` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `ipWhitelist` text;--> statement-breakpoint
ALTER TABLE `users` ADD `referralCode` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `referredBy` int;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_referralCode_unique` UNIQUE(`referralCode`);