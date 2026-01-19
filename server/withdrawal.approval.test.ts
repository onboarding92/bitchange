import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, wallets, withdrawals } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Withdrawal Approval System", () => {
  let testUserId: number;
  let testAdminId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user
    const [user] = await db.insert(users).values({
      openId: `test-user-${Date.now()}`,
      name: "Test User",
      email: "testuser@example.com",
      role: "user",
    });
    testUserId = user.insertId;

    // Create test admin
    const [admin] = await db.insert(users).values({
      openId: `test-admin-${Date.now()}`,
      name: "Test Admin",
      email: "admin@bitchangemoney.xyz",
      role: "admin",
    });
    testAdminId = admin.insertId;

    // Create test wallet with balance
    await db.insert(wallets).values({
      userId: testUserId,
      asset: "BTC",
      balance: "1.0",
      locked: "0.0",
    });
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup test data
    await db.delete(withdrawals).where(eq(withdrawals.userId, testUserId));
    await db.delete(wallets).where(eq(wallets.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
    await db.delete(users).where(eq(users.id, testAdminId));
  });

  it("should create withdrawal with pending_approval status", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Insert a test withdrawal
    const [result] = await db.insert(withdrawals).values({
      userId: testUserId,
      asset: "BTC",
      amount: "0.1",
      network: "BTC",
      address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      fee: "0.0005",
      status: "pending_approval",
    });

    expect(result.insertId).toBeDefined();

    // Verify withdrawal was created with correct status
    const [withdrawal] = await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.id, result.insertId))
      .limit(1);

    expect(withdrawal).toBeDefined();
    expect(withdrawal.status).toBe("pending_approval");
    expect(withdrawal.userId).toBe(testUserId);
    expect(withdrawal.asset).toBe("BTC");
    expect(withdrawal.amount).toBe("0.10000000");
  });

  it("should have approval fields in withdrawals table", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Insert a test withdrawal
    const [result] = await db.insert(withdrawals).values({
      userId: testUserId,
      asset: "BTC",
      amount: "0.1",
      network: "BTC",
      address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      fee: "0.0005",
      status: "pending_approval",
    });

    // Approve the withdrawal
    await db
      .update(withdrawals)
      .set({
        status: "completed",
        approvedBy: testAdminId,
        approvedAt: new Date(),
      })
      .where(eq(withdrawals.id, result.insertId));

    // Verify approval fields
    const [withdrawal] = await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.id, result.insertId))
      .limit(1);

    expect(withdrawal.status).toBe("completed");
    expect(withdrawal.approvedBy).toBe(testAdminId);
    expect(withdrawal.approvedAt).toBeDefined();
  });

  it("should support rejected status with reason", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Insert a test withdrawal
    const [result] = await db.insert(withdrawals).values({
      userId: testUserId,
      asset: "BTC",
      amount: "0.1",
      network: "BTC",
      address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      fee: "0.0005",
      status: "pending_approval",
    });

    // Reject the withdrawal
    const rejectionReason = "Suspicious activity detected";
    await db
      .update(withdrawals)
      .set({
        status: "rejected",
        approvedBy: testAdminId,
        approvedAt: new Date(),
        rejectionReason,
      })
      .where(eq(withdrawals.id, result.insertId));

    // Verify rejection
    const [withdrawal] = await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.id, result.insertId))
      .limit(1);

    expect(withdrawal.status).toBe("rejected");
    expect(withdrawal.approvedBy).toBe(testAdminId);
    expect(withdrawal.rejectionReason).toBe(rejectionReason);
  });

  it("should query pending withdrawals for admin", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Insert multiple test withdrawals
    await db.insert(withdrawals).values([
      {
        userId: testUserId,
        asset: "BTC",
        amount: "0.1",
        network: "BTC",
        address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        fee: "0.0005",
        status: "pending_approval",
      },
      {
        userId: testUserId,
        asset: "ETH",
        amount: "1.0",
        network: "ERC20",
        address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        fee: "0.005",
        status: "pending_approval",
      },
    ]);

    // Query pending withdrawals
    const pendingWithdrawals = await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.status, "pending_approval"));

    expect(pendingWithdrawals.length).toBeGreaterThanOrEqual(2);
    expect(pendingWithdrawals.every((w) => w.status === "pending_approval")).toBe(true);
  });
});
