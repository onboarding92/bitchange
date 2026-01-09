/**
 * Payment Gateway Manager
 * 
 * Manages payment gateway integrations (ChangeNOW, Simplex, MoonPay, etc.)
 * Handles API key encryption/decryption and gateway configuration.
 */

import { getDb } from "./db";
import { paymentGateways } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-encryption-key-change-me';
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt data using AES-256-CBC
 */
function encrypt(text: string): string {
  if (!text) return '';
  
  const key = scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return IV + encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt encrypted data
 */
function decrypt(encryptedData: string): string {
  if (!encryptedData) return '';
  
  const [ivHex, encrypted] = encryptedData.split(':');
  const key = scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Get all payment gateways (admin view)
 */
export async function getAllPaymentGateways() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      id: paymentGateways.id,
      name: paymentGateways.name,
      isActive: paymentGateways.isActive,
      isSandbox: paymentGateways.isSandbox,
      supportedCurrencies: paymentGateways.supportedCurrencies,
      config: paymentGateways.config,
      createdAt: paymentGateways.createdAt,
      updatedAt: paymentGateways.updatedAt,
    })
    .from(paymentGateways);
}

/**
 * Get active payment gateways (public view)
 */
export async function getActivePaymentGateways() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      id: paymentGateways.id,
      name: paymentGateways.name,
      supportedCurrencies: paymentGateways.supportedCurrencies,
      config: paymentGateways.config,
    })
    .from(paymentGateways)
    .where(eq(paymentGateways.isActive, true));
}

/**
 * Get payment gateway configuration with decrypted API keys (ADMIN ONLY)
 */
export async function getPaymentGatewayConfig(gatewayId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [gateway] = await db
    .select()
    .from(paymentGateways)
    .where(eq(paymentGateways.id, gatewayId))
    .limit(1);
  
  if (!gateway) return null;
  
  try {
    return {
      ...gateway,
      apiKey: gateway.apiKeyEncrypted ? decrypt(gateway.apiKeyEncrypted) : null,
      apiSecret: gateway.apiSecretEncrypted ? decrypt(gateway.apiSecretEncrypted) : null,
    };
  } catch (error) {
    console.error('[PaymentGateway] Failed to decrypt API keys:', error);
    return null;
  }
}

/**
 * Update payment gateway API keys
 */
export async function updatePaymentGatewayKeys(
  gatewayId: number,
  apiKey: string,
  apiSecret?: string,
  webhookSecret?: string
) {
  const db = await getDb();
  if (!db) return false;
  
  const updateData: any = {
    apiKeyEncrypted: encrypt(apiKey),
  };
  
  if (apiSecret) {
    updateData.apiSecretEncrypted = encrypt(apiSecret);
  }
  
  if (webhookSecret) {
    updateData.webhookSecret = webhookSecret;
  }
  
  await db
    .update(paymentGateways)
    .set(updateData)
    .where(eq(paymentGateways.id, gatewayId));
  
  return true;
}

/**
 * Toggle payment gateway active status
 */
export async function togglePaymentGateway(gatewayId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) return false;
  
  await db
    .update(paymentGateways)
    .set({ isActive })
    .where(eq(paymentGateways.id, gatewayId));
  
  return true;
}

/**
 * Toggle payment gateway sandbox mode
 */
export async function togglePaymentGatewaySandbox(gatewayId: number, isSandbox: boolean) {
  const db = await getDb();
  if (!db) return false;
  
  await db
    .update(paymentGateways)
    .set({ isSandbox })
    .where(eq(paymentGateways.id, gatewayId));
  
  return true;
}

/**
 * Gateway-specific integration helpers
 */

export interface PaymentGatewayLink {
  url: string;
  method: 'GET' | 'POST';
  params?: Record<string, string>;
}

/**
 * Generate payment link for ChangeNOW
 */
export function generateChangeNowLink(asset: string, amount: string, address: string): PaymentGatewayLink {
  return {
    url: 'https://changenow.io/exchange',
    method: 'GET',
    params: {
      from: 'usd',
      to: asset.toLowerCase(),
      amount,
      address,
    },
  };
}

/**
 * Generate payment link for Simplex
 */
export function generateSimplexLink(asset: string, amount: string, walletAddress: string, apiKey: string): PaymentGatewayLink {
  return {
    url: 'https://checkout.simplex.com',
    method: 'GET',
    params: {
      crypto: asset,
      fiat: 'USD',
      requested_amount: amount,
      wallet_address: walletAddress,
      partner: apiKey,
    },
  };
}

/**
 * Generate payment link for MoonPay
 */
export function generateMoonPayLink(asset: string, amount: string, walletAddress: string, apiKey: string): PaymentGatewayLink {
  return {
    url: 'https://buy.moonpay.com',
    method: 'GET',
    params: {
      apiKey,
      currencyCode: asset.toLowerCase(),
      baseCurrencyAmount: amount,
      walletAddress,
    },
  };
}

/**
 * Generate payment link for Transak
 */
export function generateTransakLink(asset: string, amount: string, walletAddress: string, apiKey: string): PaymentGatewayLink {
  return {
    url: 'https://global.transak.com',
    method: 'GET',
    params: {
      apiKey,
      cryptoCurrencyCode: asset,
      fiatAmount: amount,
      walletAddress,
      network: 'ethereum', // TODO: Make dynamic based on asset
    },
  };
}

/**
 * Generate payment link for Mercuryo
 */
export function generateMercuryoLink(asset: string, amount: string, walletAddress: string, apiKey: string): PaymentGatewayLink {
  return {
    url: 'https://exchange.mercuryo.io',
    method: 'GET',
    params: {
      widget_id: apiKey,
      currency: asset,
      fiat_amount: amount,
      address: walletAddress,
    },
  };
}

/**
 * Generate payment link for CoinGate
 */
export function generateCoinGateLink(asset: string, amount: string): PaymentGatewayLink {
  return {
    url: 'https://coingate.com/buy',
    method: 'GET',
    params: {
      crypto_currency: asset.toLowerCase(),
      fiat_amount: amount,
    },
  };
}

/**
 * Generate payment link for Changelly
 */
export function generateChangellyLink(asset: string, amount: string, address: string): PaymentGatewayLink {
  return {
    url: 'https://changelly.com/exchange',
    method: 'GET',
    params: {
      from: 'usd',
      to: asset.toLowerCase(),
      amount,
      address,
    },
  };
}

/**
 * Generate payment link for Banxa
 */
export function generateBanxaLink(asset: string, amount: string, walletAddress: string): PaymentGatewayLink {
  return {
    url: 'https://banxa.com/buy',
    method: 'GET',
    params: {
      coinType: asset,
      fiatAmount: amount,
      walletAddress,
    },
  };
}

/**
 * Get payment link for any gateway
 */
export async function getPaymentGatewayLink(
  gatewayName: string,
  asset: string,
  amount: string,
  walletAddress: string
): Promise<PaymentGatewayLink | null> {
  const db = await getDb();
  if (!db) return null;
  
  const [gateway] = await db
    .select()
    .from(paymentGateways)
    .where(eq(paymentGateways.name, gatewayName))
    .limit(1);
  
  if (!gateway || !gateway.isActive) return null;
  
  const apiKey = gateway.apiKeyEncrypted ? decrypt(gateway.apiKeyEncrypted) : '';
  
  switch (gatewayName.toLowerCase()) {
    case 'changenow':
      return generateChangeNowLink(asset, amount, walletAddress);
    case 'simplex':
      return generateSimplexLink(asset, amount, walletAddress, apiKey);
    case 'moonpay':
      return generateMoonPayLink(asset, amount, walletAddress, apiKey);
    case 'transak':
      return generateTransakLink(asset, amount, walletAddress, apiKey);
    case 'mercuryo':
      return generateMercuryoLink(asset, amount, walletAddress, apiKey);
    case 'coingate':
      return generateCoinGateLink(asset, amount);
    case 'changelly':
      return generateChangellyLink(asset, amount, walletAddress);
    case 'banxa':
      return generateBanxaLink(asset, amount, walletAddress);
    default:
      return null;
  }
}
