/** Gửi 1 tin nhắn thử tới DISCORD_WEBHOOK_URL:  npm run discord:test */
import { discord, flushDiscord } from "@/lib/services/discord";

async function main() {
  if (!process.env.DISCORD_WEBHOOK_URL) {
    console.error("Thiếu DISCORD_WEBHOOK_URL trong .env.local");
    process.exit(1);
  }
  discord("order_paid", "Tin nhắn thử từ KBIB", { description: "Webhook Discord đã kết nối thành công 🎉", fields: { "Môi trường": process.env.NODE_ENV ?? "development" } });
  await flushDiscord();
  console.log("Đã gửi – kiểm tra kênh Discord.");
}
main();
