import * as db from "./db";

export interface NotificationBadges {
  pendingTickets: number;
  pendingKyc: number;
  pendingWithdrawals: number;
}

export async function getNotificationBadges(): Promise<NotificationBadges> {
  try {
    const [pendingTickets, pendingKyc, pendingWithdrawals] = await Promise.all([
      db.countPendingTickets(),
      db.countPendingKyc(),
      db.countPendingWithdrawals(),
    ]);

    return {
      pendingTickets,
      pendingKyc,
      pendingWithdrawals,
    };
  } catch (error) {
    console.error("[getNotificationBadges] Error:", error);
    // Return zero counts on error to prevent crashes
    return {
      pendingTickets: 0,
      pendingKyc: 0,
      pendingWithdrawals: 0,
    };
  }
}
