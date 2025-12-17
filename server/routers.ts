import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb, initializeUserWallets } from "./db";
import { wallets, orders, trades, stakingPlans, stakingPositions, deposits, withdrawals, kycDocuments, supportTickets, ticketReplies, promoCodes, promoUsage, transactions, users, systemLogs } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { storagePut } from "./storage";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  wallet: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      await initializeUserWallets(ctx.user.id);
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(wallets).where(eq(wallets.userId, ctx.user.id));
    }),
  }),
  admin: router({
    stats: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { totalUsers: 0, pendingWithdrawals: 0, pendingKyc: 0 };
      const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
      return { totalUsers: userCount?.count ?? 0, pendingWithdrawals: 0, pendingKyc: 0 };
    }),
  }),
});

export type AppRouter = typeof appRouter;
