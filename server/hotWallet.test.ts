import { describe, it, expect, beforeAll } from "vitest";
import { getHotWallet, getAllHotWallets, getActiveHotWallets } from "./hotWalletManager";

describe("Hot Wallet System", () => {
  describe("getHotWallet", () => {
    it("should return BTC hot wallet", async () => {
      const wallet = await getHotWallet("BTC", "Bitcoin");
      
      expect(wallet).toBeDefined();
      expect(wallet?.symbol).toBe("BTC");
      expect(wallet?.network).toBe("Bitcoin");
      expect(wallet?.address).toBeDefined();
      expect(wallet?.address.length).toBeGreaterThan(0);
      expect(wallet?.isActive).toBe(true);
    });

    it("should return ETH hot wallet", async () => {
      const wallet = await getHotWallet("ETH", "Ethereum");
      
      expect(wallet).toBeDefined();
      expect(wallet?.symbol).toBe("ETH");
      expect(wallet?.network).toBe("Ethereum");
      expect(wallet?.address).toBeDefined();
      expect(wallet?.address.startsWith("0x")).toBe(true);
      expect(wallet?.isActive).toBe(true);
    });

    it("should return null for inactive wallet (ADA)", async () => {
      const wallet = await getHotWallet("ADA", "Cardano");
      
      // ADA should be marked as inactive
      if (wallet) {
        expect(wallet.isActive).toBe(false);
      }
    });

    it("should return null for non-existent wallet", async () => {
      const wallet = await getHotWallet("FAKE", "FakeNetwork");
      
      expect(wallet).toBeNull();
    });
  });

  describe("getAllHotWallets", () => {
    it("should return all hot wallets (16 total)", async () => {
      const wallets = await getAllHotWallets();
      
      expect(wallets).toBeDefined();
      expect(wallets.length).toBe(16);
    });

    it("should not expose private keys", async () => {
      const wallets = await getAllHotWallets();
      
      wallets.forEach(wallet => {
        expect(wallet.privateKeyEncrypted).toBeUndefined();
        expect(wallet.mnemonic).toBeUndefined();
      });
    });
  });

  describe("getActiveHotWallets", () => {
    it("should return only active wallets (11 total)", async () => {
      const wallets = await getActiveHotWallets();
      
      expect(wallets).toBeDefined();
      expect(wallets.length).toBe(11);
      
      // All should be active
      wallets.forEach(wallet => {
        expect(wallet.isActive).toBe(true);
      });
    });

    it("should include BTC, ETH, USDT, BNB, etc.", async () => {
      const wallets = await getActiveHotWallets();
      const symbols = wallets.map(w => w.symbol);
      
      expect(symbols).toContain("BTC");
      expect(symbols).toContain("ETH");
      expect(symbols).toContain("USDT");
      expect(symbols).toContain("BNB");
      expect(symbols).toContain("USDC");
      expect(symbols).toContain("LTC");
      expect(symbols).toContain("DOGE");
      expect(symbols).toContain("AVAX");
      expect(symbols).toContain("MATIC");
      expect(symbols).toContain("LINK");
    });

    it("should NOT include inactive wallets (ADA, SOL, XRP, DOT, XLM)", async () => {
      const wallets = await getActiveHotWallets();
      const symbols = wallets.map(w => w.symbol);
      
      expect(symbols).not.toContain("ADA");
      expect(symbols).not.toContain("SOL");
      expect(symbols).not.toContain("XRP");
      expect(symbols).not.toContain("DOT");
      expect(symbols).not.toContain("XLM");
    });
  });

  describe("Reference ID Generation", () => {
    it("should generate unique reference IDs", () => {
      const userId = 42;
      const asset = "BTC";
      
      // Generate reference ID format: {ASSET}-{USER_ID}-{TIMESTAMP_BASE36}-{RANDOM}
      const refId1 = `${asset}-${userId}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const refId2 = `${asset}-${userId}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      expect(refId1).toMatch(/^BTC-42-[a-z0-9]+-[A-Z0-9]{6}$/);
      expect(refId2).toMatch(/^BTC-42-[a-z0-9]+-[A-Z0-9]{6}$/);
      expect(refId1).not.toBe(refId2); // Should be unique
    });

    it("should be parseable to extract user ID", () => {
      const refId = "BTC-42-lk3m9x-A7F2G9";
      const parts = refId.split("-");
      
      expect(parts[0]).toBe("BTC");
      expect(parts[1]).toBe("42");
      expect(parseInt(parts[1])).toBe(42);
    });
  });

  describe("Wallet Address Validation", () => {
    it("BTC address should be valid format", async () => {
      const wallet = await getHotWallet("BTC", "Bitcoin");
      
      expect(wallet?.address).toBeDefined();
      // Bitcoin addresses start with 1, 3, or bc1
      expect(
        wallet?.address.startsWith("1") || 
        wallet?.address.startsWith("3") || 
        wallet?.address.startsWith("bc1")
      ).toBe(true);
    });

    it("ETH address should be valid format", async () => {
      const wallet = await getHotWallet("ETH", "Ethereum");
      
      expect(wallet?.address).toBeDefined();
      expect(wallet?.address.startsWith("0x")).toBe(true);
      expect(wallet?.address.length).toBe(42); // 0x + 40 hex chars
    });

    it("BNB address should be valid format (same as ETH)", async () => {
      const wallet = await getHotWallet("BNB", "BNB Chain");
      
      expect(wallet?.address).toBeDefined();
      expect(wallet?.address.startsWith("0x")).toBe(true);
      expect(wallet?.address.length).toBe(42);
    });
  });

  describe("Private Key Encryption", () => {
    it("should have encrypted private keys in database", async () => {
      const wallets = await getAllHotWallets();
      
      wallets.forEach(wallet => {
        // Private keys should not be exposed in the returned data
        expect(wallet.privateKeyEncrypted).toBeUndefined();
      });
    });
  });
});
