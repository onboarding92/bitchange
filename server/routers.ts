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

  trading: router({
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(orders)
        .where(eq(orders.userId, ctx.user.id))
        .orderBy(desc(orders.createdAt))
        .limit(100);
    }),

    myTrades: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(trades)
        .where(
          sql`${trades.buyerId} = ${ctx.user.id} OR ${trades.sellerId} = ${ctx.user.id}`
        )
        .orderBy(desc(trades.createdAt))
        .limit(100);
    }),

    placeLimitOrder: protectedProcedure
      .input(z.object({
        pair: z.string(),
        side: z.enum(["buy", "sell"]),
        price: z.string(),
        amount: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const price = parseFloat(input.price);
        const amount = parseFloat(input.amount);

        if (price <= 0 || amount <= 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid price or amount" });
        }

        const [base, quote] = input.pair.split("/");
        const assetToLock = input.side === "buy" ? quote : base;
        const requiredAmount = input.side === "buy" ? amount * price : amount;

        const [wallet] = await db.select().from(wallets)
          .where(and(eq(wallets.userId, ctx.user.id), eq(wallets.asset, assetToLock)))
          .limit(1);

        const available = wallet ? parseFloat(wallet.balance) - parseFloat(wallet.locked) : 0;

        if (!wallet || available < requiredAmount) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
        }

        await db.update(wallets)
          .set({ locked: sql`${wallets.locked} + ${requiredAmount.toString()}` })
          .where(and(eq(wallets.userId, ctx.user.id), eq(wallets.asset, assetToLock)));

        await db.insert(orders).values({
          userId: ctx.user.id,
          pair: input.pair,
          side: input.side,
          type: "limit",
          status: "open",
          price: input.price,
          amount: input.amount,
          filled: "0",
        });

        return { ok: true };
      }),

    cancelOrder: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const [order] = await db.select().from(orders)
          .where(eq(orders.id, input.id))
          .limit(1);

        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        if (order.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        if (order.status !== "open") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Only open orders can be cancelled" });
        }

        const remaining = parseFloat(order.amount) - parseFloat(order.filled);
        const [base, quote] = order.pair.split("/");
        const assetToUnlock = order.side === "buy" ? quote : base;
        const unlockAmount = order.side === "buy" ? remaining * parseFloat(order.price) : remaining;

        if (unlockAmount > 0) {
          await db.update(wallets)
            .set({ locked: sql`${wallets.locked} - ${unlockAmount.toString()}` })
            .where(and(eq(wallets.userId, order.userId), eq(wallets.asset, assetToUnlock)));
        }

        await db.update(orders)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(orders.id, input.id));

        return { ok: true };
      }),

    orderBook: publicProcedure
      .input(z.object({ pair: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { pair: input.pair, bids: [], asks: [] };

        const rows = await db.select().from(orders)
          .where(and(
            eq(orders.pair, input.pair),
            eq(orders.type, "limit"),
            eq(orders.status, "open")
          ));

        const bidsMap = new Map<string, number>();
        const asksMap = new Map<string, number>();

        for (const row of rows) {
          const remaining = parseFloat(row.amount) - parseFloat(row.filled);
          if (remaining <= 0) continue;

          if (row.side === "buy") {
            const prev = bidsMap.get(row.price) ?? 0;
            bidsMap.set(row.price, prev + remaining);
          } else {
            const prev = asksMap.get(row.price) ?? 0;
            asksMap.set(row.price, prev + remaining);
          }
        }

        const bids = Array.from(bidsMap.entries())
          .map(([price, amount]) => ({ price: parseFloat(price), amount }))
          .sort((a, b) => b.price - a.price);

        const asks = Array.from(asksMap.entries())
          .map(([price, amount]) => ({ price: parseFloat(price), amount }))
          .sort((a, b) => a.price - b.price);

        return { pair: input.pair, bids, asks };
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
