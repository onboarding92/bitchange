#!/usr/bin/env node
/**
 * Import Hot Wallets from CSV into masterWallets table
 * 
 * This script imports the centralized hot wallet addresses that ALL users
 * will use for deposits (like Binance/Coinbase model).
 * 
 * Security: Private keys are encrypted with AES-256-CBC before storage.
 */

import { createConnection } from 'mysql2/promise';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Encryption configuration
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-cbc';

console.log('🔐 Encryption Key:', ENCRYPTION_KEY.substring(0, 16) + '...');
console.log('⚠️  IMPORTANT: Save this encryption key in .env as WALLET_ENCRYPTION_KEY');
console.log('');

/**
 * Encrypt sensitive data (private keys, mnemonics)
 */
function encrypt(text) {
  if (!text || text === '') return null;
  
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return IV + encrypted data (IV needed for decryption)
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Parse CSV line handling quoted fields
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Map network names from CSV to database format
 */
function mapNetwork(network) {
  const mapping = {
    'Bitcoin': 'BTC',
    'Ethereum': 'ETH',
    'Ethereum (ERC-20)': 'ETH',
    'BNB Chain': 'BNB',
    'BNB Chain (BEP-20)': 'BNB',
    'Cardano': 'ADA',
    'Solana': 'SOL',
    'XRP Ledger': 'XRP',
    'Polkadot': 'DOT',
    'Dogecoin': 'DOGE',
    'Avalanche C-Chain': 'AVAX',
    'Polygon': 'MATIC',
    'Litecoin': 'LTC',
    'Stellar': 'XLM'
  };
  
  return mapping[network] || network;
}

async function main() {
  console.log('🚀 Starting Hot Wallet Import...\n');
  
  // Read CSV file
  const csvPath = path.join(__dirname, '../upload/BitChange_Hot_Wallets_CONFIDENTIAL.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV file not found:', csvPath);
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  // Parse CSV (skip header)
  const wallets = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    
    if (fields.length < 6) continue; // Skip invalid lines
    
    const [symbol, name, network, type, address, privateKey, mnemonic, publicKey, note] = fields;
    
    if (!symbol || !address) continue;
    
    wallets.push({
      symbol: symbol.replace(/"/g, ''),
      name: name.replace(/"/g, ''),
      network: mapNetwork(network.replace(/"/g, '')),
      type: type.replace(/"/g, ''),
      address: address.replace(/"/g, ''),
      privateKey: privateKey.replace(/"/g, ''),
      mnemonic: mnemonic.replace(/"/g, ''),
      note: note ? note.replace(/"/g, '') : ''
    });
  }
  
  console.log(`📄 Parsed ${wallets.length} wallets from CSV\n`);
  
  // Connect to database
  const connection = await createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'bitchange',
    password: process.env.DB_PASSWORD || 'changeThisPassword',
    database: process.env.DB_NAME || 'bitchange_pro'
  });
  
  console.log('✅ Connected to database\n');
  
  // Check if masterWallets table exists
  const [tables] = await connection.query(
    "SHOW TABLES LIKE 'masterWallets'"
  );
  
  if (tables.length === 0) {
    console.log('📋 Creating masterWallets table...');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS masterWallets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        network VARCHAR(50) NOT NULL UNIQUE,
        asset VARCHAR(20) NOT NULL,
        address VARCHAR(255) NOT NULL,
        encryptedPrivateKey TEXT NOT NULL,
        encryptedMnemonic TEXT,
        derivationPath VARCHAR(100),
        balance DECIMAL(20, 8) DEFAULT 0 NOT NULL,
        isActive BOOLEAN DEFAULT TRUE NOT NULL,
        lastSyncedAt TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_network (network),
        INDEX idx_asset (asset)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ masterWallets table created\n');
  }
  
  // Import wallets
  let imported = 0;
  let skipped = 0;
  
  for (const wallet of wallets) {
    try {
      // Encrypt sensitive data
      const encryptedPrivateKey = encrypt(wallet.privateKey);
      const encryptedMnemonic = wallet.mnemonic ? encrypt(wallet.mnemonic) : null;
      
      // Check if wallet already exists
      const [existing] = await connection.query(
        'SELECT id FROM masterWallets WHERE network = ?',
        [wallet.network]
      );
      
      if (existing.length > 0) {
        console.log(`⏭️  Skipped ${wallet.symbol} (${wallet.network}) - already exists`);
        skipped++;
        continue;
      }
      
      // Insert wallet
      await connection.query(
        `INSERT INTO masterWallets 
         (network, asset, address, encryptedPrivateKey, encryptedMnemonic, isActive) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          wallet.network,
          wallet.symbol,
          wallet.address,
          encryptedPrivateKey,
          encryptedMnemonic,
          true
        ]
      );
      
      console.log(`✅ Imported ${wallet.symbol} (${wallet.network})`);
      console.log(`   Address: ${wallet.address}`);
      if (wallet.note) {
        console.log(`   Note: ${wallet.note}`);
      }
      console.log('');
      
      imported++;
      
    } catch (error) {
      console.error(`❌ Error importing ${wallet.symbol}:`, error.message);
    }
  }
  
  // Summary
  console.log('\n📊 Import Summary:');
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📝 Total: ${wallets.length}`);
  
  // Verify import
  const [result] = await connection.query(
    'SELECT network, asset, address, isActive FROM masterWallets ORDER BY network'
  );
  
  console.log('\n🔍 Verification - Wallets in Database:');
  console.log('─'.repeat(80));
  console.log('Network'.padEnd(15), 'Asset'.padEnd(10), 'Address'.padEnd(45), 'Active');
  console.log('─'.repeat(80));
  
  for (const row of result) {
    const addressShort = row.address.substring(0, 20) + '...' + row.address.substring(row.address.length - 10);
    console.log(
      row.network.padEnd(15),
      row.asset.padEnd(10),
      addressShort.padEnd(45),
      row.isActive ? '✅' : '❌'
    );
  }
  
  console.log('─'.repeat(80));
  console.log(`\n✅ Total active wallets: ${result.filter(r => r.isActive).length}`);
  
  await connection.end();
  
  console.log('\n🎉 Hot Wallet Import Complete!');
  console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
  console.log('1. Save WALLET_ENCRYPTION_KEY in .env file');
  console.log('2. Backup the encryption key securely (offline storage)');
  console.log('3. Delete or encrypt the CSV file after import');
  console.log('4. These wallets will be used by ALL users for deposits');
  console.log('5. Monitor blockchain for incoming transactions');
}

main().catch(console.error);
