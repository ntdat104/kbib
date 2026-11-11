import { db, newId } from "@/lib/db";
import type { FraudFlag } from "@/lib/types";
import { nowIso } from "@/lib/utils";
import { discord } from "./discord";

const DAY = 86400000;

async function flag(userId: string, reason: string, severity: FraudFlag["severity"]) {
  const existing = await db.fraud_flags.find((f) => f.userId === userId && f.reason === reason && f.status === "open");
  if (existing) return;
  await db.fraud_flags.insert({ id: newId("frd"), userId, reason, severity, status: "open", createdAt: nowIso() });
  discord("fraud_flag", `Cờ gian lận (${severity.toUpperCase()})`, { description: reason, fields: { "User ID": userId }, link: "/admin/fraud" });
}

/** Anti-scalping heuristics run after listing / buying. Cheap rules over cached data. */
export async function scanSeller(userId: string) {
  const since = Date.now() - 30 * DAY;
  const listings = await db.listings.where(
    (l) => l.sellerId === userId && l.kind === "resale" && new Date(l.createdAt).getTime() > since,
  );
  const races = new Set(listings.map((l) => l.raceId));
  if (listings.length >= 5) await flag(userId, `Đăng ${listings.length} bib trong 30 ngày`, listings.length >= 8 ? "high" : "medium");
  if (races.size >= 4) await flag(userId, `Bán bib ở ${races.size} giải khác nhau trong 30 ngày`, "medium");
  const overpriced = listings.filter((l) => l.price > l.originalPrice * 1.15).length;
  if (overpriced >= 3) await flag(userId, `${overpriced} tin đăng sát trần giá`, "low");
}

export async function scanBuyer(userId: string) {
  const since = Date.now() - 30 * DAY;
  const orders = await db.orders.where(
    (o) => o.buyerId === userId && new Date(o.createdAt).getTime() > since && o.status !== "cancelled",
  );
  if (orders.length >= 4) await flag(userId, `Mua ${orders.length} bib trong 30 ngày (nghi gom bib)`, "high");
}
