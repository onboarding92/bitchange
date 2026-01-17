import axios from "axios";
import { getDb } from "./db";
import { cryptoPrices } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Crypto Prices Module (Database-backed)
 * Reads prices from database instead of calling external APIs
 * Prices are kept fresh by priceSyncJob.ts running every 2 minutes
 */

interface PriceData {
  asset: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  lastUpdated: number;
}

/**
 * Ottiene il prezzo corrente di un asset dal database
 */
export async function getCryptoPrice(asset: string): Promise<PriceData | null> {
  const db = await getDb();
  if (!db) {
    console.error("[CryptoPrices] Database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(cryptoPrices)
      .where(eq(cryptoPrices.asset, asset))
      .orderBy(desc(cryptoPrices.lastUpdated))
      .limit(1);

    if (result.length === 0) {
      console.warn(`[CryptoPrices] No price data for ${asset} in database`);
      return null;
    }

    const data = result[0];
    
    return {
      asset: data.asset,
      price: parseFloat(data.price),
      change24h: parseFloat(data.change24h),
      volume24h: parseFloat(data.volume24h),
      high24h: parseFloat(data.high24h),
      low24h: parseFloat(data.low24h),
      lastUpdated: data.lastUpdated.getTime(),
    };
  } catch (error: any) {
    console.error(`[CryptoPrices] Error fetching price for ${asset}:`, error.message);
    return null;
  }
}

/**
 * Ottiene i prezzi di tutti gli asset supportati dal database
 */
export async function getAllCryptoPrices(): Promise<PriceData[]> {
  const db = await getDb();
  if (!db) {
    console.error("[CryptoPrices] Database not available");
    return [];
  }

  try {
    const results = await db.select().from(cryptoPrices);

    return results.map((data) => ({
      asset: data.asset,
      price: parseFloat(data.price),
      change24h: parseFloat(data.change24h),
      volume24h: parseFloat(data.volume24h),
      high24h: parseFloat(data.high24h),
      low24h: parseFloat(data.low24h),
      lastUpdated: data.lastUpdated.getTime(),
    }));
  } catch (error: any) {
    console.error("[CryptoPrices] Error fetching all prices:", error.message);
    return [];
  }
}

/**
 * Ottiene il prezzo di un trading pair (es. BTC/USDT)
 */
export async function getPairPrice(pair: string): Promise<number> {
  const [base, quote] = pair.split("/");
  
  if (quote === "USDT" || quote === "USD") {
    const priceData = await getCryptoPrice(base);
    return priceData?.price || 0;
  }

  // Per altri pair, calcola il rapporto
  const basePrice = await getCryptoPrice(base);
  const quotePrice = await getCryptoPrice(quote);

  if (!basePrice || !quotePrice || quotePrice.price === 0) {
    return 0;
  }

  return basePrice.price / quotePrice.price;
}

/**
 * Pulisce la cache (no-op, kept for compatibility)
 */
export function clearPriceCache() {
  // No longer needed, prices are in database
  console.log("[CryptoPrices] clearPriceCache called (no-op)");
}
