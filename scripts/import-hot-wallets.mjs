#!/usr/bin/env node

/**
 * Import Hot Wallets to Database
 * 
 * This script reads the generated CSV and imports hot wallets into the database.
 * Private keys are encrypted using AES-256 before storage.
 */

import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { createCipheriv, randomBytes, scryptSync } from 'crypto';
import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env') });

// Encryption configuration
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-encryption-key-change-me';
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt data using AES-256-CBC
 */
function encrypt(text) {
  if (!text) return null;
  
  const key = scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return IV + encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Parse CSV and import wallets
 */
async function importWallets() {
  console.log('🔐 BitChange Pro - Hot Wallet Importer\n');
  
  // Connect to database
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('✓ Connected to database');
  
  // Read CSV file
  const csvPath = join(__dirname, '../BitChange_Hot_Wallets_CONFIDENTIAL.csv');
  const wallets = [];
  
  const parser = createReadStream(csvPath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
    })
  );
  
  for await (const record of parser) {
    wallets.push(record);
  }
  
  console.log(`✓ Loaded ${wallets.length} wallets from CSV\n`);
  
  // Import each wallet
  let imported = 0;
  let skipped = 0;
  
  for (const wallet of wallets) {
    try {
      // Skip if already exists
      const [existing] = await connection.execute(
        'SELECT id FROM hotWallets WHERE symbol = ? AND network = ?',
        [wallet.Symbol, wallet.Network]
      );
      
      if (existing.length > 0) {
        console.log(`⊘ Skipped ${wallet.Symbol} (${wallet.Network}) - already exists`);
        skipped++;
        continue;
      }
      
      // Encrypt sensitive data
      const privateKeyEncrypted = encrypt(wallet['Private Key']);
      const mnemonicEncrypted = wallet.Mnemonic ? encrypt(wallet.Mnemonic) : null;
      
      // Insert wallet
      await connection.execute(
        `INSERT INTO hotWallets 
        (symbol, name, network, type, address, privateKeyEncrypted, mnemonic, publicKey, isActive, balance)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          wallet.Symbol,
          wallet.Name,
          wallet.Network,
          wallet.Type,
          wallet.Address,
          privateKeyEncrypted,
          mnemonicEncrypted,
          wallet['Public Key'] || null,
          true,
          0
        ]
      );
      
      console.log(`✓ Imported ${wallet.Symbol} (${wallet.Network}): ${wallet.Address}`);
      imported++;
    } catch (error) {
      console.error(`✗ Failed to import ${wallet.Symbol} (${wallet.Network}):`, error.message);
    }
  }
  
  await connection.end();
  
  console.log('\n✅ Import completed!\n');
  console.log(`📊 SUMMARY:\n`);
  console.log(`  Total wallets in CSV: ${wallets.length}`);
  console.log(`  Successfully imported: ${imported}`);
  console.log(`  Skipped (already exist): ${skipped}`);
  console.log(`  Failed: ${wallets.length - imported - skipped}\n`);
  
  console.log('🔐 SECURITY NOTES:\n');
  console.log('  ✓ Private keys encrypted with AES-256-CBC');
  console.log('  ✓ Encryption key from JWT_SECRET environment variable');
  console.log('  ✓ Each encrypted value has unique IV (Initialization Vector)');
  console.log('  ⚠️  Keep JWT_SECRET safe - losing it means losing access to wallets!\n');
}

// Run import
importWallets().catch(console.error);
