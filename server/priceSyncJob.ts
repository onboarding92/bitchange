import axios from "axios";
import { getDb } from "./db";
import { cryptoPrices } from "../drizzle/schema";
import { eq, and, lt } from "drizzle-orm";

/**
 * Price Sync Job
 * Fetches crypto prices from CoinGecko API and stores them in database
 * Runs every 2 minutes to keep prices fresh
 * Keeps historical data for 30 days
 */

const COINGECKO_API = "https://api.coingecko.com/api/v3";
const RETENTION_DAYS = 30; // Keep 30 days of historical data

const ASSET_TO_COINGECKO: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  BNB: "binancecoin",
  ADA: "cardano",
  SOL: "solana",
  XRP: "ripple",
  DOT: "polkadot",
  DOGE: "dogecoin",
  AVAX: "avalanche-2",
  SHIB: "shiba-inu",
  MATIC: "matic-network",
  LTC: "litecoin",
  LINK: "chainlink",
  XLM: "stellar",
};

export async function syncCryptoPrices() {
  console.log("[PriceSyncJob] Starting price sync...");
  
  const db = await getDb();
  if (!db) {
    console.error("[PriceSyncJob] Database not available");
    return;
  }

  try {
    // Get all coin IDs
    const coinIds = Object.values(ASSET_TO_COINGECKO).join(",");
    
    // Fetch all prices from CoinGecko in one batch call
    const response = await axios.get(`${COINGECKO_API}/simple/price`, {
      params: {
        ids: coinIds,
        vs_currencies: "usd",
        include_24hr_vol: true,
        include_24hr_change: true,
      },
      timeout: 10000,
    });

    const coinGeckoPrices = response.data;

    let successCount = 0;
    let errorCount = 0;

    // Insert new price records for each asset (keep historical data)
    for (const [asset, coinId] of Object.entries(ASSET_TO_COINGECKO)) {
      try {
        const data = coinGeckoPrices[coinId];
        
        if (!data) {
          console.warn(`[PriceSyncJob] No data for ${asset} (${coinId})`);
          errorCount++;
          continue;
        }

        const currentPrice = data.usd || 0;
        const price = currentPrice.toFixed(8);
        const change24h = (data.usd_24h_change || 0).toFixed(2);
        const volume24h = (data.usd_24h_vol || 0).toFixed(2);
        
        // CoinGecko doesn't provide high/low in simple/price endpoint
        // Use current price as approximation
        const high24h = price;
        const low24h = price;

        // Always insert new record (keep historical data)
        await db.insert(cryptoPrices).values({
          asset,
          price,
          change24h,
          volume24h,
          high24h,
          low24h,
          lastUpdated: new Date(),
        });

        successCount++;
      } catch (error: any) {
        console.error(`[PriceSyncJob] Error updating ${asset}:`, error.message);
        errorCount++;
      }
    }

    console.log(`[PriceSyncJob] Sync completed: ${successCount} success, ${errorCount} errors`);
    
    // Clean up old data (older than RETENTION_DAYS)
    await cleanupOldPrices();
  } catch (error: any) {
    console.error("[PriceSyncJob] Error fetching prices from CoinGecko:", error.message);
  }
}

/**
 * Clean up price records older than RETENTION_DAYS
 */
async function cleanupOldPrices() {
  try {
    const db = await getDb();
    if (!db) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    await db
      .delete(cryptoPrices)
      .where(lt(cryptoPrices.lastUpdated, cutoffDate));

     console.log(`[PriceSyncJob] Cleaned up old price records (older than ${RETENTION_DAYS} days)`);
  } catch (error: any) {
    console.error("[PriceSyncJob] Error cleaning up old prices:", error.message);
  }
}

// Start the job (runs every 2 minutes)
let syncInterval: NodeJS.Timeout | null = null;

export function startPriceSyncJob() {
  if (syncInterval) {
    console.log("[PriceSyncJob] Job already running");
    return;
  }

  console.log("[PriceSyncJob] Starting price sync job (every 5 minutes)");
  
  // Run immediately on start
  syncCryptoPrices();
  
  // Then run every 5 minutes (reduced from 2min to avoid rate limiting)
  syncInterval = setInterval(syncCryptoPrices, 5 * 60 * 1000);
}

export function stopPriceSyncJob() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log("[PriceSyncJob] Price sync job stopped");
  }
}
