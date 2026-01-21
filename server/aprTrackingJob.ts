import { getDb } from "./db";
import { stakingPlans, stakingAprHistory } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * APR Tracking Job
 * Records APR changes for all staking plans
 * Runs every 6 hours to build historical APR data for charts
 * Keeps all historical data for trend analysis
 */

export async function trackStakingApr() {
  console.log("[AprTrackingJob] Starting APR tracking...");
  
  const db = await getDb();
  if (!db) {
    console.error("[AprTrackingJob] Database not available");
    return;
  }

  try {
    // Get all enabled staking plans
    const plans = await db
      .select()
      .from(stakingPlans)
      .where(eq(stakingPlans.enabled, true));

    if (!plans || plans.length === 0) {
      console.log("[AprTrackingJob] No enabled staking plans found");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Record current APR for each plan
    for (const plan of plans) {
      try {
        await db.insert(stakingAprHistory).values({
          planId: plan.id,
          asset: plan.asset,
          apr: plan.apr,
          recordedAt: new Date(),
        });

        successCount++;
      } catch (error: any) {
        console.error(`[AprTrackingJob] Error tracking APR for plan ${plan.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`[AprTrackingJob] Tracking completed: ${successCount} success, ${errorCount} errors`);
  } catch (error: any) {
    console.error("[AprTrackingJob] Error tracking APR:", error.message);
  }
}

// Start the job (runs every 6 hours)
let trackingInterval: NodeJS.Timeout | null = null;

export function startAprTrackingJob() {
  if (trackingInterval) {
    console.log("[AprTrackingJob] Job already running");
    return;
  }

  console.log("[AprTrackingJob] Starting APR tracking job (every 6 hours)");
  
  // Run immediately on start
  trackStakingApr();
  
  // Then run every 6 hours
  trackingInterval = setInterval(trackStakingApr, 6 * 60 * 60 * 1000);
}

export function stopAprTrackingJob() {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
    console.log("[AprTrackingJob] APR tracking job stopped");
  }
}
