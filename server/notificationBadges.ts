// Notification badge counts for admin menu
import { getDb } from "./db";
import { supportTickets, kycDocuments } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

export async function getNotificationBadges() {
  const db = await getDb();
  if (!db) return { pendingTickets: 0, pendingKyc: 0 };

  // Count pending support tickets (open or in_progress status)
  const [ticketCount] = await db.select({ count: sql<number>`count(*)` })
    .from(supportTickets)
    .where(sql`${supportTickets.status} IN ('open', 'in_progress')`);

  // Count pending KYC submissions
  const [kycCount] = await db.select({ count: sql<number>`count(*)` })
    .from(kycDocuments)
    .where(eq(kycDocuments.status, "pending"));

  return {
    pendingTickets: ticketCount?.count ?? 0,
    pendingKyc: kycCount?.count ?? 0,
  };
}
