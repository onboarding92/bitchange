import { getDb } from "./db";
import { stakingPositions, stakingPlans, stakingRewardsHistory } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Staking Rewards Distribution Job
 * Calculates and distributes daily rewards to all active staking positions
 * Runs every 24 hours (daily at midnight)
 * Formula: dailyReward = stakedAmount × (APR / 100) / 365
 */

export async function distributeStakingRewards() {
  console.log("[StakingRewardsJob] Starting rewards distribution...");
  
  const db = await getDb();
  if (!db) {
    console.error("[StakingRewardsJob] Database not available");
    return;
  }

  try {
    // Get all active staking positions
    const activePositions = await db
      .select()
      .from(stakingPositions)
      .where(eq(stakingPositions.status, "active"));

    if (activePositions.length === 0) {
      console.log("[StakingRewardsJob] No active positions to process");
      return;
    }

    console.log(`[StakingRewardsJob] Processing ${activePositions.length} active positions...`);

    let successCount = 0;
    let errorCount = 0;

    for (const position of activePositions) {
      try {
        // Get the staking plan to get APR
        const plan = await db
          .select()
          .from(stakingPlans)
          .where(eq(stakingPlans.id, position.planId))
          .limit(1);

        if (!plan || plan.length === 0) {
          console.warn(`[StakingRewardsJob] Plan not found for position ${position.id}`);
          errorCount++;
          continue;
        }

        const apr = parseFloat(plan[0].apr);
        const stakedAmount = parseFloat(position.amount);

        // Calculate daily reward: amount × (APR / 100) / 365
        const dailyReward = (stakedAmount * (apr / 100)) / 365;

        // Check if auto-compound is enabled
        if (position.autoCompound) {
          // Auto-compound: add reward to staked amount
          const newAmount = stakedAmount + dailyReward;
          await db
            .update(stakingPositions)
            .set({
              amount: newAmount.toFixed(8),
            })
            .where(eq(stakingPositions.id, position.id));
          
          console.log(
            `[StakingRewardsJob] Position ${position.id} (AUTO-COMPOUND): +${dailyReward.toFixed(8)} ${plan[0].asset} → new amount: ${newAmount.toFixed(8)}`
          );
        } else {
          // Regular: accumulate rewards separately
          const currentReward = parseFloat(position.rewards || "0");
          const newReward = currentReward + dailyReward;

          await db
            .update(stakingPositions)
            .set({
              rewards: newReward.toFixed(8),
            })
            .where(eq(stakingPositions.id, position.id));
          
          console.log(
            `[StakingRewardsJob] Position ${position.id}: +${dailyReward.toFixed(8)} ${plan[0].asset} (total rewards: ${newReward.toFixed(8)})`
          );
        }

        // Log reward distribution in history table
        await db.insert(stakingRewardsHistory).values({
          positionId: position.id,
          userId: position.userId,
          amount: dailyReward.toFixed(8),
          asset: plan[0].asset,
        });

        successCount++;
      } catch (error: any) {
        console.error(`[StakingRewardsJob] Error processing position ${position.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`[StakingRewardsJob] Distribution completed: ${successCount} success, ${errorCount} errors`);
  } catch (error: any) {
    console.error("[StakingRewardsJob] Error distributing rewards:", error.message);
  }
}

// Start the job (runs every 24 hours)
let rewardsInterval: NodeJS.Timeout | null = null;

export function startStakingRewardsJob() {
  if (rewardsInterval) {
    console.log("[StakingRewardsJob] Job already running");
    return;
  }

  console.log("[StakingRewardsJob] Starting staking rewards job (every 24 hours)");
  
  // Run immediately on start
  distributeStakingRewards();
  
  // Then run every 24 hours
  rewardsInterval = setInterval(distributeStakingRewards, 24 * 60 * 60 * 1000);
}

export function stopStakingRewardsJob() {
  if (rewardsInterval) {
    clearInterval(rewardsInterval);
    rewardsInterval = null;
    console.log("[StakingRewardsJob] Staking rewards job stopped");
  }
}
