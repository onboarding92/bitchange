import mysql from "mysql2/promise";
import crypto from "crypto";
import fs from "fs";

// Encryption key from environment
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || "change-this-to-secure-32-byte-key!";

/**
 * Decrypt sensitive data (supports both old and new format)
 */
function decrypt(encryptedData) {
  if (!encryptedData || encryptedData === "N/A") {
    return "N/A";
  }
  
  try {
    // Try new format first (JSON with iv, encrypted, authTag)
    const parsed = JSON.parse(encryptedData);
    const { iv, encrypted, authTag } = parsed;
    const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
    
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(iv, "hex")
    );
    
    decipher.setAuthTag(Buffer.from(authTag, "hex"));
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (jsonError) {
    // Try old format (iv:encrypted without authTag)
    try {
      const parts = encryptedData.split(":");
      if (parts.length !== 2) {
        return `[ERROR: Invalid format]`;
      }
      
      const [iv, encrypted] = parts;
      const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
      
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        key,
        Buffer.from(iv, "hex")
      );
      
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      
      return decrypted;
    } catch (oldFormatError) {
      return `[DECRYPTION_ERROR: ${oldFormatError.message}]`;
    }
  }
}

async function exportWallets() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log("Fetching master wallets from database...");
    const [rows] = await connection.execute(
      "SELECT id, network, asset, address, encryptedPrivateKey, encryptedMnemonic, balance, isActive, createdAt FROM masterWallets ORDER BY network, asset"
    );
    
    console.log(`Found ${rows.length} master wallets`);
    
    // Prepare CSV content
    const csvHeader = "ID,Network,Asset,Address,Private Key,Mnemonic,Balance,Is Active,Created At\n";
    let csvContent = csvHeader;
    
    for (const wallet of rows) {
      const privateKey = decrypt(wallet.encryptedPrivateKey);
      const mnemonic = wallet.encryptedMnemonic ? decrypt(wallet.encryptedMnemonic) : "N/A";
      
      csvContent += `${wallet.id},${wallet.network},${wallet.asset},"${wallet.address}","${privateKey}","${mnemonic}",${wallet.balance},${wallet.isActive},${wallet.createdAt}\n`;
    }
    
    // Save to file
    const filename = `/tmp/master-wallets-export-${Date.now()}.csv`;
    fs.writeFileSync(filename, csvContent);
    
    console.log(`\n✅ Export completed successfully!`);
    console.log(`📁 File saved to: ${filename}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Total wallets: ${rows.length}`);
    console.log(`   Active wallets: ${rows.filter(w => w.isActive).length}`);
    console.log(`\n⚠️  WARNING: This file contains UNENCRYPTED private keys!`);
    console.log(`   Keep it secure and delete after use.`);
    
    return filename;
  } catch (error) {
    console.error("❌ Export failed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

exportWallets()
  .then((filename) => {
    console.log(`\n✅ Done! File: ${filename}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
