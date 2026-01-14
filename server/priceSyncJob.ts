import axios from "axios";
import { getDb } from "./db";
import { cryptoPrices } from "../drizzle/schema";
import { eq, and, lt } from "drizzle-orm";

/**
 * Price Sync Job
 * Fetches crypto prices from Binance API and stores them in database
 * Runs every 2 minutes to keep prices fresh
 * Keeps historical data for 30 days
 */

const BINANCE_API = "https://api.binance.com/api/v3";
const RETENTION_DAYS = 30; // Keep 30 days of historical data

const ASSET_TO_BINANCE: Record<string, string> = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  USDT: "USDT",
  BNB: "BNBUSDT",
  ADA: "ADAUSDT",
  SOL: "SOLUSDT",
  XRP: "XRPUSDT",
  DOT: "DOTUSDT",
  DOGE: "DOGEUSDT",
  AVAX: "AVAXUSDT",
  SHIB: "SHIBUSDT",
  MATIC: "MATICUSDT",
  LTC: "LTCUSDT",
  LINK: "LINKUSDT",
  XLM: "XLMUSDT",
};

export async function syncCryptoPrices() {
  console.log("[PriceSyncJob] Starting price sync...");
  
  const db = await getDb();
  if (!db) {
    console.error("[PriceSyncJob] Database not available");
    return;
  }

  try {
    // Fetch all prices from Binance in one batch call
    const response = await axios.get(`${BINANCE_API}/ticker/24hr`, {
      timeout: 10000,
    });

    const binancePrices = response.data;
    const priceMap = new Map(binancePrices.map((p: any) => [p.symbol, p]));

    let successCount = 0;
    let errorCount = 0;

    // Insert new price records for each asset (keep historical data)
    for (const [asset, symbol] of Object.entries(ASSET_TO_BINANCE)) {
      try {
        let price, change24h, volume24h, high24h, low24h;

        if (symbol === "USDT") {
          // USDT is always $1
          price = "1.00000000";
          change24h = "0.00";
          volume24h = "0.00";
          high24h = "1.00000000";
          low24h = "1.00000000";
        } else {
          const data: any = priceMap.get(symbol);
          if (!data) {
            console.warn(`[PriceSyncJob] No data for ${asset} (${symbol})`);
            errorCount++;
            continue;
          }

          const currentPrice = parseFloat(data.lastPrice);
          price = currentPrice.toFixed(8);
          change24h = parseFloat(data.priceChangePercent || "0").toFixed(2);
          volume24h = (parseFloat(data.volume || "0") * currentPrice).toFixed(2);
          high24h = parseFloat(data.highPrice || currentPrice.toString()).toFixed(8);
          low24h = parseFloat(data.lowPrice || currentPrice.toString()).toFixed(8);
        }

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
    console.error("[PriceSyncJob] Error fetching prices from Binance:", error.message);
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

  console.log("[PriceSyncJob] Starting price sync job (every 2 minutes)");
  
  // Run immediately on start
  syncCryptoPrices();
  
  // Then run every 2 minutes
  syncInterval = setInterval(syncCryptoPrices, 2 * 60 * 1000);
}

export function stopPriceSyncJob() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log("[PriceSyncJob] Price sync job stopped");
  }
}
