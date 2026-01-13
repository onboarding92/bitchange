import { getDb } from "./db";
import { priceAlerts, cryptoPrices } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

/**
 * Price Alert Job
 * Checks active price alerts and triggers notifications when conditions are met
 * Runs every 30 seconds
 */

export async function checkPriceAlerts() {
  console.log("[PriceAlertJob] Checking price alerts...");
  
  const db = await getDb();
  if (!db) {
    console.error("[PriceAlertJob] Database not available");
    return;
  }

  try {
    // Get all active alerts
    const activeAlerts = await db
      .select()
      .from(priceAlerts)
      .where(and(
        eq(priceAlerts.isActive, true),
        eq(priceAlerts.notificationSent, false)
      ));

    if (activeAlerts.length === 0) {
      console.log("[PriceAlertJob] No active alerts to check");
      return;
    }

    let triggeredCount = 0;

    // Check each alert
    for (const alert of activeAlerts) {
      try {
        // Get latest price for this asset
        const latestPrice = await db
          .select()
          .from(cryptoPrices)
          .where(eq(cryptoPrices.asset, alert.asset))
          .orderBy(desc(cryptoPrices.lastUpdated))
          .limit(1);

        if (latestPrice.length === 0) {
          console.warn(`[PriceAlertJob] No price data for ${alert.asset}`);
          continue;
        }

        const currentPrice = parseFloat(latestPrice[0].price);
        const targetPrice = parseFloat(String(alert.targetPrice));

        let shouldTrigger = false;

        // Check if alert condition is met
        if (alert.condition === "above" && currentPrice >= targetPrice) {
          shouldTrigger = true;
        } else if (alert.condition === "below" && currentPrice <= targetPrice) {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          // Update alert status
          await db
            .update(priceAlerts)
            .set({
              triggeredAt: new Date(),
              notificationSent: true,
              isActive: false, // Deactivate alert after triggering
            })
            .where(eq(priceAlerts.id, alert.id));

          // Send notification to user (owner notification as fallback)
          const conditionText = alert.condition === "above" ? "above" : "below";
          await notifyOwner({
            title: `Price Alert Triggered: ${alert.asset}`,
            content: `${alert.asset} price is now ${conditionText} $${targetPrice.toFixed(2)}. Current price: $${currentPrice.toFixed(2)}`,
          });

          triggeredCount++;
          console.log(`[PriceAlertJob] Alert triggered for ${alert.asset}: ${conditionText} $${targetPrice.toFixed(2)}`);
        }
      } catch (error: any) {
        console.error(`[PriceAlertJob] Error checking alert ${alert.id}:`, error.message);
      }
    }

    console.log(`[PriceAlertJob] Check completed: ${triggeredCount} alerts triggered, ${activeAlerts.length - triggeredCount} still active`);
  } catch (error: any) {
    console.error("[PriceAlertJob] Error checking alerts:", error.message);
  }
}

// Start the job (runs every 30 seconds)
let alertInterval: NodeJS.Timeout | null = null;

export function startPriceAlertJob() {
  if (alertInterval) {
    console.log("[PriceAlertJob] Job already running");
    return;
  }

  console.log("[PriceAlertJob] Starting price alert job (every 30 seconds)");
  
  // Run immediately on start
  checkPriceAlerts();
  
  // Then run every 30 seconds
  alertInterval = setInterval(checkPriceAlerts, 30 * 1000);
}

export function stopPriceAlertJob() {
  if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
    console.log("[PriceAlertJob] Price alert job stopped");
  }
}
