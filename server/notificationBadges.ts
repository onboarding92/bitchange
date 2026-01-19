import * as db from "./db";

export interface NotificationBadges {
  pendingTickets: number;
  pendingKyc: number;
}

export async function getNotificationBadges(): Promise<NotificationBadges> {
  try {
    const [pendingTickets, pendingKyc] = await Promise.all([
      db.countPendingTickets(),
      db.countPendingKyc(),
    ]);

    return {
      pendingTickets,
      pendingKyc,
    };
  } catch (error) {
    console.error("[getNotificationBadges] Error:", error);
    // Return zero counts on error to prevent crashes
    return {
      pendingTickets: 0,
      pendingKyc: 0,
    };
  }
}
