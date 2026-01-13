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
import { sendWelcomeEmail, sendLoginAlertEmail, sendDepositConfirmationEmail, sendWithdrawalApprovedEmail, sendWithdrawalRejectedEmail, sendWithdrawalRequestEmail } from "./email";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb, initializeUserWallets } from "./db";
import { wallets, orders, trades, stakingPlans, stakingPositions, deposits, withdrawals, kycDocuments, supportTickets, ticketMessages, promoCodes, promoUsage, transactions, users, systemLogs, walletAddresses, notifications } from "../drizzle/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
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
        const userAgent = ctx.req.headers?.["user-agent"] || "unknown";
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
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days

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
      try {
        console.log('[Logout] Starting logout process');
        const token = ctx.req.cookies?.["auth_token"];
        console.log('[Logout] Token:', token ? 'present' : 'missing');
        console.log('[Logout] Cookies object:', ctx.req.cookies ? 'present' : 'undefined');
        if (token) {
          await revokeSession(token);
          console.log('[Logout] Session revoked');
        }
        const cookieOptions = getSessionCookieOptions(ctx.req);
        console.log('[Logout] Clearing cookies');
        // auth_token cookie already cleared by COOKIE_NAME
        ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
        console.log('[Logout] Logout successful');
        return { success: true } as const;
      } catch (error) {
        console.error('[Logout] Error during logout:', error);
        throw error;
      }
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

    // 2FA endpoints
    setup2FA: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { generate2FASecret } = await import("./twoFactor");
      const { secret, qrCodeUrl } = generate2FASecret(ctx.user.email || "user@bitchange.pro");

      // Save secret to user (not enabled yet)
      await db.update(users)
        .set({ twoFactorSecret: secret })
        .where(eq(users.id, ctx.user.id));

      return { secret, qrCodeUrl };
    }),

    enable2FA: protectedProcedure
      .input(z.object({ token: z.string().length(6) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
        if (!user[0]?.twoFactorSecret) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "2FA not set up. Call setup2FA first." });
        }

        const { verify2FAToken, generateBackupCodes, hashBackupCode } = await import("./twoFactor");
        const valid = verify2FAToken(user[0].twoFactorSecret, input.token);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid 2FA token" });
        }

        // Generate backup codes
        const backupCodes = generateBackupCodes(10);
        const hashedCodes = backupCodes.map(hashBackupCode);

        // Enable 2FA
        await db.update(users)
          .set({ 
            twoFactorEnabled: true,
            twoFactorBackupCodes: JSON.stringify(hashedCodes)
          })
          .where(eq(users.id, ctx.user.id));

        return { success: true, backupCodes };
      }),

    disable2FA: protectedProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
        if (!user[0]?.password) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot disable 2FA for OAuth users" });
        }

        const bcrypt = await import("bcryptjs");
        const valid = await bcrypt.compare(input.password, user[0].password);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
        }

        // Disable 2FA
        await db.update(users)
          .set({ 
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorBackupCodes: null
          })
          .where(eq(users.id, ctx.user.id));

        return { success: true };
      }),

    verify2FA: publicProcedure
      .input(z.object({ userId: z.number(), token: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const user = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
        if (!user[0]?.twoFactorSecret) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "2FA not enabled" });
        }

        const { verify2FAToken, verifyBackupCode, removeBackupCode } = await import("./twoFactor");
        
        // Try TOTP first
        const validTOTP = verify2FAToken(user[0].twoFactorSecret, input.token);
        if (validTOTP) {
          return { success: true };
        }

        // Try backup code
        if (user[0].twoFactorBackupCodes) {
          const hashedCodes = JSON.parse(user[0].twoFactorBackupCodes);
          const validBackup = verifyBackupCode(input.token, hashedCodes);
          if (validBackup) {
            // Remove used backup code
            const newCodes = removeBackupCode(input.token, hashedCodes);
            await db.update(users)
              .set({ twoFactorBackupCodes: JSON.stringify(newCodes) })
              .where(eq(users.id, input.userId));
            return { success: true, usedBackupCode: true };
          }
        }

        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid 2FA token" });
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

        // Send notification to admin
        try {
          // Get user info
          const userList = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
          const user = userList.length > 0 ? userList[0] : null;
          
          // Create notification for all admins
          const adminUsers = await db.select().from(users).where(eq(users.role, "admin"));
          
          for (const admin of adminUsers) {
            await db.insert(notifications).values({
              userId: admin.id,
              type: "deposit",
              title: "New Deposit Request",
              message: `User ${user?.email || ctx.user.email} deposited ${input.amount} ${input.asset} via ${input.method}`,
              isRead: false,
            });
          }
        } catch (error) {
          console.error("Failed to send deposit notification:", error);
          // Don't fail the deposit if notification fails
        }

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

        // Send withdrawal request confirmation email
        try {
          await sendWithdrawalRequestEmail({
            to: ctx.user.email,
            asset: input.asset,
            amount: input.amount,
            address: input.address,
          });
        } catch (error) {
          console.error("Failed to send withdrawal request email:", error);
          // Don't fail the withdrawal if email fails
        }

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
      
      const userWallets = await db.select().from(wallets).where(eq(wallets.userId, ctx.user.id));
      
      // Fetch all prices in one batch call to avoid rate limiting
      const allPrices = await getAllCryptoPrices();
      const priceMap = new Map(allPrices.map(p => [p.asset, p]));
      
      // Enrich with USD values
      const walletsWithUSD = userWallets.map((wallet) => {
        const price = priceMap.get(wallet.asset);
        const balance = parseFloat(wallet.balance);
        const locked = parseFloat(wallet.locked);
        const usdValue = price ? balance * price.price : 0;
        const lockedUsdValue = price ? locked * price.price : 0;
        
        return {
          ...wallet,
          usdValue: usdValue.toFixed(2),
          lockedUsdValue: lockedUsdValue.toFixed(2),
          price: price?.price || 0,
        };
      });
      
      return walletsWithUSD;
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

    // Admin procedures
    getPending: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) return [];

      const pending = await db.select().from(kycDocuments)
        .where(eq(kycDocuments.status, "pending"))
        .orderBy(desc(kycDocuments.createdAt));

      return pending;
    }),

    approve: protectedProcedure
      .input(z.object({ kycId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Get KYC document
        const [kycDoc] = await db.select().from(kycDocuments)
          .where(eq(kycDocuments.id, input.kycId))
          .limit(1);

        if (!kycDoc) {
          throw new TRPCError({ code: "NOT_FOUND", message: "KYC document not found" });
        }

        if (kycDoc.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "KYC already processed" });
        }

        // Update KYC document status
        await db.update(kycDocuments)
          .set({
            status: "approved",
          })
          .where(eq(kycDocuments.id, input.kycId));

        // Update user KYC status
        await db.update(users)
          .set({
            kycStatus: "approved",
            kycApprovedAt: new Date(),
          })
          .where(eq(users.id, kycDoc.userId));

        // Create notification for user
        await db.insert(notifications).values({
          userId: kycDoc.userId,
          type: "kyc",
          title: "KYC Approved",
          message: "Your KYC verification has been approved. You can now access all features.",
        });

        return { ok: true };
      }),

    reject: protectedProcedure
      .input(z.object({
        kycId: z.number(),
        reason: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Get KYC document
        const [kycDoc] = await db.select().from(kycDocuments)
          .where(eq(kycDocuments.id, input.kycId))
          .limit(1);

        if (!kycDoc) {
          throw new TRPCError({ code: "NOT_FOUND", message: "KYC document not found" });
        }

        if (kycDoc.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "KYC already processed" });
        }

        // Update KYC document status
        await db.update(kycDocuments)
          .set({
            status: "rejected",
          })
          .where(eq(kycDocuments.id, input.kycId));

        // Update user KYC status
        await db.update(users)
          .set({
            kycStatus: "rejected",
            kycRejectedReason: input.reason,
          })
          .where(eq(users.id, kycDoc.userId));

        // Create notification for user
        await db.insert(notifications).values({
          userId: kycDoc.userId,
          type: "kyc",
          title: "KYC Rejected",
          message: `Your KYC verification has been rejected. Reason: ${input.reason}`,
        });

        return { ok: true };
      }),
  }),

  support: router({
    createTicket: protectedProcedure
      .input(z.object({
        subject: z.string(),
        message: z.string(),
        category: z.enum(["technical", "billing", "kyc", "withdrawal", "deposit", "trading", "other"]).default("other"),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const [ticket] = await db.insert(supportTickets).values({
          userId: ctx.user.id,
          subject: input.subject,
          category: input.category || "other",
          priority: input.priority,
          status: "open",
        });

        // Insert first message
        await db.insert(ticketMessages).values({
          ticketId: ticket.insertId as number,
          userId: ctx.user.id,
          message: input.message,
          isStaff: false,
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

        await db.insert(ticketMessages).values({
          ticketId: input.ticketId,
          userId: ctx.user.id,
          message: input.message,
          isStaff: false,
        });

        return { ok: true };
      }),
  }),

  admin: router({
    // User Management
    users: adminProcedure
      .input(z.object({
        search: z.string().optional(),
        role: z.enum(["admin", "user"]).optional(),
        kycStatus: z.enum(["pending", "approved", "rejected"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { users: [], total: 0 };

        let query = db.select().from(users);

        // Apply filters
        const conditions = [];
        if (input.search) {
          conditions.push(
            sql`${users.email} LIKE ${`%${input.search}%`} OR ${users.name} LIKE ${`%${input.search}%`}`
          );
        }
        if (input.role) {
          conditions.push(eq(users.role, input.role));
        }
        if (input.kycStatus) {
          conditions.push(eq(users.kycStatus, input.kycStatus));
        }

        if (conditions.length > 0) {
          query = query.where(sql`${sql.join(conditions, sql` AND `)}`) as any;
        }

        const [countResult] = await db.select({ count: sql<number>`count(*)` })
          .from(users)
          .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined);

        const usersList = await query
          .limit(input.limit)
          .offset(input.offset)
          .orderBy(desc(users.createdAt));

        return {
          users: usersList,
          total: countResult?.count ?? 0,
        };
      }),

    updateUser: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["admin", "user"]).optional(),
        kycStatus: z.enum(["pending", "approved", "rejected"]).optional(),
        accountStatus: z.enum(["active", "suspended"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const updates: any = {};
        if (input.role) updates.role = input.role;
        if (input.kycStatus) updates.kycStatus = input.kycStatus;
        if (input.accountStatus) updates.accountStatus = input.accountStatus;

        await db.update(users)
          .set(updates)
          .where(eq(users.id, input.userId));

        return { success: true };
      }),

    // Credit user balance (manual credit by admin)
    creditBalance: adminProcedure
      .input(z.object({
        userId: z.number(),
        asset: z.string(),
        amount: z.string(), // Positive amount to credit
        note: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const amount = parseFloat(input.amount);
        if (amount <= 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Amount must be positive" });
        }

        // Get or create wallet
        const [existingWallet] = await db.select()
          .from(wallets)
          .where(
            and(
              eq(wallets.userId, input.userId),
              eq(wallets.asset, input.asset)
            )
          )
          .limit(1);

        if (existingWallet) {
          // Update existing wallet
          await db.update(wallets)
            .set({ 
              balance: sql`${wallets.balance} + ${input.amount}`,
              updatedAt: new Date()
            })
            .where(
              and(
                eq(wallets.userId, input.userId),
                eq(wallets.asset, input.asset)
              )
            );
        } else {
          // Create new wallet
          await db.insert(wallets).values({
            userId: input.userId,
            asset: input.asset,
            balance: input.amount,
            locked: "0",
          });
        }

        // Log transaction
        await db.insert(transactions).values({
          userId: input.userId,
          type: "deposit", // Use deposit type for manual credits
          asset: input.asset,
          amount: input.amount,
          status: "completed",
          reference: input.note || `Manual credit by admin (${ctx.user.email})`,
        });

        return { success: true };
      }),

    adjustBalance: adminProcedure
      .input(z.object({
        userId: z.number(),
        asset: z.string(),
        amount: z.string(),
        type: z.enum(["add", "subtract"]),
        reason: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const { wallets: walletsTable } = await import("../drizzle/schema");

        // Get current wallet
        const [wallet] = await db.select()
          .from(walletsTable)
          .where(
            sql`${walletsTable.userId} = ${input.userId} AND ${walletsTable.asset} = ${input.asset}`
          )
          .limit(1);

        if (!wallet) {
          // Create new wallet
          await db.insert(walletsTable).values({
            userId: input.userId,
            asset: input.asset,
            balance: input.type === "add" ? input.amount : "0",
            locked: "0",
          });
        } else {
          // Update existing wallet
          const currentBalance = parseFloat(wallet.balance);
          const adjustAmount = parseFloat(input.amount);
          const newBalance = input.type === "add" 
            ? currentBalance + adjustAmount
            : currentBalance - adjustAmount;

          if (newBalance < 0) {
            throw new TRPCError({ 
              code: "BAD_REQUEST", 
              message: "Insufficient balance" 
            });
          }

          await db.update(walletsTable)
            .set({ balance: newBalance.toString() })
            .where(eq(walletsTable.id, wallet.id));
        }

        // Log the adjustment
        // TODO: Create audit log table

        return { success: true };
      }),

    userActivity: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { deposits: [], withdrawals: [], trades: [], logins: [] };

        const { deposits: depositsTable, withdrawals: withdrawalsTable, trades: tradesTable, loginHistory } = await import("../drizzle/schema");

        const deposits = await db.select()
          .from(depositsTable)
          .where(eq(depositsTable.userId, input.userId))
          .orderBy(desc(depositsTable.createdAt))
          .limit(20);

        const withdrawals = await db.select()
          .from(withdrawalsTable)
          .where(eq(withdrawalsTable.userId, input.userId))
          .orderBy(desc(withdrawalsTable.createdAt))
          .limit(20);

        const trades = await db.select()
          .from(tradesTable)
          .where(
            sql`${tradesTable.buyerId} = ${input.userId} OR ${tradesTable.sellerId} = ${input.userId}`
          )
          .orderBy(desc(tradesTable.createdAt))
          .limit(20);

        const logins = await db.select()
          .from(loginHistory)
          .where(eq(loginHistory.userId, input.userId))
          .orderBy(desc(loginHistory.createdAt))
          .limit(20);

        return { deposits, withdrawals, trades, logins };
      }),

    // Dashboard Statistics
    dashboardStats: adminProcedure
      .input(z.object({
        timeRange: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
      }))
      .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return {
        totalUsers: 0,
        activeUsers: 0,
        pendingWithdrawals: 0,
        pendingKyc: 0,
        dailyVolume: "0",
        weeklyVolume: "0",
        monthlyVolume: "0",
        totalRevenue: "0",
        userGrowth: [],
        volumeChart: [],
      };

      // Total users
      const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
      
      // Calculate time range
      const timeRangeValue = input.timeRange;
      const daysMap = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
      const daysAgo = daysMap[timeRangeValue];
      
      // Active users (logged in last 7 days)
      const [activeCount] = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`${users.lastSignedIn} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`);

      // Pending withdrawals
      const [withdrawalCount] = await db.select({ count: sql<number>`count(*)` })
        .from(withdrawals)
        .where(eq(withdrawals.status, "pending"));

      // Pending KYC
      const [kycCount] = await db.select({ count: sql<number>`count(*)` })
        .from(kycDocuments)
        .where(eq(kycDocuments.status, "pending"));

      // Volume calculations (from trades)

      const [dailyVol] = await db.select({ 
        total: sql<string>`COALESCE(SUM(CAST(${trades.amount} AS DECIMAL(20,8))), 0)` 
      }).from(trades).where(sql`${trades.createdAt} >= DATE_SUB(NOW(), INTERVAL 1 DAY)`);

      const [weeklyVol] = await db.select({ 
        total: sql<string>`COALESCE(SUM(CAST(${trades.amount} AS DECIMAL(20,8))), 0)` 
      }).from(trades).where(sql`${trades.createdAt} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`);

      const [monthlyVol] = await db.select({ 
        total: sql<string>`COALESCE(SUM(CAST(${trades.amount} AS DECIMAL(20,8))), 0)` 
      }).from(trades).where(sql`${trades.createdAt} >= DATE_SUB(NOW(), INTERVAL 30 DAY)`);

      // User growth (based on selected time range)
      const userGrowthData = await db.select({
        date: sql<string>`DATE(${users.createdAt})`,
        count: sql<number>`count(*)`
      })
      .from(users)
      .where(sql`${users.createdAt} >= DATE_SUB(NOW(), INTERVAL ${sql.raw(daysAgo.toString())} DAY)`)
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`);

      // Volume chart (based on selected time range)
      const volumeData = await db.select({
        date: sql<string>`DATE(${trades.createdAt})`,
        volume: sql<string>`COALESCE(SUM(CAST(${trades.amount} AS DECIMAL(20,8))), 0)`
      })
      .from(trades)
      .where(sql`${trades.createdAt} >= DATE_SUB(NOW(), INTERVAL ${sql.raw(daysAgo.toString())} DAY)`)
      .groupBy(sql`DATE(${trades.createdAt})`)
      .orderBy(sql`DATE(${trades.createdAt})`);

      return {
        totalUsers: userCount?.count ?? 0,
        activeUsers: activeCount?.count ?? 0,
        pendingWithdrawals: withdrawalCount?.count ?? 0,
        pendingKyc: kycCount?.count ?? 0,
        dailyVolume: dailyVol?.total ?? "0",
        weeklyVolume: weeklyVol?.total ?? "0",
        monthlyVolume: monthlyVol?.total ?? "0",
        totalRevenue: "0", // Calculate from fees
        userGrowth: userGrowthData,
        volumeChart: volumeData,
      };
      }),

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

        // Get user email and send approval notification
        try {
          const [user] = await db.select().from(users).where(eq(users.id, withdrawal.userId)).limit(1);
          if (user) {
            await sendWithdrawalApprovedEmail({
              to: user.email,
              asset: withdrawal.asset,
              amount: withdrawal.amount,
              address: withdrawal.address,
            });
          }
        } catch (error) {
          console.error("Failed to send withdrawal approved email:", error);
          // Don't fail the approval if email fails
        }

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

        // Get user email and send rejection notification
        try {
          const [user] = await db.select().from(users).where(eq(users.id, withdrawal.userId)).limit(1);
          if (user) {
            await sendWithdrawalRejectedEmail({
              to: user.email,
              asset: withdrawal.asset,
              amount: withdrawal.amount,
            });
          }
        } catch (error) {
          console.error("Failed to send withdrawal rejected email:", error);
          // Don't fail the rejection if email fails
        }

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

        await db.insert(ticketMessages).values({
          ticketId: input.ticketId,
          userId: ctx.user.id,
          message: input.message,
          isStaff: true,
        });

        await db.update(supportTickets)
          .set({ status: "in_progress" })
          .where(eq(supportTickets.id, input.ticketId));

        return { ok: true };
      }),

    // Hot Wallet Management
    hotWallets: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const { masterWallets } = await import("../drizzle/schema");
      return await db.select().from(masterWallets).orderBy(desc(masterWallets.createdAt));
    }),

    createHotWallet: adminProcedure
      .input(z.object({ 
        network: z.string(), 
        address: z.string(), 
        encryptedPrivateKey: z.string(),
        asset: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { masterWallets } = await import("../drizzle/schema");

        await db.insert(masterWallets).values({
          network: input.network,
          address: input.address,
          encryptedPrivateKey: input.encryptedPrivateKey,
          asset: input.asset,
          balance: "0",
        });

        return { success: true };
      }),

    hotWalletBalance: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { masterWallets } = await import("../drizzle/schema");

        const [wallet] = await db.select().from(masterWallets)
          .where(eq(masterWallets.id, input.id))
          .limit(1);

        if (!wallet) throw new TRPCError({ code: "NOT_FOUND" });

        // In production, fetch real balance from blockchain
        // For now, return stored balance
        return { 
          address: wallet.address,
          network: wallet.network,
          asset: wallet.asset,
          balance: wallet.balance,
        };
      }),

    depositAddresses: adminProcedure
      .input(z.object({ network: z.string().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { depositAddresses } = await import("../drizzle/schema");

        if (input.network) {
          return await db.select().from(depositAddresses)
            .where(eq(depositAddresses.network, input.network))
            .orderBy(desc(depositAddresses.createdAt))
            .limit(100);
        }

        return await db.select().from(depositAddresses)
          .orderBy(desc(depositAddresses.createdAt))
          .limit(100);
      }),

    // Transaction Logs
    transactionLogs: adminProcedure
      .input(z.object({
        type: z.enum(["all", "deposits", "withdrawals", "trades", "logins"]).optional(),
        userId: z.number().optional(),
        limit: z.number().default(100),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { deposits: [], withdrawals: [], trades: [], logins: [] };

        const { deposits: depositsTable, withdrawals: withdrawalsTable, trades: tradesTable, loginHistory } = await import("../drizzle/schema");

        const results: any = {};

        if (!input.type || input.type === "all" || input.type === "deposits") {
          let query = db.select().from(depositsTable).orderBy(desc(depositsTable.createdAt)).limit(input.limit);
          if (input.userId) {
            query = query.where(eq(depositsTable.userId, input.userId)) as any;
          }
          results.deposits = await query;
        }

        if (!input.type || input.type === "all" || input.type === "withdrawals") {
          let query = db.select().from(withdrawalsTable).orderBy(desc(withdrawalsTable.createdAt)).limit(input.limit);
          if (input.userId) {
            query = query.where(eq(withdrawalsTable.userId, input.userId)) as any;
          }
          results.withdrawals = await query;
        }

        if (!input.type || input.type === "all" || input.type === "trades") {
          let query = db.select().from(tradesTable).orderBy(desc(tradesTable.createdAt)).limit(input.limit);
          if (input.userId) {
            query = query.where(
              sql`${tradesTable.buyerId} = ${input.userId} OR ${tradesTable.sellerId} = ${input.userId}`
            ) as any;
          }
          results.trades = await query;
        }

        if (!input.type || input.type === "all" || input.type === "logins") {
          let query = db.select().from(loginHistory).orderBy(desc(loginHistory.createdAt)).limit(input.limit);
          if (input.userId) {
            query = query.where(eq(loginHistory.userId, input.userId)) as any;
          }
          results.logins = await query;
        }

        return results;
      }),

    // Staking Management
    getStakingPlans: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(stakingPlans).orderBy(desc(stakingPlans.createdAt));
    }),

    createStakingPlan: adminProcedure
      .input(z.object({
        asset: z.string(),
        name: z.string(),
        apr: z.number(),
        lockDays: z.number(),
        minAmount: z.number(),
        enabled: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(stakingPlans).values({
          asset: input.asset,
          name: input.name,
          apr: input.apr.toString(),
          lockDays: input.lockDays,
          minAmount: input.minAmount.toString(),
          enabled: input.enabled,
        });
        return { success: true };
      }),

    updateStakingPlan: adminProcedure
      .input(z.object({
        id: z.number(),
        asset: z.string().optional(),
        name: z.string().optional(),
        apr: z.number().optional(),
        lockDays: z.number().optional(),
        minAmount: z.number().optional(),
        enabled: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { id, ...updates } = input;
        const updateData: any = {};
        if (updates.asset) updateData.asset = updates.asset;
        if (updates.name) updateData.name = updates.name;
        if (updates.apr !== undefined) updateData.apr = updates.apr.toString();
        if (updates.lockDays !== undefined) updateData.lockDays = updates.lockDays;
        if (updates.minAmount !== undefined) updateData.minAmount = updates.minAmount.toString();
        if (updates.enabled !== undefined) updateData.enabled = updates.enabled;

        await db.update(stakingPlans).set(updateData).where(eq(stakingPlans.id, id));
        return { success: true };
      }),

    deleteStakingPlan: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.delete(stakingPlans).where(eq(stakingPlans.id, input.id));
        return { success: true };
      }),

    getAllStakingPositions: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(stakingPositions).orderBy(desc(stakingPositions.startedAt));
    }),

    // Advanced Analytics Dashboard
    analytics: adminProcedure
      .input(z.object({
        timeRange: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const now = new Date();
        const daysMap = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
        const days = daysMap[input.timeRange];
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // User Activity Metrics
        const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
        const [newUsers] = await db.select({ count: sql<number>`count(*)` })
          .from(users)
          .where(gte(users.createdAt, startDate));
        
        // Active users (users who logged in during period)
        const [activeUsers] = await db.select({ count: sql<number>`count(DISTINCT user_id)` })
          .from(systemLogs)
          .where(and(
            eq(systemLogs.action, "login"),
            gte(systemLogs.createdAt, startDate)
          ));

        // Trading Volume
        const [totalVolume] = await db.select({ 
          volume: sql<number>`SUM(CAST(${trades.price} AS DECIMAL(20,8)) * CAST(${trades.amount} AS DECIMAL(20,8)))` 
        })
          .from(trades)
          .where(gte(trades.createdAt, startDate));

        const [totalTrades] = await db.select({ count: sql<number>`count(*)` })
          .from(trades)
          .where(gte(trades.createdAt, startDate));

        // Revenue (trading fees) - calculated as 0.2% of volume
        const totalFees = { fees: (totalVolume?.volume ?? 0) * 0.002 };

        // Daily metrics for charts
        const dailyMetrics = await db.select({
          date: sql<string>`DATE(${trades.createdAt})`,
          volume: sql<number>`SUM(CAST(${trades.price} AS DECIMAL(20,8)) * CAST(${trades.amount} AS DECIMAL(20,8)))`,
          trades: sql<number>`count(*)`,
          fees: sql<number>`SUM(CAST(${trades.price} AS DECIMAL(20,8)) * CAST(${trades.amount} AS DECIMAL(20,8)) * 0.002)`, // 0.2% fee
        })
          .from(trades)
          .where(gte(trades.createdAt, startDate))
          .groupBy(sql`DATE(${trades.createdAt})`)
          .orderBy(sql`DATE(${trades.createdAt})`);

        // User registrations by day
        const dailyRegistrations = await db.select({
          date: sql<string>`DATE(${users.createdAt})`,
          count: sql<number>`count(*)`,
        })
          .from(users)
          .where(gte(users.createdAt, startDate))
          .groupBy(sql`DATE(${users.createdAt})`)
          .orderBy(sql`DATE(${users.createdAt})`);

        // Top trading pairs
        const topPairs = await db.select({
          pair: trades.pair,
          volume: sql<number>`SUM(CAST(${trades.price} AS DECIMAL(20,8)) * CAST(${trades.amount} AS DECIMAL(20,8)))`,
          trades: sql<number>`count(*)`,
        })
          .from(trades)
          .where(gte(trades.createdAt, startDate))
          .groupBy(trades.pair)
          .orderBy(desc(sql`SUM(CAST(${trades.price} AS DECIMAL(20,8)) * CAST(${trades.amount} AS DECIMAL(20,8)))`))
          .limit(10);

        // System health metrics
        const errorCount = { count: 0 }; // Placeholder - implement error logging if needed

        return {
          summary: {
            totalUsers: totalUsers?.count ?? 0,
            newUsers: newUsers?.count ?? 0,
            activeUsers: activeUsers?.count ?? 0,
            totalVolume: totalVolume?.volume ?? 0,
            totalTrades: totalTrades?.count ?? 0,
            totalFees: totalFees?.fees ?? 0,
            errorCount: errorCount?.count ?? 0,
          },
          charts: {
            dailyVolume: dailyMetrics.map(m => ({ date: m.date, value: m.volume })),
            dailyTrades: dailyMetrics.map(m => ({ date: m.date, value: m.trades })),
            dailyFees: dailyMetrics.map(m => ({ date: m.date, value: m.fees })),
            dailyRegistrations: dailyRegistrations.map(r => ({ date: r.date, value: r.count })),
            topPairs: topPairs.map(p => ({ pair: p.pair, volume: p.volume, trades: p.trades })),
          },
        };
      }),

    // System Health Monitoring
    systemHealth: adminProcedure
      .input(z.object({
        timeRange: z.enum(["1h", "24h", "7d", "30d"]).default("24h"),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const now = new Date();
        const hoursMap = { "1h": 1, "24h": 24, "7d": 168, "30d": 720 };
        const hours = hoursMap[input.timeRange];
        const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

        // Get API stats
        const { apiLogs } = await import("../drizzle/schema");
        const apiStats = await db
          .select({
            avgResponseTime: sql<number>`AVG(${apiLogs.duration})`,
            maxResponseTime: sql<number>`MAX(${apiLogs.duration})`,
            totalRequests: sql<number>`COUNT(*)`,
            errorCount: sql<number>`SUM(CASE WHEN ${apiLogs.statusCode} >= 400 THEN 1 ELSE 0 END)`,
          })
          .from(apiLogs)
          .where(sql`${apiLogs.createdAt} >= ${startTime}`);

        const stats = apiStats[0] || { avgResponseTime: 0, maxResponseTime: 0, totalRequests: 0, errorCount: 0 };
        const errorRate = stats.totalRequests > 0 ? (stats.errorCount / stats.totalRequests) * 100 : 0;

        // Get exchange API stats
        const { exchangeApiLogs } = await import("../drizzle/schema");
        const exchangeStats = await db
          .select({
            exchange: exchangeApiLogs.exchange,
            totalCalls: sql<number>`COUNT(*)`,
            successCount: sql<number>`SUM(CASE WHEN ${exchangeApiLogs.success} = 1 THEN 1 ELSE 0 END)`,
            avgDuration: sql<number>`AVG(${exchangeApiLogs.duration})`,
          })
          .from(exchangeApiLogs)
          .where(sql`${exchangeApiLogs.createdAt} >= ${startTime}`)
          .groupBy(exchangeApiLogs.exchange);

        const exchangeStatsFormatted = exchangeStats.map(e => ({
          exchange: e.exchange,
          totalCalls: e.totalCalls,
          successRate: e.totalCalls > 0 ? ((e.successCount / e.totalCalls) * 100).toFixed(2) : "0",
          avgDuration: Math.round(e.avgDuration),
        }));

        // Get time-series data for charts
        const apiTimeSeriesData = await db
          .select({
            time: sql<string>`DATE_FORMAT(${apiLogs.createdAt}, '%Y-%m-%d %H:00')`,
            avgResponseTime: sql<number>`AVG(${apiLogs.duration})`,
            maxResponseTime: sql<number>`MAX(${apiLogs.duration})`,
            total: sql<number>`COUNT(*)`,
            errors: sql<number>`SUM(CASE WHEN ${apiLogs.statusCode} >= 400 THEN 1 ELSE 0 END)`,
          })
          .from(apiLogs)
          .where(sql`${apiLogs.createdAt} >= ${startTime}`)
          .groupBy(sql`DATE_FORMAT(${apiLogs.createdAt}, '%Y-%m-%d %H:00')`)
          .orderBy(sql`DATE_FORMAT(${apiLogs.createdAt}, '%Y-%m-%d %H:00')`);

        return {
          metrics: {
            avgResponseTime: Math.round(stats.avgResponseTime),
            errorRate: errorRate.toFixed(2),
            totalErrors: stats.errorCount,
            dbHealthy: true, // Simplified - always true if query succeeds
            avgDbQueryTime: 0, // TODO: Implement DB query time tracking
          },
          apiStats: {
            responseTimeData: apiTimeSeriesData.map(d => ({
              time: d.time,
              avgResponseTime: Math.round(d.avgResponseTime),
              maxResponseTime: Math.round(d.maxResponseTime),
            })),
            requestData: apiTimeSeriesData.map(d => ({
              time: d.time,
              total: d.total,
              errors: d.errors,
            })),
          },
          exchangeStats: exchangeStatsFormatted,
          systemStatus: {
            isHealthy: errorRate < 5 && stats.avgResponseTime < 1000,
            uptime: "99.9%", // TODO: Implement actual uptime tracking
          },
        };
      }),

    recentErrors: adminProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(10),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        const { errorLogs } = await import("../drizzle/schema");
        return await db
          .select()
          .from(errorLogs)
          .orderBy(desc(errorLogs.createdAt))
          .limit(input.limit);
      }),

    activeAlerts: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];

      const { alerts } = await import("../drizzle/schema");
      return await db
        .select()
        .from(alerts)
        .where(sql`${alerts.resolved} = 0`)
        .orderBy(desc(alerts.severity), desc(alerts.createdAt))
        .limit(20);
    }),

    acknowledgeAlert: adminProcedure
      .input(z.object({
        alertId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const { alerts } = await import("../drizzle/schema");
        await db
          .update(alerts)
          .set({
            acknowledged: true,
            acknowledgedBy: ctx.user.id,
            acknowledgedAt: new Date(),
          })
          .where(eq(alerts.id, input.alertId));

        return { success: true };
      }),

    resolveAlert: adminProcedure
      .input(z.object({
        alertId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const { alerts } = await import("../drizzle/schema");
        await db
          .update(alerts)
          .set({
            resolved: true,
            resolvedAt: new Date(),
          })
          .where(eq(alerts.id, input.alertId));

        return { success: true };
      }),

    // Deposit Management
    deposits: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      
      const depositsWithUsers = await db
        .select({
          id: deposits.id,
          userId: deposits.userId,
          asset: deposits.asset,
          amount: deposits.amount,
          network: deposits.network,
          status: deposits.status,
          provider: deposits.provider,
          externalId: deposits.externalId,
          txHash: deposits.externalId,
          createdAt: deposits.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(deposits)
        .leftJoin(users, eq(deposits.userId, users.id))
        .orderBy(desc(deposits.createdAt))
        .limit(200);

      return depositsWithUsers;
    }),

    updateDepositStatus: adminProcedure
      .input(z.object({
        depositId: z.number(),
        status: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db.update(deposits)
          .set({ status: input.status as "pending" | "completed" | "failed" })
          .where(eq(deposits.id, input.depositId));

        return { success: true };
      }),

    creditDepositBalance: adminProcedure
      .input(z.object({
        depositId: z.number(),
        userId: z.number(),
        amount: z.string(),
        asset: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const amount = parseFloat(input.amount);
        if (amount <= 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Amount must be positive" });
        }

        // Get or create wallet
        const [existingWallet] = await db.select()
          .from(wallets)
          .where(
            and(
              eq(wallets.userId, input.userId),
              eq(wallets.asset, input.asset)
            )
          )
          .limit(1);

        if (existingWallet) {
          // Update existing wallet
          await db.update(wallets)
            .set({ 
              balance: sql`${wallets.balance} + ${input.amount}`,
              updatedAt: new Date()
            })
            .where(
              and(
                eq(wallets.userId, input.userId),
                eq(wallets.asset, input.asset)
              )
            );
        } else {
          // Create new wallet
          await db.insert(wallets).values({
            userId: input.userId,
            asset: input.asset,
            balance: input.amount,
            locked: "0",
          });
        }

        // Update deposit status to completed
        await db.update(deposits)
          .set({ 
            status: "completed"
          })
          .where(eq(deposits.id, input.depositId));

        // Log transaction
        await db.insert(transactions).values({
          userId: input.userId,
          type: "deposit",
          asset: input.asset,
          amount: input.amount,
          status: "completed",
          reference: `Deposit credited by admin (${ctx.user.email}) - Deposit ID: ${input.depositId}`,
        });

        // Create notification for user
        await db.insert(notifications).values({
          userId: input.userId,
          type: "deposit",
          title: "Deposit Credited",
          message: `Your deposit of ${input.amount} ${input.asset} has been credited to your account.`,
          isRead: false,
        });

        // Send deposit confirmation email
        try {
          const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
          const [deposit] = await db.select().from(deposits).where(eq(deposits.id, input.depositId)).limit(1);
          if (user && deposit) {
            await sendDepositConfirmationEmail({
              to: user.email,
              asset: input.asset,
              amount: input.amount,
              network: deposit.network || "N/A",
            });
          }
        } catch (error) {
          console.error("Failed to send deposit confirmation email:", error);
          // Don't fail the credit if email fails
        }

        return { success: true };
      }),
  }),

  trade: router({
    placeOrder: protectedProcedure
      .input(z.object({
        pair: z.string(),
        side: z.enum(["buy", "sell"]),
        type: z.enum(["limit", "market"]),
        price: z.string().optional(),
        amount: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        console.log("[ROUTER] placeOrder mutation called", {
          userId: ctx.user.id,
          pair: input.pair,
          side: input.side,
          type: input.type,
          price: input.price,
          amount: input.amount
        });
        const { placeOrder } = await import("./tradingEngine");
        const result = await placeOrder({
          userId: ctx.user.id,
          ...input,
        });
        console.log("[ROUTER] placeOrder result:", result);
        return result;
      }),

    orderBook: publicProcedure
      .input(z.object({ pair: z.string() }))
      .query(async ({ input }) => {
        const { getOrderBook } = await import("./tradingEngine");
        return await getOrderBook(input.pair);
      }),

    myOrders: protectedProcedure
      .input(z.object({ pair: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const { getUserOrders } = await import("./tradingEngine");
        return await getUserOrders(ctx.user.id, input?.pair);
      }),

    cancelOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { cancelOrder } = await import("./tradingEngine");
        return await cancelOrder(input.orderId, ctx.user.id);
      }),

    recentTrades: publicProcedure
      .input(z.object({ pair: z.string(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        const { getRecentTrades } = await import("./tradingEngine");
        return await getRecentTrades(input.pair, input.limit);
      }),

    tradingPairs: publicProcedure.query(async () => {
      // Return available trading pairs
      // TODO: Store in database and make configurable by admin
      return [
        { pair: "BTC/USDT", baseAsset: "BTC", quoteAsset: "USDT", minAmount: "0.0001", maxAmount: "100" },
        { pair: "ETH/USDT", baseAsset: "ETH", quoteAsset: "USDT", minAmount: "0.001", maxAmount: "1000" },
        { pair: "BNB/USDT", baseAsset: "BNB", quoteAsset: "USDT", minAmount: "0.01", maxAmount: "10000" },
        { pair: "SOL/USDT", baseAsset: "SOL", quoteAsset: "USDT", minAmount: "0.1", maxAmount: "10000" },
        { pair: "MATIC/USDT", baseAsset: "MATIC", quoteAsset: "USDT", minAmount: "1", maxAmount: "100000" },
      ];
    }),

    // Export user's trading history as CSV
    exportTrades: protectedProcedure
      .input(z.object({ pair: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        // Get user's trades
        const conditions = [eq(trades.buyerId, ctx.user.id)];
        if (input?.pair) {
          conditions.push(eq(trades.pair, input.pair));
        }
        const userTrades = await db.select()
          .from(trades)
          .where(and(...conditions))
          .orderBy(desc(trades.createdAt));
        
        // Generate CSV
        const headers = ['Date', 'Pair', 'Side', 'Price', 'Amount', 'Total', 'Fee', 'Status'];
        const rows = userTrades.map((trade: any) => [
          new Date(trade.createdAt).toISOString(),
          trade.pair,
          trade.buyerId === ctx.user.id ? 'BUY' : 'SELL',
          trade.price,
          trade.amount,
          (parseFloat(trade.price) * parseFloat(trade.amount)).toFixed(2),
          trade.fee || '0',
          'COMPLETED'
        ]);
        
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        return { csv, filename: `trades_${Date.now()}.csv` };
      }),

    // Real Trading Engine - Live Exchange Integration
    livePrice: publicProcedure
      .input(z.object({ symbol: z.string() }))
      .query(async ({ input }) => {
        const { getLivePrice } = await import("./exchangeConnector");
        return await getLivePrice(input.symbol);
      }),

    liveOrderBook: publicProcedure
      .input(z.object({ 
        symbol: z.string(),
        limit: z.number().optional().default(20)
      }))
      .query(async ({ input }) => {
        const { getOrderBook } = await import("./exchangeConnector");
        return await getOrderBook(input.symbol, input.limit);
      }),

    placeExchangeOrder: protectedProcedure
      .input(z.object({
        symbol: z.string(),
        side: z.enum(["buy", "sell"]),
        type: z.enum(["limit", "market"]),
        amount: z.number(),
        price: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { placeExchangeOrder } = await import("./exchangeConnector");
        return await placeExchangeOrder(input);
      }),

    exchangeOrderStatus: protectedProcedure
      .input(z.object({ 
        orderId: z.string(),
        symbol: z.string()
      }))
      .query(async ({ input }) => {
        const { getOrderStatus } = await import("./exchangeConnector");
        return await getOrderStatus(input.orderId, input.symbol);
      }),

    cancelExchangeOrder: protectedProcedure
      .input(z.object({ 
        orderId: z.string(),
        symbol: z.string()
      }))
      .mutation(async ({ input }) => {
        const { cancelExchangeOrder } = await import("./exchangeConnector");
        return await cancelExchangeOrder(input.orderId, input.symbol);
      }),

    availablePairs: publicProcedure
      .query(async () => {
        const { getAvailablePairs } = await import("./exchangeConnector");
        return await getAvailablePairs();
      }),

    exchangeBalance: protectedProcedure
      .query(async () => {
        const { getExchangeBalance } = await import("./exchangeConnector");
        return await getExchangeBalance();
      }),

    tradeHistory: publicProcedure
      .input(z.object({ 
        symbol: z.string(),
        limit: z.number().optional().default(50)
      }))
      .query(async ({ input }) => {
        const { getTradeHistory } = await import("./exchangeConnector");
        return await getTradeHistory(input.symbol, input.limit);
      }),

    // DEBUG: Manually trigger matching engine for an order
    debugMatchOrder: adminProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        console.log("[DEBUG_MATCH] Manually triggering matchOrder for orderId:", input.orderId);
        const { matchOrder } = await import("./tradingEngine");
        const executedTrades = await matchOrder(db, input.orderId);
        console.log("[DEBUG_MATCH] Executed trades:", executedTrades);
        
        return { success: true, tradesCount: executedTrades.length, trades: executedTrades };
      }),
  }),

  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(notifications)
        .where(eq(notifications.userId, ctx.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(50);
    }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return 0;
      const [result] = await db.select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.isRead, false)
        ));
      return result?.count ?? 0;
    }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db.update(notifications)
          .set({ isRead: true })
          .where(and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.user.id)
          ));
        return { success: true };
      }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.isRead, false)
        ));
      return { success: true };
    }),
  }),

  transactions: router({
    getHistory: protectedProcedure
      .input(z.object({
        type: z.enum(["deposit", "withdrawal", "trade"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];

        const { transactions } = await import("../drizzle/schema");
        let conditions = [eq(transactions.userId, ctx.user.id)];

        if (input.type) {
          conditions.push(eq(transactions.type, input.type));
        }

        if (input.startDate) {
          conditions.push(gte(transactions.createdAt, new Date(input.startDate)));
        }

        if (input.endDate) {
          const endDateTime = new Date(input.endDate);
          endDateTime.setHours(23, 59, 59, 999);
          conditions.push(lte(transactions.createdAt, endDateTime));
        }

        const result = await db
          .select()
          .from(transactions)
          .where(and(...conditions))
          .orderBy(desc(transactions.createdAt));

        return result;
      }),
  }),

  user: router({
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const updateData: any = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.email !== undefined) {
          // Check if email is already taken
          const existing = await db.select().from(users)
            .where(and(eq(users.email, input.email), sql`id != ${ctx.user.id}`))
            .limit(1);
          if (existing.length > 0) {
            throw new TRPCError({ code: "CONFLICT", message: "Email already in use" });
          }
          updateData.email = input.email;
        }

        if (Object.keys(updateData).length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No fields to update" });
        }

        await db.update(users).set(updateData).where(eq(users.id, ctx.user.id));
        return { success: true };
      }),

    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      }))
      .mutation(async ({ ctx, input }) => { const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Get user with password
        const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
        if (!user || !user.password) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        // Verify current password
        const isValid = await comparePassword(input.currentPassword, user.password);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
        }

        // Hash and update new password
        const hashedPassword = await hashPassword(input.newPassword);
        await db.update(users).set({ password: hashedPassword }).where(eq(users.id, ctx.user.id));

        return { success: true };
      }),
  }),

  referral: router({
    // Get user's referral stats
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const userId = ctx.user.id;

      // Get user's referral code
      const user = await db.select({ referralCode: users.referralCode })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      let referralCode = user[0]?.referralCode;

      // Generate referral code if missing
      if (!referralCode) {
        referralCode = `REF${userId}${Date.now().toString(36).toUpperCase()}`;
        await db.update(users)
          .set({ referralCode })
          .where(eq(users.id, userId));
      }

      // Count total referrals
      const totalReferrals = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.referredBy, userId));

      // Get referral list with details
      const referralList = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
        .from(users)
        .where(eq(users.referredBy, userId))
        .orderBy(desc(users.createdAt))
        .limit(50);

      // Calculate total rewards (placeholder - implement based on your reward logic)
      const pendingRewards = 0;
      const earnedRewards = 0;

      return {
        referralCode,
        totalReferrals: totalReferrals[0]?.count || 0,
        pendingRewards,
        earnedRewards,
        referrals: referralList,
      };
    }),

    // Get referral history
    getHistory: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const userId = ctx.user.id;

      // Get list of users referred by this user
      const referrals = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
        .from(users)
        .where(eq(users.referredBy, userId))
        .orderBy(desc(users.createdAt));

      return referrals;
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
    history: publicProcedure
      .input(z.object({ 
        asset: z.string(),
        timeframe: z.enum(["24h", "7d", "30d"]).default("24h")
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        // Calculate cutoff date based on timeframe
        const now = new Date();
        const cutoffDate = new Date();
        if (input.timeframe === "24h") {
          cutoffDate.setHours(now.getHours() - 24);
        } else if (input.timeframe === "7d") {
          cutoffDate.setDate(now.getDate() - 7);
        } else if (input.timeframe === "30d") {
          cutoffDate.setDate(now.getDate() - 30);
        }
        
        // Fetch historical prices from database
        const { cryptoPrices } = await import("../drizzle/schema");
        const prices = await db
          .select()
          .from(cryptoPrices)
          .where(and(
            eq(cryptoPrices.asset, input.asset),
            gte(cryptoPrices.lastUpdated, cutoffDate)
          ))
          .orderBy(cryptoPrices.lastUpdated);
        
        return prices.map(p => ({
          timestamp: p.lastUpdated.getTime(),
          price: parseFloat(p.price),
          high: parseFloat(p.high24h),
          low: parseFloat(p.low24h),
          volume: parseFloat(p.volume24h),
        }));
      }),
  }),

  // Portfolio Analytics
  portfolio: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const { getPortfolioSummary } = await import("./portfolioAnalytics");
      return await getPortfolioSummary(ctx.user.id);
    }),
    profitLoss: protectedProcedure.query(async ({ ctx }) => {
      const { getProfitLoss } = await import("./portfolioAnalytics");
      return await getProfitLoss(ctx.user.id);
    }),
    history: protectedProcedure.query(async ({ ctx }) => {
      const { getPortfolioHistory } = await import("./portfolioAnalytics");
      return await getPortfolioHistory(ctx.user.id);
    }),
  }),

  // Price Alerts
  alerts: router({
    create: protectedProcedure
      .input(z.object({
        asset: z.string(),
        targetPrice: z.number().positive(),
        condition: z.enum(["above", "below"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const { priceAlerts } = await import("../drizzle/schema");
        await db.insert(priceAlerts).values({
          userId: ctx.user.id,
          asset: input.asset,
          targetPrice: input.targetPrice.toFixed(8),
          condition: input.condition,
          isActive: true,
          notificationSent: false,
        });

        return { success: true, message: "Price alert created successfully" };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const { priceAlerts } = await import("../drizzle/schema");
      const alerts = await db
        .select()
        .from(priceAlerts)
        .where(eq(priceAlerts.userId, ctx.user.id))
        .orderBy(desc(priceAlerts.createdAt));

      return alerts;
    }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const { priceAlerts } = await import("../drizzle/schema");
        await db
          .delete(priceAlerts)
          .where(and(
            eq(priceAlerts.id, input.id),
            eq(priceAlerts.userId, ctx.user.id)
          ));

        return { success: true, message: "Alert deleted successfully" };
      }),

    toggle: protectedProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const { priceAlerts } = await import("../drizzle/schema");
        await db
          .update(priceAlerts)
          .set({ isActive: input.isActive, notificationSent: false })
          .where(and(
            eq(priceAlerts.id, input.id),
            eq(priceAlerts.userId, ctx.user.id)
          ));

        return { success: true, message: `Alert ${input.isActive ? "activated" : "deactivated"}` };
      }),
  }),

  // Business Metrics
  analytics: router({
    portfolioDistribution: protectedProcedure.query(async ({ ctx }) => {
      const { getPortfolioDistribution } = await import("./analytics");
      return await getPortfolioDistribution(ctx.user.id);
    }),
    profitLoss: protectedProcedure.query(async ({ ctx }) => {
      const { getProfitLoss } = await import("./analytics");
      return await getProfitLoss(ctx.user.id);
    }),
    bestPerformers: protectedProcedure.query(async ({ ctx }) => {
      const { getBestPerformers } = await import("./analytics");
      return await getBestPerformers(ctx.user.id);
    }),
    worstPerformers: protectedProcedure.query(async ({ ctx }) => {
      const { getWorstPerformers } = await import("./analytics");
      return await getWorstPerformers(ctx.user.id);
    }),
    portfolioHistory: protectedProcedure
      .input(z.object({ timeframe: z.enum(["7d", "30d"]) }))
      .query(async ({ ctx, input }) => {
        const { getPortfolioHistory } = await import("./analytics");
        return await getPortfolioHistory(ctx.user.id, input.timeframe);
      }),
  }),

  businessMetrics: router({
    transactionVolume: adminProcedure.query(async () => {
      const { getTransactionVolumeMetrics } = await import("./businessMetrics");
      return await getTransactionVolumeMetrics();
    }),
    conversion: adminProcedure.query(async () => {
      const { getConversionMetrics } = await import("./businessMetrics");
      return await getConversionMetrics();
    }),
    revenue: adminProcedure.query(async () => {
      const { getRevenueMetrics } = await import("./businessMetrics");
      return await getRevenueMetrics();
    }),
  }),
});

export type AppRouter = typeof appRouter;
