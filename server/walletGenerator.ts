import { ethers } from "ethers";
import crypto from "crypto";

/**
 * Genera wallet address deterministico per un utente e asset
 * Usa derivation deterministico dal userId per garantire stesso address ogni volta
 */

const MASTER_SEED = process.env.WALLET_MASTER_SEED || "bitchange-pro-master-seed-change-in-production";

export function generateWalletAddress(userId: number, asset: string): { address: string; network: string } {
  const seed = `${MASTER_SEED}-${userId}-${asset}`;
  const hash = crypto.createHash("sha256").update(seed).digest("hex");

  // Per Ethereum e token ERC20 (ETH, USDT, USDC, etc.)
  if (["ETH", "USDT", "USDC", "DAI", "LINK"].includes(asset)) {
    const wallet = new ethers.Wallet("0x" + hash);
    return {
      address: wallet.address,
      network: "Ethereum (ERC20)",
    };
  }

  // Per Binance Smart Chain tokens (BNB, BUSD, etc.)
  if (["BNB", "BUSD"].includes(asset)) {
    const wallet = new ethers.Wallet("0x" + hash);
    return {
      address: wallet.address,
      network: "BSC (BEP20)",
    };
  }

  // Per Bitcoin (simulato - in produzione usare bitcoinjs-lib)
  if (asset === "BTC") {
    const btcHash = crypto.createHash("sha256").update(`btc-${seed}`).digest("hex");
    // Simulazione address Bitcoin (in produzione generare address reale)
    return {
      address: `bc1q${btcHash.substring(0, 38)}`,
      network: "Bitcoin",
    };
  }

  // Per altre crypto, usa Ethereum address come fallback
  const wallet = new ethers.Wallet(hash);
  return {
    address: wallet.address,
    network: "Ethereum (ERC20)",
  };
}

/**
 * Verifica se un address è valido per l'asset specificato
 */
export function isValidAddress(address: string, asset: string): boolean {
  try {
    if (["ETH", "USDT", "USDC", "BNB", "DAI", "LINK", "BUSD"].includes(asset)) {
      return ethers.isAddress(address);
    }
    if (asset === "BTC") {
      // Validazione semplificata Bitcoin
      return address.startsWith("bc1q") && address.length >= 42;
    }
    return false;
  } catch {
    return false;
  }
}
