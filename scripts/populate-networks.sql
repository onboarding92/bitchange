-- Populate blockchain networks for BitChange Pro
-- This script adds ERC20, TRC20, BEP20, and native blockchain networks

-- Clear existing networks (optional - comment out if you want to keep existing data)
-- DELETE FROM networks;

-- Bitcoin Network
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations)
VALUES ('Bitcoin', 'BTC', 'bitcoin', 'native', 'BTC', 1, 0, 0.0005, 0.0001, 0.001, 3);

-- Ethereum Network
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations)
VALUES ('Ethereum', 'ETH', '1', 'native', 'ETH', 1, 0, 0.005, 0.01, 0.01, 12);

-- USDT on ERC20 (Ethereum)
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations)
VALUES ('USDT ERC20', 'USDT', '1', 'ERC20', 'USDT', 1, 0, 5, 10, 10, 12);

-- USDT on TRC20 (Tron)
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations)
VALUES ('USDT TRC20', 'USDT', 'tron', 'TRC20', 'USDT', 1, 0, 1, 10, 10, 19);

-- USDT on BEP20 (Binance Smart Chain)
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations)
VALUES ('USDT BEP20', 'USDT', '56', 'BEP20', 'USDT', 1, 0, 0.8, 10, 10, 15);

-- BNB on BEP20 (Binance Smart Chain)
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations)
VALUES ('BNB BEP20', 'BNB', '56', 'BEP20', 'BNB', 1, 0, 0.0005, 0.01, 0.01, 15);

-- USDC on ERC20 (Ethereum)
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations)
VALUES ('USDC ERC20', 'USDC', '1', 'ERC20', 'USDC', 1, 0, 5, 10, 10, 12);

-- USDC on TRC20 (Tron)
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations)
VALUES ('USDC TRC20', 'USDC', 'tron', 'TRC20', 'USDC', 1, 0, 1, 10, 10, 19);

-- USDC on BEP20 (Binance Smart Chain)
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations)
VALUES ('USDC BEP20', 'USDC', '56', 'BEP20', 'USDC', 1, 0, 0.8, 10, 10, 15);

-- ADA (Cardano)
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations)
VALUES ('Cardano', 'ADA', 'cardano', 'native', 'ADA', 1, 0, 0.5, 1, 10, 15);

-- SOL (Solana)
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations)
VALUES ('Solana', 'SOL', 'solana', 'native', 'SOL', 1, 0, 0.01, 0.1, 0.1, 32);

-- XRP (Ripple)
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations)
VALUES ('Ripple', 'XRP', 'ripple', 'native', 'XRP', 1, 0, 0.25, 1, 10, 1);

-- DOT (Polkadot)
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations)
VALUES ('Polkadot', 'DOT', 'polkadot', 'native', 'DOT', 1, 0, 0.1, 0.1, 1, 10);

-- DOGE (Dogecoin)
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations)
VALUES ('Dogecoin', 'DOGE', 'dogecoin', 'native', 'DOGE', 1, 0, 5, 10, 50, 6);

-- AVAX (Avalanche)
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations)
VALUES ('Avalanche', 'AVAX', '43114', 'native', 'AVAX', 1, 0, 0.01, 0.1, 0.1, 1);

-- SHIB on ERC20 (Ethereum)
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations)
VALUES ('SHIB ERC20', 'SHIB', '1', 'ERC20', 'SHIB', 1, 0, 500000, 1000000, 1000000, 12);

-- MATIC (Polygon)
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations)
VALUES ('Polygon', 'MATIC', '137', 'native', 'MATIC', 1, 0, 0.1, 1, 1, 128);

-- LTC (Litecoin)
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations)
VALUES ('Litecoin', 'LTC', 'litecoin', 'native', 'LTC', 1, 0, 0.001, 0.01, 0.01, 6);

-- LINK on ERC20 (Ethereum)
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations)
VALUES ('LINK ERC20', 'LINK', '1', 'ERC20', 'LINK', 1, 0, 0.5, 1, 1, 12);

-- XLM (Stellar)
INSERT INTO networks (name, symbol, chainId, type, asset, isActive, depositFee, withdrawalFee, minDeposit, minWithdrawal, confirmations)
VALUES ('Stellar', 'XLM', 'stellar', 'native', 'XLM', 1, 0, 0.01, 1, 10, 1);

-- Display inserted networks
SELECT * FROM networks ORDER BY asset, type;
