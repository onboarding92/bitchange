import axios from "axios";
import { getDb } from "./db";
import { masterWallets } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Hot Wallet Monitor
 * Queries blockchain for wallet balances
 * Supports: ETH, BNB, MATIC, TRX, BTC, SOL
 */

interface WalletBalance {
  network: string;
  asset: string;
  address: string;
  balance: string;
  balanceUSD: number;
  lastChecked: Date;
}

/**
 * Get balance for Ethereum-compatible networks (ETH, BNB, MATIC)
 * Uses public RPC endpoints
 */
async function getEVMBalance(address: string, rpcUrl: string): Promise<string> {
  try {
    const response = await axios.post(rpcUrl, {
      jsonrpc: "2.0",
      method: "eth_getBalance",
      params: [address, "latest"],
      id: 1,
    }, { timeout: 10000 });

    const balanceHex = response.data.result;
    const balanceWei = BigInt(balanceHex);
    const balanceEther = Number(balanceWei) / 1e18;
    return balanceEther.toFixed(8);
  } catch (error: any) {
    console.error(`[HotWallet] Error fetching EVM balance:`, error.message);
    return "0";
  }
}

/**
 * Get balance for Tron network
 */
async function getTronBalance(address: string): Promise<string> {
  try {
    const response = await axios.get(
      `https://api.trongrid.io/v1/accounts/${address}`,
      { timeout: 10000 }
    );

    const balanceSun = response.data.data?.[0]?.balance || 0;
    const balanceTRX = balanceSun / 1e6;
    return balanceTRX.toFixed(6);
  } catch (error: any) {
    console.error(`[HotWallet] Error fetching TRX balance:`, error.message);
    return "0";
  }
}

/**
 * Get balance for Bitcoin
 */
async function getBitcoinBalance(address: string): Promise<string> {
  try {
    const response = await axios.get(
      `https://blockchain.info/q/addressbalance/${address}`,
      { timeout: 10000 }
    );

    const balanceSatoshi = parseInt(response.data);
    const balanceBTC = balanceSatoshi / 1e8;
    return balanceBTC.toFixed(8);
  } catch (error: any) {
    console.error(`[HotWallet] Error fetching BTC balance:`, error.message);
    return "0";
  }
}

/**
 * Get balance for Solana
 */
async function getSolanaBalance(address: string): Promise<string> {
  try {
    const response = await axios.post(
      "https://api.mainnet-beta.solana.com",
      {
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [address],
      },
      { timeout: 10000 }
    );

    const balanceLamports = response.data.result?.value || 0;
    const balanceSOL = balanceLamports / 1e9;
    return balanceSOL.toFixed(9);
  } catch (error: any) {
    console.error(`[HotWallet] Error fetching SOL balance:`, error.message);
    return "0";
  }
}

/**
 * Get current crypto price in USD
 */
async function getCryptoPrice(asset: string): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 0;

    // Query latest price from database
    const { cryptoPrices } = await import("../drizzle/schema");
    const priceRecord = await db
      .select()
      .from(cryptoPrices)
      .where(eq(cryptoPrices.asset, asset))
      .orderBy(cryptoPrices.lastUpdated)
      .limit(1);

    if (priceRecord.length > 0) {
      return parseFloat(priceRecord[0].price);
    }

    return 0;
  } catch (error: any) {
    console.error(`[HotWallet] Error fetching price for ${asset}:`, error.message);
    return 0;
  }
}

/**
 * Get all hot wallet balances
 */
export async function getAllHotWalletBalances(): Promise<WalletBalance[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get all master wallets
  const wallets = await db.select().from(masterWallets).where(eq(masterWallets.isActive, true));

  const balances: WalletBalance[] = [];

  for (const wallet of wallets) {
    let balance = "0";
    let price = 0;

    // Get balance based on network
    switch (wallet.network) {
      case "ETH":
        balance = await getEVMBalance(wallet.address, "https://eth.llamarpc.com");
        price = await getCryptoPrice("ETH");
        break;
      case "BNB":
        balance = await getEVMBalance(wallet.address, "https://bsc-dataseed.binance.org");
        price = await getCryptoPrice("BNB");
        break;
      case "MATIC":
        balance = await getEVMBalance(wallet.address, "https://polygon-rpc.com");
        price = await getCryptoPrice("MATIC");
        break;
      case "TRX":
        balance = await getTronBalance(wallet.address);
        price = await getCryptoPrice("TRX");
        break;
      case "BTC":
        balance = await getBitcoinBalance(wallet.address);
        price = await getCryptoPrice("BTC");
        break;
      case "SOL":
        balance = await getSolanaBalance(wallet.address);
        price = await getCryptoPrice("SOL");
        break;
      default:
        console.warn(`[HotWallet] Unsupported network: ${wallet.network}`);
    }

    const balanceUSD = parseFloat(balance) * price;

    balances.push({
      network: wallet.network,
      asset: wallet.asset,
      address: wallet.address,
      balance,
      balanceUSD,
      lastChecked: new Date(),
    });
  }

  return balances;
}

/**
 * Get total hot wallet balance in USD
 */
export async function getTotalHotWalletBalanceUSD(): Promise<number> {
  const balances = await getAllHotWalletBalances();
  return balances.reduce((sum, b) => sum + b.balanceUSD, 0);
}
