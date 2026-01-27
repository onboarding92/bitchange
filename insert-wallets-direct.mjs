#!/usr/bin/env node
import { readFileSync } from 'fs';
import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config();

const wallets = JSON.parse(readFileSync('/home/ubuntu/wallets_complete_2026-01-26T20-09-42.json', 'utf8'));

console.log('\n🔐 Inserting Encrypted Wallets into Database\n');
console.log(`Database: ${process.env.DATABASE_URL}\n`);

// Parse DATABASE_URL
const dbUrl = process.env.DATABASE_URL;
const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!match) {
  console.error('❌ Invalid DATABASE_URL format');
  process.exit(1);
}

const [, user, password, host, port, database] = match;

const connection = await createConnection({
  host,
  port: parseInt(port),
  user,
  password,
  database,
  ssl: { rejectUnauthorized: true }
});

console.log('✅ Connected to database\n');

// Clear existing
await connection.execute('DELETE FROM masterWallets');
console.log('🗑️  Cleared existing wallets\n');

// Read encrypted SQL and execute
const sql = readFileSync('/home/ubuntu/wallets_encrypted_insert.sql', 'utf8');
const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--') && !s.trim().startsWith('SELECT'));

for (const stmt of statements) {
  if (stmt.trim()) {
    try {
      await connection.execute(stmt);
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
    }
  }
}

console.log(`\n✅ Inserted ${wallets.length} wallets!\n`);

// Verify
const [rows] = await connection.execute(
  'SELECT network, asset, address, isActive FROM masterWallets ORDER BY network, asset'
);

console.log('📊 Verification:');
console.table(rows);

await connection.end();
console.log('\n✅ Done!\n');
