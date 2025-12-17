import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { hashPassword, comparePassword, generateToken } from "./authHelpers";
import { createSession, getSession, revokeSession, listUserSessions } from "./sessionManager";
import { generateEmailCode, verifyEmailCode } from "./emailVerification";
import { requestPasswordReset, resetPassword, verifyResetToken } from "./passwordReset";
import { checkLoginRateLimit, checkRegisterRateLimit, extractClientIp, recordLoginResult } from "./rateLimit";
import { recordLoginAttempt } from "./loginHistory";
import { sendWelcomeEmail, sendLoginAlertEmail } from "./email";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb, initializeUserWallets } from "./db";
import { wallets, orders, trades, stakingPlans, stakingPositions, deposits, withdrawals, kycDocuments, supportTickets, ticketReplies, promoCodes, promoUsage, transactions, users, systemLogs, walletAddresses } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { storagePut } from "./storage";
import { getCryptoPrice, getAllCryptoPrices, getPairPrice } from "./cryptoPrices";
import { generateWalletAddress } from "./walletGenerator";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    register: publicProcedure
      .input(z.object({ 
        email: z.string().email(), 
        password: z.string().min(8), 
        name: z.string().min(2) 
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // Rate limiting
        const ip = extractClientIp(ctx.req);
        checkRegisterRateLimit({ ip });

        // Check if user already exists
        const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (existing.length > 0) {
          throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await hashPassword(input.password);

        // Create user
        const result = await db.insert(users).values({
          email: input.email,
          password: hashedPassword,
          name: input.name,
          role: "user",
        });

        // Get user ID
        const newUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (newUser.length === 0) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });
        }

        const userId = newUser[0].id;

        // Generate and send verification code
        await generateEmailCode(userId, input.email);

        // Send welcome email
        await sendWelcomeEmail(input.email);

        return { success: true, message: "Registration successful. Please check your email for verification code.", userId };
      }),

    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // Rate limiting
        const ip = extractClientIp(ctx.req);
        const userAgent = ctx.req.headers["user-agent"] || "unknown";
        checkLoginRateLimit({ ip, email: input.email });

        // Find user by email
        const userResult = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (userResult.length === 0) {
          await recordLoginAttempt({
            email: input.email,
            ipAddress: ip,
            userAgent,
            method: "password",
            success: false,
          });
          recordLoginResult({ ip, email: input.email, success: false });
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }

        const user = userResult[0];
        if (!user.password) {
          await recordLoginAttempt({
            userId: user.id,
            email: input.email,
            ipAddress: ip,
            userAgent,
            method: "password",
            success: false,
          });
          recordLoginResult({ ip, email: input.email, success: false });
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Please use OAuth login" });
        }

        // Verify password
        const isValid = await comparePassword(input.password, user.password);
        if (!isValid) {
          await recordLoginAttempt({
            userId: user.id,
            email: input.email,
            ipAddress: ip,
            userAgent,
            method: "password",
            success: false,
          });
          recordLoginResult({ ip, email: input.email, success: false });
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }

        // Create session
        const token = await createSession(
          { userId: user.id, email: user.email!, role: user.role },
          ip,
          userAgent
        );

        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie("auth_token", token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days

        // Record successful login
        await recordLoginAttempt({
          userId: user.id,
          email: input.email,
          ipAddress: ip,
          userAgent,
          method: "password",
          success: true,
        });
        recordLoginResult({ ip, email: input.email, success: true });

        // Send login alert email
        await sendLoginAlertEmail({
          to: user.email!,
          ip,
          userAgent,
          timestamp: new Date().toLocaleString(),
        });

        return { success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
      }),

    logout: publicProcedure.mutation(async ({ ctx }) => {
      const token = ctx.req.cookies["auth_token"];
      if (token) {
        await revokeSession(token);
      }
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("auth_token", { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    verifyEmail: publicProcedure
      .input(z.object({ userId: z.number(), code: z.string().length(6) }))
      .mutation(async ({ input }) => {
        const success = await verifyEmailCode(input.userId, input.code);
        if (!success) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired verification code" });
        }
        return { success: true, message: "Email verified successfully" };
      }),

    resendVerificationCode: publicProcedure
      .input(z.object({ userId: z.number(), email: z.string().email() }))
      .mutation(async ({ input }) => {
        await generateEmailCode(input.userId, input.email);
        return { success: true, message: "Verification code sent" };
      }),

    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        await requestPasswordReset(input.email);
        return { success: true, message: "If the email exists, a password reset link has been sent" };
      }),

    verifyResetToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const valid = await verifyResetToken(input.token);
        return { valid };
      }),

    resetPassword: publicProcedure
      .input(z.object({ token: z.string(), newPassword: z.string().min(8) }))
      .mutation(async ({ input }) => {
        const success = await resetPassword(input.token, input.newPassword);
        if (!success) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired reset token" });
        }
        return { success: true, message: "Password reset successfully" };
      }),

    listSessions: protectedProcedure.query(async ({ ctx }) => {
      const sessions = await listUserSessions(ctx.user.id);
      return sessions;
    }),

    revokeSession: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        await revokeSession(input.token);
        return { success: true };
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

  staking: router({
    plans: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(stakingPlans).where(eq(stakingPlans.enabled, true));
    }),

    myPositions: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(stakingPositions)
        .where(eq(stakingPositions.userId, ctx.user.id))
        .orderBy(desc(stakingPositions.startedAt));
    }),

    stake: protectedProcedure
      .input(z.object({
        planId: z.number().int().positive(),
        amount: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const [plan] = await db.select().from(stakingPlans)
          .where(and(eq(stakingPlans.id, input.planId), eq(stakingPlans.enabled, true)))
          .limit(1);

        if (!plan) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Staking plan not found" });
        }

        const amount = parseFloat(input.amount);
        if (amount < parseFloat(plan.minAmount)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Minimum amount is ${plan.minAmount} ${plan.asset}` });
        }

        const [wallet] = await db.select().from(wallets)
          .where(and(eq(wallets.userId, ctx.user.id), eq(wallets.asset, plan.asset)))
          .limit(1);

        const available = wallet ? parseFloat(wallet.balance) - parseFloat(wallet.locked) : 0;

        if (!wallet || available < amount) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
        }

        await db.update(wallets)
          .set({ balance: sql`${wallets.balance} - ${amount.toString()}` })
          .where(and(eq(wallets.userId, ctx.user.id), eq(wallets.asset, plan.asset)));

        const maturesAt = new Date();
        maturesAt.setDate(maturesAt.getDate() + plan.lockDays);

        await db.insert(stakingPositions).values({
          userId: ctx.user.id,
          planId: input.planId,
          amount: input.amount,
          rewards: "0",
          status: "active",
          maturesAt,
        });

        return { ok: true };
      }),

    unstake: protectedProcedure
      .input(z.object({ positionId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const [position] = await db.select().from(stakingPositions)
          .where(eq(stakingPositions.id, input.positionId))
          .limit(1);

        if (!position || position.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (position.status !== "active") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Position already closed" });
        }

        const now = new Date();

        if (position.maturesAt && now < position.maturesAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Position is still locked" });
        }

        const [plan] = await db.select().from(stakingPlans)
          .where(eq(stakingPlans.id, position.planId))
          .limit(1);

        if (!plan) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });
        }

        const started = new Date(position.startedAt);
        const daysPassed = (now.getTime() - started.getTime()) / (1000 * 60 * 60 * 24);
        const principal = parseFloat(position.amount);
        const apr = parseFloat(plan.apr);
        const reward = (principal * apr * daysPassed) / (365 * 100);
        const total = principal + reward;

        await db.update(wallets)
          .set({ balance: sql`${wallets.balance} + ${total.toString()}` })
          .where(and(eq(wallets.userId, ctx.user.id), eq(wallets.asset, plan.asset)));

        await db.update(stakingPositions)
          .set({ status: "withdrawn", rewards: reward.toFixed(8), withdrawnAt: now })
          .where(eq(stakingPositions.id, input.positionId));

        return { ok: true, reward: reward.toFixed(8) };
      }),
  }),

  deposit: router({
    create: protectedProcedure
      .input(z.object({
        asset: z.string(),
        amount: z.string(),
        network: z.string(),
        method: z.enum(["changenow", "simplex", "moonpay", "transak", "mercuryo", "coingate", "changelly", "banxa"]),
        txHash: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db.insert(deposits).values({
          userId: ctx.user.id,
          asset: input.asset,
          amount: input.amount,
          network: input.network,
          provider: input.method,
          externalId: input.txHash || null,
          status: "pending",
        });

        return { ok: true };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(deposits)
        .where(eq(deposits.userId, ctx.user.id))
        .orderBy(desc(deposits.createdAt))
        .limit(50);
    }),
  }),

  withdrawal: router({
    create: protectedProcedure
      .input(z.object({ 
        asset: z.string(), 
        amount: z.string(), 
        network: z.string(),
        address: z.string() 
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const amount = parseFloat(input.amount);
        if (amount <= 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid amount" });
        }

        // Validate network exists and is active
        const { networks } = await import("../drizzle/schema");
        const [network] = await db.select().from(networks)
          .where(and(
            eq(networks.asset, input.asset),
            eq(networks.symbol, input.network),
            eq(networks.isActive, true)
          ))
          .limit(1);

        if (!network) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid network selected" });
        }

        // Check minimum withdrawal amount
        const minWithdrawal = parseFloat(network.minWithdrawal);
        if (amount < minWithdrawal) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Minimum withdrawal is ${minWithdrawal} ${input.asset}` });
        }

        const [wallet] = await db.select().from(wallets)
          .where(and(eq(wallets.userId, ctx.user.id), eq(wallets.asset, input.asset)))
          .limit(1);

        const available = wallet ? parseFloat(wallet.balance) - parseFloat(wallet.locked) : 0;
        const fee = parseFloat(network.withdrawalFee);
        const totalRequired = amount + fee;

        if (!wallet || available < totalRequired) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance (including fees)" });
        }

        await db.update(wallets)
          .set({ locked: sql`${wallets.locked} + ${totalRequired.toString()}` })
          .where(and(eq(wallets.userId, ctx.user.id), eq(wallets.asset, input.asset)));

        await db.insert(withdrawals).values({
          userId: ctx.user.id,
          asset: input.asset,
          amount: input.amount,
          network: input.network,
          address: input.address,
          fee: network.withdrawalFee,
          status: "pending",
        });

        return { ok: true, fee: network.withdrawalFee };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(withdrawals)
        .where(eq(withdrawals.userId, ctx.user.id))
        .orderBy(desc(withdrawals.createdAt))
        .limit(50);
    }),
  }),

  wallet: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      await initializeUserWallets(ctx.user.id);
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(wallets).where(eq(wallets.userId, ctx.user.id));
    }),
    getDepositAddress: protectedProcedure
      .input(z.object({ 
        asset: z.string(),
        network: z.string()
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Check if address already exists for this user/asset/network
        const existing = await db
          .select()
          .from(walletAddresses)
          .where(
            and(
              eq(walletAddresses.userId, ctx.user.id),
              eq(walletAddresses.asset, input.asset),
              eq(walletAddresses.network, input.network)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          return existing[0];
        }

        // Generate new address for the specified network
        const address = await generateWalletAddress(ctx.user.id, input.asset, input.network);
        
        // Save to database
        await db.insert(walletAddresses).values({
          userId: ctx.user.id,
          asset: input.asset,
          address,
          network: input.network,
        });

        return { 
          id: 0, // Will be set by database
          userId: ctx.user.id, 
          asset: input.asset, 
          address, 
          network: input.network, 
          createdAt: new Date() 
        };
      }),
    
    listNetworks: protectedProcedure
      .input(z.object({ asset: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const { networks } = await import("../drizzle/schema");
        return await db
          .select()
          .from(networks)
          .where(and(
            eq(networks.asset, input.asset),
            eq(networks.isActive, true)
          ));
      }),
  }),

  kyc: router({
    submit: protectedProcedure
      .input(z.object({
        firstName: z.string(),
        lastName: z.string(),
        dateOfBirth: z.string(),
        address: z.string(),
        city: z.string(),
        country: z.string(),
        postalCode: z.string(),
        documentType: z.enum(["id_card", "passport", "drivers_license"]),
        frontImageUrl: z.string(),
        backImageUrl: z.string().optional(),
        selfieUrl: z.string().optional(),
        proofOfAddressUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const [existing] = await db.select().from(kycDocuments)
          .where(eq(kycDocuments.userId, ctx.user.id))
          .limit(1);

        if (existing && existing.status === "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "KYC already pending review" });
        }

        if (existing && existing.status === "approved") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "KYC already approved" });
        }

        await db.insert(kycDocuments).values({
          userId: ctx.user.id,
          firstName: input.firstName,
          lastName: input.lastName,
          dateOfBirth: input.dateOfBirth,
          address: input.address,
          city: input.city,
          country: input.country,
          postalCode: input.postalCode,
          documentType: input.documentType,
          frontImageUrl: input.frontImageUrl,
          backImageUrl: input.backImageUrl || null,
          selfieUrl: input.selfieUrl || null,
          proofOfAddressUrl: input.proofOfAddressUrl || null,
          status: "pending",
        });

        return { ok: true };
      }),

    status: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const [doc] = await db.select().from(kycDocuments)
        .where(eq(kycDocuments.userId, ctx.user.id))
        .orderBy(desc(kycDocuments.createdAt))
        .limit(1);
      return doc || null;
    }),
  }),

  support: router({
    createTicket: protectedProcedure
      .input(z.object({
        subject: z.string(),
        message: z.string(),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db.insert(supportTickets).values({
          userId: ctx.user.id,
          subject: input.subject,
          message: input.message,
          priority: input.priority,
          status: "open",
        });

        return { ok: true };
      }),

    myTickets: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(supportTickets)
        .where(eq(supportTickets.userId, ctx.user.id))
        .orderBy(desc(supportTickets.createdAt));
    }),

    replyTicket: protectedProcedure
      .input(z.object({
        ticketId: z.number(),
        message: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const [ticket] = await db.select().from(supportTickets)
          .where(eq(supportTickets.id, input.ticketId))
          .limit(1);

        if (!ticket || ticket.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        await db.insert(ticketReplies).values({
          ticketId: input.ticketId,
          userId: ctx.user.id,
          message: input.message,
          isAdmin: false,
        });

        return { ok: true };
      }),
  }),

  admin: router({
    stats: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { totalUsers: 0, pendingWithdrawals: 0, pendingKyc: 0 };
      const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [withdrawalCount] = await db.select({ count: sql<number>`count(*)` }).from(withdrawals).where(eq(withdrawals.status, "pending"));
      return { totalUsers: userCount?.count ?? 0, pendingWithdrawals: withdrawalCount?.count ?? 0, pendingKyc: 0 };
    }),

    withdrawals: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(withdrawals)
        .where(eq(withdrawals.status, "pending"))
        .orderBy(desc(withdrawals.createdAt));
    }),

    approveWithdrawal: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const [withdrawal] = await db.select().from(withdrawals)
          .where(eq(withdrawals.id, input.id))
          .limit(1);

        if (!withdrawal) throw new TRPCError({ code: "NOT_FOUND" });
        if (withdrawal.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Withdrawal already processed" });
        }

        const amount = parseFloat(withdrawal.amount);

        await db.update(wallets)
          .set({ 
            balance: sql`${wallets.balance} - ${amount.toString()}`,
            locked: sql`${wallets.locked} - ${amount.toString()}`
          })
          .where(and(eq(wallets.userId, withdrawal.userId), eq(wallets.asset, withdrawal.asset)));

        await db.update(withdrawals)
          .set({ status: "completed", processedAt: new Date() })
          .where(eq(withdrawals.id, input.id));

        return { ok: true };
      }),

    rejectWithdrawal: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const [withdrawal] = await db.select().from(withdrawals)
          .where(eq(withdrawals.id, input.id))
          .limit(1);

        if (!withdrawal) throw new TRPCError({ code: "NOT_FOUND" });
        if (withdrawal.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Withdrawal already processed" });
        }

        const amount = parseFloat(withdrawal.amount);

        await db.update(wallets)
          .set({ locked: sql`${wallets.locked} - ${amount.toString()}` })
          .where(and(eq(wallets.userId, withdrawal.userId), eq(wallets.asset, withdrawal.asset)));

        await db.update(withdrawals)
          .set({ status: "rejected", processedAt: new Date() })
          .where(eq(withdrawals.id, input.id));

        return { ok: true };
      }),

    kycList: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(kycDocuments)
        .where(eq(kycDocuments.status, "pending"))
        .orderBy(desc(kycDocuments.createdAt));
    }),

    approveKyc: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const [kyc] = await db.select().from(kycDocuments)
          .where(eq(kycDocuments.id, input.id))
          .limit(1);

        if (!kyc) throw new TRPCError({ code: "NOT_FOUND" });
        if (kyc.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "KYC already processed" });
        }

        await db.update(kycDocuments)
          .set({ status: "approved", processedAt: new Date() })
          .where(eq(kycDocuments.id, input.id));

        await db.update(users)
          .set({ kycStatus: "approved" })
          .where(eq(users.id, kyc.userId));

        return { ok: true };
      }),

    rejectKyc: adminProcedure
      .input(z.object({ id: z.number().int().positive(), reason: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const [kyc] = await db.select().from(kycDocuments)
          .where(eq(kycDocuments.id, input.id))
          .limit(1);

        if (!kyc) throw new TRPCError({ code: "NOT_FOUND" });
        if (kyc.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "KYC already processed" });
        }

        await db.update(kycDocuments)
          .set({ status: "rejected", adminNote: input.reason || null, processedAt: new Date() })
          .where(eq(kycDocuments.id, input.id));

        await db.update(users)
          .set({ kycStatus: "rejected" })
          .where(eq(users.id, kyc.userId));

        return { ok: true };
      }),

    tickets: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(supportTickets)
        .orderBy(desc(supportTickets.createdAt))
        .limit(100);
    }),

    // Staking Plans Management
    createStakingPlan: adminProcedure
      .input(z.object({
        asset: z.string(),
        name: z.string(),
        apr: z.string(),
        duration: z.number(),
        minAmount: z.string(),
        maxAmount: z.string().optional(),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(stakingPlans).values(input);
        return { ok: true };
      }),
    
    updateStakingPlan: adminProcedure
      .input(z.object({
        id: z.number(),
        asset: z.string().optional(),
        name: z.string().optional(),
        apr: z.string().optional(),
        duration: z.number().optional(),
        minAmount: z.string().optional(),
        maxAmount: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { id, ...updates } = input;
        await db.update(stakingPlans).set(updates).where(eq(stakingPlans.id, id));
        return { ok: true };
      }),
    
    deleteStakingPlan: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.delete(stakingPlans).where(eq(stakingPlans.id, input.id));
        return { ok: true };
      }),

    // Promo Codes Management
    createPromoCode: adminProcedure
      .input(z.object({
        code: z.string(),
        description: z.string().optional(),
        bonusType: z.enum(["percentage", "fixed"]),
        bonusValue: z.string(),
        bonusAsset: z.string().default("USDT"),
        maxUses: z.number().default(0),
        expiresAt: z.date().optional(),
        enabled: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(promoCodes).values(input);
        return { ok: true };
      }),

    listPromoCodes: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
    }),

    deletePromoCode: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.delete(promoCodes).where(eq(promoCodes.id, input.id));
        return { ok: true };
      }),

    // User Management
    listUsers: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(users).orderBy(desc(users.createdAt)).limit(100);
    }),

    updateUserRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
        return { ok: true };
      }),

    replyToTicket: adminProcedure
      .input(z.object({
        ticketId: z.number(),
        message: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db.insert(ticketReplies).values({
          ticketId: input.ticketId,
          userId: ctx.user.id,
          message: input.message,
          isAdmin: true,
        });

        await db.update(supportTickets)
          .set({ status: "in_progress" })
          .where(eq(supportTickets.id, input.ticketId));

        return { ok: true };
      }),
  }),

  prices: router({
    get: publicProcedure
      .input(z.object({ asset: z.string() }))
      .query(async ({ input }) => {
        const price = await getCryptoPrice(input.asset);
        if (!price) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
        return price;
      }),
    getAll: publicProcedure.query(async () => {
      return await getAllCryptoPrices();
    }),
    getPair: publicProcedure
      .input(z.object({ pair: z.string() }))
      .query(async ({ input }) => {
        const price = await getPairPrice(input.pair);
        return { pair: input.pair, price };
      }),
  }),
});

export type AppRouter = typeof appRouter;
