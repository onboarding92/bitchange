import { getDb } from "./db";
import { stakingPositions, stakingPlans, users } from "../drizzle/schema";
import { eq, and, lte, gte } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { sendEmail } from "./email";

/**
 * Staking Notification Job
 * Monitors staking positions and sends notifications for:
 * - Position maturity (lock period ended)
 * - High APR opportunities (APR > 15%)
 * - Large rewards accumulated (> $100 equivalent)
 * 
 * Runs every hour to check for notification triggers
 */

const HIGH_APR_THRESHOLD = 15; // APR percentage threshold for alerts
const LARGE_REWARD_THRESHOLD = 100; // USD equivalent threshold

// Track last notification times to avoid spam
const lastNotifications = new Map<string, number>();
const NOTIFICATION_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

function canSendNotification(key: string): boolean {
  const last = lastNotifications.get(key);
  if (!last) return true;
  return Date.now() - last > NOTIFICATION_COOLDOWN;
}

function markNotificationSent(key: string) {
  lastNotifications.set(key, Date.now());
}

export async function checkStakingNotifications() {
  console.log("[StakingNotificationJob] Starting notification check...");
  
  const db = await getDb();
  if (!db) {
    console.error("[StakingNotificationJob] Database not available");
    return;
  }

  try {
    const now = new Date();
    
    // Check for matured positions (within next 24 hours)
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const maturingPositions = await db.select({
      position: stakingPositions,
      plan: stakingPlans,
      user: users,
    })
      .from(stakingPositions)
      .innerJoin(stakingPlans, eq(stakingPositions.planId, stakingPlans.id))
      .innerJoin(users, eq(stakingPositions.userId, users.id))
      .where(
        and(
          eq(stakingPositions.status, "active"),
          lte(stakingPositions.maturesAt, tomorrow),
          gte(stakingPositions.maturesAt, now)
        )
      );

    for (const { position, plan, user } of maturingPositions) {
      const key = `maturity-${position.id}`;
      if (canSendNotification(key)) {
        try {
          // Send email to user
          await sendEmail({
            to: user.email,
            subject: `Your ${plan.asset} Staking Position is Maturing`,
            text: `Your ${plan.asset} staking position is maturing. Amount: ${position.amount} ${plan.asset}, Rewards: ${position.rewards} ${plan.asset}`,
            html: `
              <h2>Staking Position Maturity Alert</h2>
              <p>Your staking position is about to mature!</p>
              <ul>
                <li><strong>Asset:</strong> ${plan.asset}</li>
                <li><strong>Amount:</strong> ${position.amount} ${plan.asset}</li>
                <li><strong>Rewards:</strong> ${position.rewards} ${plan.asset}</li>
                <li><strong>Maturity Date:</strong> ${position.maturesAt?.toLocaleString()}</li>
              </ul>
              <p>You can now withdraw your staked amount plus rewards without penalty.</p>
            `,
          });

          // Notify admin
          await notifyOwner({
            title: "Staking Position Maturing",
            content: `User ${user.email} has a ${plan.asset} position maturing: ${position.amount} ${plan.asset} + ${position.rewards} rewards`,
          });

          markNotificationSent(key);
          console.log(`[StakingNotificationJob] Sent maturity notification for position ${position.id}`);
        } catch (error: any) {
          console.error(`[StakingNotificationJob] Error sending maturity notification:`, error.message);
        }
      }
    }

    // Check for high APR opportunities
    const highAprPlans = await db.select()
      .from(stakingPlans)
      .where(
        and(
          eq(stakingPlans.enabled, true),
          gte(stakingPlans.apr, HIGH_APR_THRESHOLD.toString())
        )
      );

    if (highAprPlans.length > 0) {
      const key = `high-apr-${new Date().toDateString()}`;
      if (canSendNotification(key)) {
        try {
          const planList = highAprPlans.map(p => `${p.name}: ${p.apr}% APR`).join(", ");
          
          await notifyOwner({
            title: "High APR Staking Opportunities Available",
            content: `${highAprPlans.length} plans with APR > ${HIGH_APR_THRESHOLD}%: ${planList}`,
          });

          markNotificationSent(key);
          console.log(`[StakingNotificationJob] Sent high APR alert for ${highAprPlans.length} plans`);
        } catch (error: any) {
          console.error(`[StakingNotificationJob] Error sending high APR notification:`, error.message);
        }
      }
    }

    // Check for large accumulated rewards
    const positionsWithLargeRewards = await db.select({
      position: stakingPositions,
      plan: stakingPlans,
      user: users,
    })
      .from(stakingPositions)
      .innerJoin(stakingPlans, eq(stakingPositions.planId, stakingPlans.id))
      .innerJoin(users, eq(stakingPositions.userId, users.id))
      .where(eq(stakingPositions.status, "active"));

    for (const { position, plan, user } of positionsWithLargeRewards) {
      const rewardAmount = parseFloat(position.rewards);
      // Simplified: assume 1 BTC = $50k, 1 ETH = $3k, stablecoins = $1
      let usdValue = 0;
      if (plan.asset === "BTC") usdValue = rewardAmount * 50000;
      else if (plan.asset === "ETH") usdValue = rewardAmount * 3000;
      else usdValue = rewardAmount; // Stablecoins

      if (usdValue >= LARGE_REWARD_THRESHOLD) {
        const key = `large-reward-${position.id}`;
        if (canSendNotification(key)) {
          try {
            await sendEmail({
              to: user.email,
              subject: `Large Rewards Accumulated: ${position.rewards} ${plan.asset}`,
              text: `You have accumulated ${position.rewards} ${plan.asset} in rewards (~$${usdValue.toFixed(2)})`,
              html: `
                <h2>Staking Rewards Alert</h2>
                <p>You have accumulated significant rewards in your staking position!</p>
                <ul>
                  <li><strong>Asset:</strong> ${plan.asset}</li>
                  <li><strong>Staked Amount:</strong> ${position.amount} ${plan.asset}</li>
                  <li><strong>Accumulated Rewards:</strong> ${position.rewards} ${plan.asset}</li>
                  <li><strong>Estimated Value:</strong> ~$${usdValue.toFixed(2)}</li>
                </ul>
                <p>Consider withdrawing or compounding your rewards.</p>
              `,
            });

            markNotificationSent(key);
            console.log(`[StakingNotificationJob] Sent large reward notification for position ${position.id}`);
          } catch (error: any) {
            console.error(`[StakingNotificationJob] Error sending large reward notification:`, error.message);
          }
        }
      }
    }

    console.log(`[StakingNotificationJob] Notification check completed`);
  } catch (error: any) {
    console.error("[StakingNotificationJob] Error checking notifications:", error.message);
  }
}

// Start the job (runs every hour)
let notificationInterval: NodeJS.Timeout | null = null;

export function startStakingNotificationJob() {
  if (notificationInterval) {
    console.log("[StakingNotificationJob] Job already running");
    return;
  }

  console.log("[StakingNotificationJob] Starting staking notification job (every hour)");
  
  // Run immediately on start
  checkStakingNotifications();
  
  // Then run every hour
  notificationInterval = setInterval(checkStakingNotifications, 60 * 60 * 1000);
}

export function stopStakingNotificationJob() {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
    console.log("[StakingNotificationJob] Staking notification job stopped");
  }
}
