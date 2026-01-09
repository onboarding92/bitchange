/**
 * Hot Wallet Manager
 * 
 * Manages centralized hot wallets for deposits.
 * Each cryptocurrency has ONE wallet address that all users deposit to.
 * Users are identified by a unique reference ID.
 */

import { getDb } from "./db";
import { hotWallets } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { createDecipheriv, scryptSync } from "crypto";

const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-encryption-key-change-me';
const ALGORITHM = 'aes-256-cbc';

/**
 * Decrypt encrypted data
 */
function decrypt(encryptedData: string): string {
  const [ivHex, encrypted] = encryptedData.split(':');
  const key = scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generate unique reference ID for user deposit
 * Format: BTCPRO-{userId}-{timestamp}-{random}
 */
export function generateReferenceId(userId: number, asset: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${asset.toUpperCase()}-${userId}-${timestamp}-${random}`;
}

/**
 * Get hot wallet address for a cryptocurrency/network
 */
export async function getHotWalletAddress(asset: string, network: string): Promise<{
  address: string;
  symbol: string;
  name: string;
  network: string;
  type: string;
  referenceId?: string;
} | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Find hot wallet for this asset/network
  const [wallet] = await db
    .select()
    .from(hotWallets)
    .where(
      and(
        eq(hotWallets.symbol, asset.toUpperCase()),
        eq(hotWallets.network, network),
        eq(hotWallets.isActive, true)
      )
    )
    .limit(1);
  
  if (!wallet) {
    // Try to find by symbol only (for networks with same address)
    const [fallbackWallet] = await db
      .select()
      .from(hotWallets)
      .where(
        and(
          eq(hotWallets.symbol, asset.toUpperCase()),
          eq(hotWallets.isActive, true)
        )
      )
      .limit(1);
    
    if (!fallbackWallet) return null;
    
    return {
      address: fallbackWallet.address,
      symbol: fallbackWallet.symbol,
      name: fallbackWallet.name,
      network: fallbackWallet.network,
      type: fallbackWallet.type,
    };
  }
  
  return {
    address: wallet.address,
    symbol: wallet.symbol,
    name: wallet.name,
    network: wallet.network,
    type: wallet.type,
  };
}

/**
 * Get all active hot wallets
 */
export async function getAllHotWallets() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      id: hotWallets.id,
      symbol: hotWallets.symbol,
      name: hotWallets.name,
      network: hotWallets.network,
      type: hotWallets.type,
      address: hotWallets.address,
      balance: hotWallets.balance,
      lastBalanceCheck: hotWallets.lastBalanceCheck,
      isActive: hotWallets.isActive,
    })
    .from(hotWallets)
    .where(eq(hotWallets.isActive, true));
}

/**
 * Get private key for a hot wallet (ADMIN ONLY - USE WITH CAUTION!)
 */
export async function getHotWalletPrivateKey(walletId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  
  const [wallet] = await db
    .select()
    .from(hotWallets)
    .where(eq(hotWallets.id, walletId))
    .limit(1);
  
  if (!wallet || !wallet.privateKeyEncrypted) return null;
  
  try {
    return decrypt(wallet.privateKeyEncrypted);
  } catch (error) {
    console.error('[HotWallet] Failed to decrypt private key:', error);
    return null;
  }
}

/**
 * Update hot wallet balance (called by blockchain monitoring service)
 */
export async function updateHotWalletBalance(walletId: number, balance: string) {
  const db = await getDb();
  if (!db) return false;
  
  await db
    .update(hotWallets)
    .set({
      balance,
      lastBalanceCheck: new Date(),
    })
    .where(eq(hotWallets.id, walletId));
  
  return true;
}

/**
 * Check if a reference ID is valid and belongs to a user
 */
export function parseReferenceId(referenceId: string): {
  asset: string;
  userId: number;
  timestamp: string;
  random: string;
} | null {
  // Format: ASSET-userId-timestamp-random
  const parts = referenceId.split('-');
  if (parts.length !== 4) return null;
  
  const [asset, userIdStr, timestamp, random] = parts;
  const userId = parseInt(userIdStr, 10);
  
  if (isNaN(userId)) return null;
  
  return {
    asset,
    userId,
    timestamp,
    random,
  };
}
