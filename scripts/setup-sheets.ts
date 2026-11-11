/**
 * Create every tab + header in the configured Google Sheet(s), optionally load demo data.
 *   npm run sheets:setup          # tabs + headers only
 *   npm run sheets:setup -- --seed  # also replace all data with demo data
 */
import { sheetsConfigured } from "@/lib/db/driver";
import { driverName, ensureSchema } from "@/lib/db";

async function main() {
  if (!sheetsConfigured()) {
    console.error("Thiếu GOOGLE_SHEET_ID / GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY trong .env.local");
    process.exit(1);
  }
  console.log(`Driver: ${driverName()} – tạo tab & header…`);
  await ensureSchema();
  if (process.argv.includes("--seed")) {
    const { seedAll } = await import("@/lib/db/seed");
    console.log("Ghi dữ liệu demo…");
    console.log(await seedAll());
  }
  console.log("Xong ✅");
}

main().catch((e) => {
  console.error(e?.response?.data ?? e);
  process.exit(1);
});
