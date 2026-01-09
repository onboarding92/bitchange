#!/usr/bin/env node

/**
 * Generate Centralized Hot Wallets
 * 
 * This script generates ONE wallet per cryptocurrency/network for BitChange Pro.
 * All users will deposit to these centralized wallets using a unique reference ID.
 * 
 * SECURITY WARNING:
 * - Private keys are exported to CSV
 * - Store CSV in secure location (encrypted USB, password manager, cold storage)
 * - Never commit CSV to git
 * - Never share private keys
 * - Consider using hardware wallet for cold storage
 */

import { ethers } from 'ethers';
import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import bs58 from 'bs58';
import { createWriteStream } from 'fs';
import { join } from 'path';

// Initialize ECPair for Bitcoin wallet generation
const ECPair = ECPairFactory(ecc);

// Supported cryptocurrencies and networks
const CRYPTOS = [
  // Bitcoin networks
  { symbol: 'BTC', name: 'Bitcoin', network: 'Bitcoin', type: 'bitcoin' },
  
  // Ethereum and ERC-20 tokens (same wallet for all)
  { symbol: 'ETH', name: 'Ethereum', network: 'Ethereum', type: 'ethereum' },
  { symbol: 'USDT', name: 'Tether', network: 'Ethereum (ERC-20)', type: 'ethereum' },
  { symbol: 'USDC', name: 'USD Coin', network: 'Ethereum (ERC-20)', type: 'ethereum' },
  { symbol: 'LINK', name: 'Chainlink', network: 'Ethereum (ERC-20)', type: 'ethereum' },
  
  // Binance Smart Chain (BEP-20)
  { symbol: 'BNB', name: 'Binance Coin', network: 'BNB Chain', type: 'ethereum' },
  { symbol: 'USDT', name: 'Tether', network: 'BNB Chain (BEP-20)', type: 'ethereum', duplicate: true },
  
  // Other blockchains
  { symbol: 'ADA', name: 'Cardano', network: 'Cardano', type: 'cardano' },
  { symbol: 'SOL', name: 'Solana', network: 'Solana', type: 'solana' },
  { symbol: 'XRP', name: 'Ripple', network: 'XRP Ledger', type: 'ripple' },
  { symbol: 'DOT', name: 'Polkadot', network: 'Polkadot', type: 'polkadot' },
  { symbol: 'DOGE', name: 'Dogecoin', network: 'Dogecoin', type: 'dogecoin' },
  { symbol: 'AVAX', name: 'Avalanche', network: 'Avalanche C-Chain', type: 'ethereum' },
  { symbol: 'MATIC', name: 'Polygon', network: 'Polygon', type: 'ethereum' },
  { symbol: 'LTC', name: 'Litecoin', network: 'Litecoin', type: 'litecoin' },
  { symbol: 'XLM', name: 'Stellar', network: 'Stellar', type: 'stellar' },
];

/**
 * Generate Bitcoin wallet (P2WPKH - Native SegWit)
 */
function generateBitcoinWallet() {
  const keyPair = ECPair.makeRandom();
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: keyPair.publicKey,
    network: bitcoin.networks.bitcoin,
  });
  
  return {
    address,
    privateKey: keyPair.toWIF(),
    publicKey: keyPair.publicKey.toString('hex'),
  };
}

/**
 * Generate Ethereum-compatible wallet (ETH, BSC, AVAX, MATIC)
 */
function generateEthereumWallet() {
  const wallet = ethers.Wallet.createRandom();
  
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase || '',
  };
}

/**
 * Generate Solana wallet
 */
function generateSolanaWallet() {
  // For Solana, we'll use a placeholder
  // In production, use @solana/web3.js
  const wallet = ethers.Wallet.createRandom();
  const keypair = Buffer.from(wallet.privateKey.slice(2), 'hex');
  
  return {
    address: `SOL_${wallet.address.slice(0, 32)}`, // Placeholder
    privateKey: bs58.encode(keypair),
    note: 'Use @solana/web3.js Keypair.generate() for production',
  };
}

/**
 * Generate wallet based on type
 */
function generateWallet(type) {
  switch (type) {
    case 'bitcoin':
    case 'litecoin':
    case 'dogecoin':
      return generateBitcoinWallet();
    
    case 'ethereum':
      return generateEthereumWallet();
    
    case 'solana':
      return generateSolanaWallet();
    
    case 'cardano':
    case 'ripple':
    case 'polkadot':
    case 'stellar':
      // For these, we'll generate Ethereum wallet as placeholder
      // In production, use proper libraries for each blockchain
      const ethWallet = generateEthereumWallet();
      return {
        ...ethWallet,
        note: `Use proper ${type} library for production`,
      };
    
    default:
      throw new Error(`Unsupported wallet type: ${type}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔐 BitChange Pro - Hot Wallet Generator\n');
  console.log('⚠️  WARNING: This will generate private keys. Keep them SECURE!\n');
  
  const wallets = [];
  const uniqueWallets = new Map(); // Track unique wallets by network type
  
  // Generate wallets
  for (const crypto of CRYPTOS) {
    // Skip duplicates (e.g., USDT on multiple networks uses same ETH wallet)
    const walletKey = `${crypto.type}-${crypto.network}`;
    
    if (uniqueWallets.has(walletKey)) {
      const existingWallet = uniqueWallets.get(walletKey);
      wallets.push({
        ...crypto,
        ...existingWallet,
        note: crypto.duplicate ? 'Same wallet as Ethereum network' : '',
      });
      console.log(`✓ ${crypto.symbol} (${crypto.network}): Using existing wallet`);
      continue;
    }
    
    try {
      const wallet = generateWallet(crypto.type);
      uniqueWallets.set(walletKey, wallet);
      
      wallets.push({
        ...crypto,
        ...wallet,
      });
      
      console.log(`✓ ${crypto.symbol} (${crypto.network}): ${wallet.address}`);
    } catch (error) {
      console.error(`✗ ${crypto.symbol} (${crypto.network}): ${error.message}`);
    }
  }
  
  // Export to CSV
  const csvPath = join(process.cwd(), 'BitChange_Hot_Wallets_CONFIDENTIAL.csv');
  const csvStream = createWriteStream(csvPath);
  
  // CSV Header
  csvStream.write('Symbol,Name,Network,Type,Address,Private Key,Mnemonic,Public Key,Note\n');
  
  // CSV Rows
  for (const wallet of wallets) {
    const row = [
      wallet.symbol,
      wallet.name,
      wallet.network,
      wallet.type,
      wallet.address,
      wallet.privateKey || '',
      wallet.mnemonic || '',
      wallet.publicKey || '',
      wallet.note || '',
    ].map(field => `"${field}"`).join(',');
    
    csvStream.write(row + '\n');
  }
  
  csvStream.end();
  
  console.log('\n✅ Wallets generated successfully!\n');
  console.log(`📄 CSV exported to: ${csvPath}\n`);
  console.log('🔐 SECURITY CHECKLIST:\n');
  console.log('  [ ] Store CSV in encrypted location');
  console.log('  [ ] Backup CSV to secure offline storage');
  console.log('  [ ] Never commit CSV to git');
  console.log('  [ ] Never share private keys');
  console.log('  [ ] Consider hardware wallet for cold storage');
  console.log('  [ ] Delete CSV from server after secure backup\n');
  
  // Summary
  console.log('📊 SUMMARY:\n');
  console.log(`  Total cryptocurrencies: ${CRYPTOS.length}`);
  console.log(`  Unique wallets generated: ${uniqueWallets.size}`);
  console.log(`  Ethereum-compatible: ${wallets.filter(w => w.type === 'ethereum').length}`);
  console.log(`  Bitcoin-compatible: ${wallets.filter(w => w.type === 'bitcoin' || w.type === 'litecoin' || w.type === 'dogecoin').length}`);
  console.log(`  Other blockchains: ${wallets.filter(w => !['ethereum', 'bitcoin', 'litecoin', 'dogecoin'].includes(w.type)).length}\n`);
  
  console.log('⚠️  IMPORTANT: For production, replace placeholder wallets with proper implementations:\n');
  console.log('  - Solana: Use @solana/web3.js');
  console.log('  - Cardano: Use @emurgo/cardano-serialization-lib-nodejs');
  console.log('  - Ripple: Use ripple-lib');
  console.log('  - Polkadot: Use @polkadot/api');
  console.log('  - Stellar: Use stellar-sdk\n');
}

main().catch(console.error);
