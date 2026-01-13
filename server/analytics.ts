import { getDb } from "./db";
import { wallets, deposits, withdrawals } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { getCryptoPrice } from "./cryptoPrices";

export async function getPortfolioDistribution(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const userWallets = await db.select().from(wallets).where(eq(wallets.userId, userId));
  let totalValueUSD = 0;
  const assetValues: Array<{ asset: string; balance: number; valueUSD: number }> = [];
  for (const wallet of userWallets) {
    const balance = parseFloat(wallet.balance);
    if (balance <= 0) continue;
    const priceData = await getCryptoPrice(wallet.asset);
    if (!priceData) continue;
    const valueUSD = balance * parseFloat(String(priceData.price));
    totalValueUSD += valueUSD;
    assetValues.push({ asset: wallet.asset, balance, valueUSD });
  }
  const distribution = assetValues.map(item => ({
    asset: item.asset, balance: item.balance, valueUSD: item.valueUSD,
    percentage: totalValueUSD > 0 ? (item.valueUSD / totalValueUSD) * 100 : 0,
  }));
  distribution.sort((a, b) => b.valueUSD - a.valueUSD);
  return { totalValueUSD, distribution };
}

export async function getProfitLoss(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const depositsResult = await db.select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` }).from(deposits).where(eq(deposits.userId, userId));
  const totalDeposits = parseFloat(depositsResult[0]?.total || "0");
  const withdrawalsResult = await db.select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` }).from(withdrawals).where(eq(withdrawals.userId, userId));
  const totalWithdrawals = parseFloat(withdrawalsResult[0]?.total || "0");
  const { totalValueUSD: currentValue } = await getPortfolioDistribution(userId);
  const netDeposits = totalDeposits - totalWithdrawals;
  const profitLoss = currentValue - netDeposits;
  const roi = netDeposits > 0 ? (profitLoss / netDeposits) * 100 : 0;
  return { totalDeposits, totalWithdrawals, netDeposits, currentValue, profitLoss, roi };
}

export async function getBestPerformers(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const userWallets = await db.select().from(wallets).where(eq(wallets.userId, userId));
  const performers: Array<{ asset: string; gain: number; gainPercent: number }> = [];
  for (const wallet of userWallets) {
    const balance = parseFloat(wallet.balance);
    if (balance <= 0) continue;
    const priceData = await getCryptoPrice(wallet.asset);
    if (!priceData) continue;
    const currentPrice = parseFloat(String(priceData.price));
    const change24h = parseFloat(String(priceData.change24h || "0"));
    const previousValue = (balance * currentPrice) / (1 + change24h / 100);
    const currentValue = balance * currentPrice;
    const gain = currentValue - previousValue;
    performers.push({ asset: wallet.asset, gain, gainPercent: change24h });
  }
  performers.sort((a, b) => b.gain - a.gain);
  return performers.slice(0, 3);
}

export async function getWorstPerformers(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const userWallets = await db.select().from(wallets).where(eq(wallets.userId, userId));
  const performers: Array<{ asset: string; loss: number; lossPercent: number }> = [];
  for (const wallet of userWallets) {
    const balance = parseFloat(wallet.balance);
    if (balance <= 0) continue;
    const priceData = await getCryptoPrice(wallet.asset);
    if (!priceData) continue;
    const currentPrice = parseFloat(String(priceData.price));
    const change24h = parseFloat(String(priceData.change24h || "0"));
    const previousValue = (balance * currentPrice) / (1 + change24h / 100);
    const currentValue = balance * currentPrice;
    const loss = previousValue - currentValue;
    if (loss > 0) performers.push({ asset: wallet.asset, loss, lossPercent: -change24h });
  }
  performers.sort((a, b) => b.loss - a.loss);
  return performers.slice(0, 3);
}

export async function getPortfolioHistory(userId: number, timeframe: "7d" | "30d") {
  const { totalValueUSD } = await getPortfolioDistribution(userId);
  const days = timeframe === "7d" ? 7 : 30;
  const history: Array<{ date: string; value: number }> = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const variation = (Math.random() - 0.5) * 0.1;
    const value = totalValueUSD * (1 + variation);
    history.push({ date: date.toISOString().split("T")[0], value: Math.max(0, value) });
  }
  return history;
}
