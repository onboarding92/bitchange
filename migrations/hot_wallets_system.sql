-- Hot Wallets System Migration
-- This migration creates tables for centralized hot wallet management

-- Hot Wallets Configuration Table
CREATE TABLE IF NOT EXISTS hotWallets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  symbol VARCHAR(10) NOT NULL COMMENT 'Cryptocurrency symbol (BTC, ETH, etc.)',
  name VARCHAR(50) NOT NULL COMMENT 'Full cryptocurrency name',
  network VARCHAR(50) NOT NULL COMMENT 'Blockchain network',
  type VARCHAR(20) NOT NULL COMMENT 'Wallet type (bitcoin, ethereum, etc.)',
  address VARCHAR(255) NOT NULL COMMENT 'Hot wallet address',
  privateKeyEncrypted TEXT NOT NULL COMMENT 'Encrypted private key (AES-256)',
  mnemonic TEXT COMMENT 'Encrypted mnemonic phrase (if applicable)',
  publicKey TEXT COMMENT 'Public key (for Bitcoin-based coins)',
  isActive BOOLEAN DEFAULT TRUE COMMENT 'Whether this wallet is currently active',
  balance DECIMAL(20, 8) DEFAULT 0 COMMENT 'Current balance (updated periodically)',
  lastBalanceCheck TIMESTAMP NULL COMMENT 'Last time balance was checked',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_symbol_network (symbol, network),
  INDEX idx_symbol (symbol),
  INDEX idx_network (network),
  INDEX idx_active (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Centralized hot wallet configuration';

-- Payment Gateway Configuration Table
CREATE TABLE IF NOT EXISTS paymentGateways (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT 'Gateway name (ChangeNOW, Simplex, etc.)',
  apiKeyEncrypted TEXT COMMENT 'Encrypted API key',
  apiSecretEncrypted TEXT COMMENT 'Encrypted API secret',
  webhookSecret TEXT COMMENT 'Webhook secret for verification',
  isActive BOOLEAN DEFAULT FALSE COMMENT 'Whether this gateway is enabled',
  isSandbox BOOLEAN DEFAULT TRUE COMMENT 'Whether using sandbox/test mode',
  supportedCurrencies JSON COMMENT 'List of supported currencies',
  config JSON COMMENT 'Additional configuration (endpoints, limits, etc.)',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_gateway_name (name),
  INDEX idx_active (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Payment gateway configuration';

-- Deposit Tracking Enhancement
-- Add reference ID to deposits table for tracking
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS referenceId VARCHAR(50) COMMENT 'Unique reference ID for deposit tracking';
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS gatewayName VARCHAR(50) COMMENT 'Payment gateway used (if applicable)';
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS gatewayTransactionId VARCHAR(255) COMMENT 'Transaction ID from payment gateway';

-- Insert default payment gateways (inactive by default)
INSERT INTO paymentGateways (name, isActive, isSandbox, supportedCurrencies, config) VALUES
('ChangeNOW', FALSE, TRUE, '["BTC","ETH","USDT","BNB","USDC"]', '{"website":"https://changenow.io","apiEndpoint":"https://api.changenow.io/v2"}'),
('Simplex', FALSE, TRUE, '["BTC","ETH","USDT","BNB"]', '{"website":"https://www.simplex.com","apiEndpoint":"https://sandbox.test-simplexcc.com"}'),
('MoonPay', FALSE, TRUE, '["BTC","ETH","USDT","BNB","USDC"]', '{"website":"https://www.moonpay.com","apiEndpoint":"https://api.moonpay.com"}'),
('Transak', FALSE, TRUE, '["BTC","ETH","USDT","BNB","USDC","MATIC"]', '{"website":"https://transak.com","apiEndpoint":"https://api.transak.com"}'),
('Mercuryo', FALSE, TRUE, '["BTC","ETH","USDT","BNB"]', '{"website":"https://mercuryo.io","apiEndpoint":"https://api.mercuryo.io"}'),
('CoinGate', FALSE, TRUE, '["BTC","ETH","USDT","LTC","DOGE"]', '{"website":"https://coingate.com","apiEndpoint":"https://api.coingate.com/v2"}'),
('Changelly', FALSE, TRUE, '["BTC","ETH","USDT","BNB","USDC","XRP","ADA"]', '{"website":"https://changelly.com","apiEndpoint":"https://api.changelly.com"}'),
('Banxa', FALSE, TRUE, '["BTC","ETH","USDT","BNB","USDC","MATIC","AVAX"]', '{"website":"https://banxa.com","apiEndpoint":"https://api.banxa.com"}'
)
ON DUPLICATE KEY UPDATE updatedAt = CURRENT_TIMESTAMP;
