-- BitChange Pro Database Population Script
-- This script populates all necessary data for production deployment

-- 1. NETWORKS (17 cryptocurrencies)
INSERT INTO networks (symbol, name, network, type, isActive, depositEnabled, withdrawalEnabled, minDeposit, minWithdrawal, withdrawalFee, confirmationsRequired, rpcUrl, explorerUrl, contractAddress, decimals, createdAt, updatedAt) VALUES
('BTC', 'Bitcoin', 'Bitcoin', 'bitcoin', 1, 1, 1, '0.0001', '0.001', '0.0005', 3, 'https://blockstream.info/api', 'https://blockstream.info', NULL, 8, NOW(), NOW()),
('ETH', 'Ethereum', 'Ethereum', 'ethereum', 1, 1, 1, '0.001', '0.01', '0.005', 12, 'https://eth.llamarpc.com', 'https://etherscan.io', NULL, 18, NOW(), NOW()),
('USDT', 'Tether', 'Ethereum (ERC-20)', 'ethereum', 1, 1, 1, '1', '10', '5', 12, 'https://eth.llamarpc.com', 'https://etherscan.io', '0xdac17f958d2ee523a2206206994597c13d831ec7', 6, NOW(), NOW()),
('USDC', 'USD Coin', 'Ethereum (ERC-20)', 'ethereum', 1, 1, 1, '1', '10', '5', 12, 'https://eth.llamarpc.com', 'https://etherscan.io', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6, NOW(), NOW()),
('LINK', 'Chainlink', 'Ethereum (ERC-20)', 'ethereum', 1, 1, 1, '0.1', '1', '0.5', 12, 'https://eth.llamarpc.com', 'https://etherscan.io', '0x514910771af9ca656af840dff83e8264ecf986ca', 18, NOW(), NOW()),
('BNB', 'Binance Coin', 'BNB Chain', 'ethereum', 1, 1, 1, '0.001', '0.01', '0.005', 15, 'https://bsc-dataseed.binance.org', 'https://bscscan.com', NULL, 18, NOW(), NOW()),
('USDT_BSC', 'Tether', 'BNB Chain (BEP-20)', 'ethereum', 1, 1, 1, '1', '10', '2', 15, 'https://bsc-dataseed.binance.org', 'https://bscscan.com', '0x55d398326f99059ff775485246999027b3197955', 18, NOW(), NOW()),
('ADA', 'Cardano', 'Cardano', 'cardano', 1, 1, 1, '1', '10', '1', 15, 'https://cardano-mainnet.blockfrost.io', 'https://cardanoscan.io', NULL, 6, NOW(), NOW()),
('SOL', 'Solana', 'Solana', 'solana', 1, 1, 1, '0.01', '0.1', '0.000005', 32, 'https://api.mainnet-beta.solana.com', 'https://solscan.io', NULL, 9, NOW(), NOW()),
('XRP', 'Ripple', 'XRP Ledger', 'ripple', 1, 1, 1, '1', '10', '0.1', 1, 'https://s1.ripple.com:51234', 'https://xrpscan.com', NULL, 6, NOW(), NOW()),
('DOT', 'Polkadot', 'Polkadot', 'polkadot', 1, 1, 1, '0.1', '1', '0.1', 10, 'https://rpc.polkadot.io', 'https://polkadot.subscan.io', NULL, 10, NOW(), NOW()),
('DOGE', 'Dogecoin', 'Dogecoin', 'dogecoin', 1, 1, 1, '1', '10', '1', 6, 'https://dogechain.info/api', 'https://dogechain.info', NULL, 8, NOW(), NOW()),
('AVAX', 'Avalanche', 'Avalanche C-Chain', 'ethereum', 1, 1, 1, '0.01', '0.1', '0.01', 15, 'https://api.avax.network/ext/bc/C/rpc', 'https://snowtrace.io', NULL, 18, NOW(), NOW()),
('MATIC', 'Polygon', 'Polygon', 'ethereum', 1, 1, 1, '0.1', '1', '0.1', 128, 'https://polygon-rpc.com', 'https://polygonscan.com', NULL, 18, NOW(), NOW()),
('LTC', 'Litecoin', 'Litecoin', 'litecoin', 1, 1, 1, '0.001', '0.01', '0.001', 6, 'https://litecoin.info/api', 'https://blockchair.com/litecoin', NULL, 8, NOW(), NOW()),
('XLM', 'Stellar', 'Stellar', 'stellar', 1, 1, 1, '1', '10', '0.00001', 1, 'https://horizon.stellar.org', 'https://stellarchain.io', NULL, 7, NOW(), NOW());

-- 2. HOT WALLETS (from CSV with private keys)
INSERT INTO hotWallets (symbol, name, network, type, address, privateKey, mnemonic, publicKey, balance, isActive, lastSweepAt, createdAt, updatedAt) VALUES
('BTC', 'Bitcoin', 'Bitcoin', 'bitcoin', 'bc1qfh2ye87986qagalmqvladl7mu5qxxl38v4ys3w', 'L5Sju64Yteqx3Lrq76LEoSSh1566hADUZPzPkjGRn7UvPvqCpQEe', '', '2,41,129,114,62,35,158,29,99,241,36,99,136,117,132,192,49,42,160,96,63,154,51,20,180,23,126,223,212,43,167,182,249', '0', 1, NOW(), NOW(), NOW()),
('ETH', 'Ethereum', 'Ethereum', 'ethereum', '0xd375BF2f26b78bb0F8e79fa27c93e8C1DDa7Df21', '0x52801544fbcba1390b955fcf6fb04cb6396daf46b482ad0047a135284c9ede5c', 'struggle ethics worry test popular pipe grief critic hint husband already drama', '', '0', 1, NOW(), NOW(), NOW()),
('USDT', 'Tether', 'Ethereum (ERC-20)', 'ethereum', '0x3Cab11af4057D723a618fE4133F1167519D1899B', '0x3f594dae84d03257f6d382a742fd914192e17ecddc21793e034c1eea04a412bf', 'base slim immense client agree summer throw thunder slot load target roof', '', '0', 1, NOW(), NOW(), NOW()),
('USDC', 'USD Coin', 'Ethereum (ERC-20)', 'ethereum', '0x3Cab11af4057D723a618fE4133F1167519D1899B', '0x3f594dae84d03257f6d382a742fd914192e17ecddc21793e034c1eea04a412bf', 'base slim immense client agree summer throw thunder slot load target roof', '', '0', 1, NOW(), NOW(), NOW()),
('LINK', 'Chainlink', 'Ethereum (ERC-20)', 'ethereum', '0x3Cab11af4057D723a618fE4133F1167519D1899B', '0x3f594dae84d03257f6d382a742fd914192e17ecddc21793e034c1eea04a412bf', 'base slim immense client agree summer throw thunder slot load target roof', '', '0', 1, NOW(), NOW(), NOW()),
('BNB', 'Binance Coin', 'BNB Chain', 'ethereum', '0xDFbf2b41c7A7F2a973cDc7b07211E33Ec3bAE6d9', '0x0718b354a89f15e10acbadd4ad736cb8be2c04125d92f7c9960aba6f0173f297', 'risk feature sign air extend alarm wine orbit rent similar enrich coral', '', '0', 1, NOW(), NOW(), NOW()),
('USDT_BSC', 'Tether', 'BNB Chain (BEP-20)', 'ethereum', '0x7669365CC31f86D5857c7530052D8134Cb5D9449', '0x7a21d6f0dbe4999d95de659d671fb8250da37b28136a500b42817d835abec167', 'bar sport seed jump tube anger trash rebel found anxiety boy fit', '', '0', 1, NOW(), NOW(), NOW()),
('ADA', 'Cardano', 'Cardano', 'cardano', '0xFE8fF55024103646282fBF6741a9D8191bc8F3D1', '0xd4c67369634e15be8a33fbdf65066ccb898c03f882f9018bef6f02168cd7224d', 'canal cross question embark equal endless diesel embark bid length glad social', '', '0', 1, NOW(), NOW(), NOW()),
('SOL', 'Solana', 'Solana', 'solana', 'SOL_0x09917D960fDad8f5F7f328eeF9165A', '7yS8sKPE8q2C57dt6S9YCK4DAEkHLsr7HRPwJKNKkr3p', '', '', '0', 1, NOW(), NOW(), NOW()),
('XRP', 'Ripple', 'XRP Ledger', 'ripple', '0xb952E347b3457F1662E8100c493A51C4249739fB', '0xeac6dded918a3cd7bf7879205a63a71e182be58745d3bd1e3e8b5c5e66b61844', 'vibrant mosquito park offer nuclear sort lucky domain attitude fabric uniform wine', '', '0', 1, NOW(), NOW(), NOW()),
('DOT', 'Polkadot', 'Polkadot', 'polkadot', '0xfF300f6202EB052Ff5e54403a4B6399548056f47', '0x59ffaf1d1911f5fbd4d2d099f4446d414e86144df924991c5fcf8eaf19e89323', 'once water tourist lunch cloth text exhibit crisp reopen wood inch type', '', '0', 1, NOW(), NOW(), NOW()),
('DOGE', 'Dogecoin', 'Dogecoin', 'dogecoin', 'bc1qaztjccsy0tkjszlykcmfw49urru785v569gkx7', 'KxQaMTHnT4giAyrXMoNTmufY9EoAd8LghGKQfkXSZGHFZ9FR6opv', '', '2,10,213,136,129,140,217,19,199,210,67,160,193,223,65,138,12,150,75,194,14,30,16,39,99,193,128,19,253,12,53,39,200', '0', 1, NOW(), NOW(), NOW()),
('AVAX', 'Avalanche', 'Avalanche C-Chain', 'ethereum', '0x973f8c178055C18Fdc3B42868c082FfEB67a1452', '0x861d1775aae46aad060afb52f9c99bce35ef0469b55f4795712cf3ed18858a62', 'october economy pull wine purpose aisle agree tragic skirt ramp rule educate', '', '0', 1, NOW(), NOW(), NOW()),
('MATIC', 'Polygon', 'Polygon', 'ethereum', '0x13d3FCC798013f65cA688FC1041800954AFA5E94', '0xb218e26a6dc37ded1a1a9245f72858f119540346436baf27398a0c984c34069f', 'zoo shaft knock talent arrive angle tool key vital crime ridge soda', '', '0', 1, NOW(), NOW(), NOW()),
('LTC', 'Litecoin', 'Litecoin', 'litecoin', 'bc1qsjwzzcsa47dfzycslmzqsyeqrp9ercehap0eg2', 'KwS13ZDntvc61RjtsZfhrtn9nz18t6N1rfxdtZV1rCyGyVFDNnRZ', '', '2,116,191,10,19,114,184,136,0,51,69,149,247,18,9,133,203,19,91,52,143,5,52,133,125,55,223,62,68,202,166,197,129', '0', 1, NOW(), NOW(), NOW()),
('XLM', 'Stellar', 'Stellar', 'stellar', '0x02E038a5CB0e8CF146206E5dE70B60F869Ba1E2E', '0x4e8db41056d267295f7051edc74fd45028dc5f01b17b946a45da5cd8f7ff3108', 'sail vapor radio lesson senior garbage save genius canal ahead scorpion balcony', '', '0', 1, NOW(), NOW(), NOW());

-- 3. STAKING POOLS (with competitive APYs)
INSERT INTO stakingPools (symbol, name, apy, minStake, maxStake, lockPeriodDays, isActive, totalStaked, participantCount, description, createdAt, updatedAt) VALUES
('BTC', 'Bitcoin Staking', '8.5', '0.001', '10', 0, 1, '0', 0, 'Earn passive income by staking your Bitcoin with flexible withdrawal', NOW(), NOW()),
('BTC', 'Bitcoin Locked 30D', '10.5', '0.001', '10', 30, 1, '0', 0, 'Higher APY with 30-day lock period', NOW(), NOW()),
('BTC', 'Bitcoin Locked 90D', '12.5', '0.001', '10', 90, 1, '0', 0, 'Maximum APY with 90-day lock period', NOW(), NOW()),
('ETH', 'Ethereum Staking', '7.2', '0.01', '100', 0, 1, '0', 0, 'Stake ETH and earn rewards with flexible withdrawal', NOW(), NOW()),
('ETH', 'Ethereum Locked 30D', '9.2', '0.01', '100', 30, 1, '0', 0, 'Higher APY with 30-day lock period', NOW(), NOW()),
('ETH', 'Ethereum Locked 90D', '11.2', '0.01', '100', 90, 1, '0', 0, 'Maximum APY with 90-day lock period', NOW(), NOW()),
('USDT', 'USDT Staking', '12.0', '10', '100000', 0, 1, '0', 0, 'Stable returns on your USDT holdings', NOW(), NOW()),
('USDT', 'USDT Locked 30D', '14.0', '10', '100000', 30, 1, '0', 0, 'Higher APY with 30-day lock period', NOW(), NOW()),
('USDT', 'USDT Locked 90D', '15.0', '10', '100000', 90, 1, '0', 0, 'Maximum APY with 90-day lock period', NOW(), NOW()),
('BNB', 'BNB Staking', '9.8', '0.01', '1000', 0, 1, '0', 0, 'Earn rewards by staking BNB with flexible withdrawal', NOW(), NOW()),
('BNB', 'BNB Locked 30D', '11.8', '0.01', '1000', 30, 1, '0', 0, 'Higher APY with 30-day lock period', NOW(), NOW()),
('SOL', 'Solana Staking', '8.9', '0.1', '10000', 0, 1, '0', 0, 'Stake SOL and earn competitive rewards', NOW(), NOW()),
('SOL', 'Solana Locked 30D', '10.9', '0.1', '10000', 30, 1, '0', 0, 'Higher APY with 30-day lock period', NOW(), NOW());

-- 4. PAYMENT GATEWAYS
INSERT INTO paymentGateways (name, type, isActive, supportedCurrencies, minAmount, maxAmount, feePercentage, processingTime, apiEndpoint, createdAt, updatedAt) VALUES
('MoonPay', 'fiat_to_crypto', 1, 'BTC,ETH,USDT,BNB,ADA,SOL', '30', '50000', '4.5', '5-30 minutes', 'https://api.moonpay.com', NOW(), NOW()),
('Simplex', 'fiat_to_crypto', 1, 'BTC,ETH,USDT,BNB', '50', '20000', '3.5', '10-30 minutes', 'https://api.simplexcc.com', NOW(), NOW()),
('Transak', 'fiat_to_crypto', 1, 'BTC,ETH,USDT,USDC,BNB,MATIC', '30', '10000', '2.99', '5-15 minutes', 'https://api.transak.com', NOW(), NOW()),
('ChangeNOW', 'crypto_to_crypto', 1, 'BTC,ETH,USDT,BNB,ADA,SOL,XRP,DOT,DOGE,AVAX,MATIC,LTC', '10', '1000000', '0.5', '5-30 minutes', 'https://api.changenow.io', NOW(), NOW()),
('Mercuryo', 'fiat_to_crypto', 1, 'BTC,ETH,USDT,BNB', '30', '10000', '3.95', '10-20 minutes', 'https://api.mercuryo.io', NOW(), NOW()),
('CoinGate', 'payment_processor', 1, 'BTC,ETH,USDT,LTC,DOGE', '1', '100000', '1.0', 'Instant', 'https://api.coingate.com', NOW(), NOW()),
('Changelly', 'crypto_to_crypto', 1, 'BTC,ETH,USDT,BNB,ADA,SOL,XRP,LTC', '10', '500000', '0.25', '5-30 minutes', 'https://api.changelly.com', NOW(), NOW()),
('Banxa', 'fiat_to_crypto', 1, 'BTC,ETH,USDT,BNB,MATIC', '50', '50000', '2.5', '10-30 minutes', 'https://api.banxa.com', NOW(), NOW());

-- 5. ADMIN USER
-- Password: AdminBitChange2025 (will be hashed by the application)
-- This is a placeholder - the actual admin user should be created via the application's registration system
-- or using the create-admin.ts script with proper password hashing

SELECT 'Database population completed successfully!' as Status;
SELECT COUNT(*) as Networks FROM networks;
SELECT COUNT(*) as HotWallets FROM hotWallets;
SELECT COUNT(*) as StakingPools FROM stakingPools;
SELECT COUNT(*) as PaymentGateways FROM paymentGateways;
