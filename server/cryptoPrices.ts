import { getDb } from "./db";
import { cryptoPrices } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export interface CryptoPrice {
  symbol: string;
  price: string | number;
  change24h?: string | number;
  volume24h?: string | number;
  marketCap?: string | number;
  lastUpdated: Date;
}

/**
 * Get the latest price for a cryptocurrency
 * @param symbol Cryptocurrency symbol (e.g., "BTC", "ETH")
 * @returns Price data or null if not found
 */
export async function getCryptoPrice(symbol: string): Promise<CryptoPrice | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(cryptoPrices)
      .where(eq(cryptoPrices.symbol, symbol))
      .orderBy(desc(cryptoPrices.lastUpdated))
      .limit(1);

    if (result.length === 0) return null;

    const priceData = result[0];
    return {
      symbol: priceData.symbol,
      price: priceData.price,
      change24h: priceData.change24h,
      volume24h: priceData.volume24h,
      marketCap: priceData.marketCap,
      lastUpdated: priceData.lastUpdated,
    };
  } catch (error) {
    console.error(`Error fetching crypto price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get prices for multiple cryptocurrencies
 * @param symbols Array of cryptocurrency symbols
 * @returns Map of symbol to price data
 */
export async function getCryptoPrices(symbols: string[]): Promise<Map<string, CryptoPrice>> {
  const db = await getDb();
  const pricesMap = new Map<string, CryptoPrice>();
  
  if (!db) return pricesMap;

  try {
    for (const symbol of symbols) {
      const price = await getCryptoPrice(symbol);
      if (price) {
        pricesMap.set(symbol, price);
      }
    }
  } catch (error) {
    console.error("Error fetching crypto prices:", error);
  }

  return pricesMap;
}
