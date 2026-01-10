-- BitChange Pro Database Population Script (Corrected)
-- Based on actual schema.ts structure

-- 1. NETWORKS (17 cryptocurrencies)
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations) VALUES
('Bitcoin', 'BTC', NULL, 'bitcoin', 'BTC', 1, '0', '0.0005', '0.0001', '0.001', 3),
('Ethereum', 'ETH', '1', 'ethereum', 'ETH', 1, '0', '0.005', '0.001', '0.01', 12),
('Tether (ERC-20)', 'USDT', '1', 'ethereum', 'USDT', 1, '0', '5', '1', '10', 12),
('USD Coin (ERC-20)', 'USDC', '1', 'ethereum', 'USDC', 1, '0', '5', '1', '10', 12),
('Chainlink (ERC-20)', 'LINK', '1', 'ethereum', 'LINK', 1, '0', '0.5', '0.1', '1', 12),
('BNB Chain', 'BNB', '56', 'ethereum', 'BNB', 1, '0', '0.005', '0.001', '0.01', 15),
('Tether (BEP-20)', 'USDT_BSC', '56', 'ethereum', 'USDT', 1, '0', '2', '1', '10', 15),
('Cardano', 'ADA', NULL, 'cardano', 'ADA', 1, '0', '1', '1', '10', 15),
('Solana', 'SOL', NULL, 'solana', 'SOL', 1, '0', '0.000005', '0.01', '0.1', 32),
('Ripple', 'XRP', NULL, 'ripple', 'XRP', 1, '0', '0.1', '1', '10', 1),
('Polkadot', 'DOT', NULL, 'polkadot', 'DOT', 1, '0', '0.1', '0.1', '1', 10),
('Dogecoin', 'DOGE', NULL, 'dogecoin', 'DOGE', 1, '0', '1', '1', '10', 6),
('Avalanche C-Chain', 'AVAX', '43114', 'ethereum', 'AVAX', 1, '0', '0.01', '0.01', '0.1', 15),
('Polygon', 'MATIC', '137', 'ethereum', 'MATIC', 1, '0', '0.1', '0.1', '1', 128),
('Litecoin', 'LTC', NULL, 'litecoin', 'LTC', 1, '0', '0.001', '0.001', '0.01', 6),
('Stellar', 'XLM', NULL, 'stellar', 'XLM', 1, '0', '0.00001', '1', '10', 1);

-- 2. STAKING PLANS (with competitive APRs)
INSERT INTO stakingPlans (asset, name, apr, lockDays, minAmount, enabled) VALUES
('BTC', 'Bitcoin Flexible Staking', '8.50', 0, '0.001', 1),
('BTC', 'Bitcoin Locked 30D', '10.50', 30, '0.001', 1),
('BTC', 'Bitcoin Locked 90D', '12.50', 90, '0.001', 1),
('ETH', 'Ethereum Flexible Staking', '7.20', 0, '0.01', 1),
('ETH', 'Ethereum Locked 30D', '9.20', 30, '0.01', 1),
('ETH', 'Ethereum Locked 90D', '11.20', 90, '0.01', 1),
('USDT', 'USDT Flexible Staking', '12.00', 0, '10', 1),
('USDT', 'USDT Locked 30D', '14.00', 30, '10', 1),
('USDT', 'USDT Locked 90D', '15.00', 90, '10', 1),
('BNB', 'BNB Flexible Staking', '9.80', 0, '0.01', 1),
('BNB', 'BNB Locked 30D', '11.80', 30, '0.01', 1),
('SOL', 'Solana Flexible Staking', '8.90', 0, '0.1', 1),
('SOL', 'Solana Locked 30D', '10.90', 30, '0.1', 1);

-- Verify insertions
SELECT 'Database population completed!' as Status;
SELECT COUNT(*) as Networks FROM networks;
SELECT COUNT(*) as StakingPlans FROM stakingPlans;
