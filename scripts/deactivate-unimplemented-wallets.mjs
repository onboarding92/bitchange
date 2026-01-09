#!/usr/bin/env node

/**
 * Deactivate Unimplemented Wallets
 * 
 * Marks ADA, SOL, XRP, DOT, XLM as inactive since they require
 * production-grade libraries not yet implemented.
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { eq, inArray } from 'drizzle-orm';
import * as schema from '../drizzle/schema.js';

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/bitchange';

async function main() {
  console.log('[Deactivate] Connecting to database...');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection, { schema, mode: 'default' });
  
  const unimplementedSymbols = ['ADA', 'SOL', 'XRP', 'DOT', 'XLM'];
  
  console.log(`[Deactivate] Marking ${unimplementedSymbols.join(', ')} as inactive...`);
  
  await db.update(schema.hotWallets)
    .set({ isActive: false })
    .where(inArray(schema.hotWallets.symbol, unimplementedSymbols));
  
  console.log('✅ Successfully marked as inactive');
  
  // Verify active wallets
  const activeWallets = await db
    .select()
    .from(schema.hotWallets)
    .where(eq(schema.hotWallets.isActive, true));
  
  console.log(`\n✅ Active wallets (${activeWallets.length}):`);
  activeWallets.forEach(w => {
    console.log(`   - ${w.symbol} (${w.name}) on ${w.network}`);
  });
  
  await connection.end();
  console.log('\n✅ Done!');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
