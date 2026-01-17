import { db } from "../server/db";
import { wallets } from "../drizzle/schema";
import * as fs from "fs";

async function exportWallets() {
  console.log("Fetching all wallets from database...");
  
  const allWallets = await db.select().from(wallets);
  
  console.log(`Found ${allWallets.length} wallets`);
  
  // Create CSV content
  const csvHeader = "ID,User ID,Asset,Network,Address,Private Key,Created At\n";
  const csvRows = allWallets.map(w => 
    `${w.id},${w.userId},${w.asset},${w.network},"${w.address}","${w.privateKey}",${w.createdAt}`
  ).join("\n");
  
  const csvContent = csvHeader + csvRows;
  
  // Write to file
  const outputPath = "/tmp/wallets_export.csv";
  fs.writeFileSync(outputPath, csvContent);
  
  console.log(`✅ Exported ${allWallets.length} wallets to ${outputPath}`);
  
  process.exit(0);
}

exportWallets().catch(console.error);
