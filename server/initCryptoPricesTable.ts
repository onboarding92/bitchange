import { getDb } from "./db";
import { sql } from "drizzle-orm";

/**
 * Initialize cryptoPrices table if it doesn't exist
 * Run this once on server startup
 */
export async function initCryptoPricesTable() {
  const db = await getDb();
  if (!db) {
    console.error("[InitDB] Database not available");
    return false;
  }

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cryptoPrices (
        id int AUTO_INCREMENT NOT NULL,
        asset varchar(20) NOT NULL UNIQUE,
        price decimal(20, 8) NOT NULL,
        change24h decimal(10, 2) NOT NULL DEFAULT 0,
        volume24h decimal(30, 2) NOT NULL DEFAULT 0,
        high24h decimal(20, 8) NOT NULL DEFAULT 0,
        low24h decimal(20, 8) NOT NULL DEFAULT 0,
        lastUpdated timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT cryptoPrices_id PRIMARY KEY(id)
      )
    `);

    console.log("[InitDB] cryptoPrices table initialized successfully");
    return true;
  } catch (error: any) {
    console.error("[InitDB] Error initializing cryptoPrices table:", error.message);
    return false;
  }
}
