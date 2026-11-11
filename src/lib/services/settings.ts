import { db } from "@/lib/db";
import type { PromoPackage } from "@/lib/types";

/** Business rules / fee config. Stored in the `settings` tab so admins can tune them live. */
export const DEFAULT_SETTINGS = {
  buyerFeePct: 5,
  sellerFeePct: 5,
  escrowFee: 15000,
  transferSharePct: 30, // platform share of organizer's name-change fee
  priceCapPct: 120, // default anti-scalping cap
  maxActiveListingsPerRace: 2,
  maxPurchasesPerDistance: 1,
  officialCommissionPct: 8,
  conciergeStandardPct: 15,
  conciergeExpressPct: 20,
  brokerSharePct: 50, // of concierge fee
  agentSharePct: 20, // of platform fees on referred orders
  insurancePct: 6, // of bib price
  insuranceMin: 30000,
  autoCompleteHours: 72,
  promoTop24h: 20000,
  promoTop72h: 35000,
  promoFeatured7d: 50000,
  dataBasic: 2000000,
  dataPro: 5000000,
  dataEnterprise: 15000000,
};
export type Settings = typeof DEFAULT_SETTINGS;
export type SettingKey = keyof Settings;

export async function getSettings(): Promise<Settings> {
  const rows = await db.settings.all();
  const s = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    if (r.id in s && r.value !== "") (s as Record<string, number>)[r.id] = Number(r.value);
  }
  return s;
}

export async function saveSettings(patch: Partial<Settings>) {
  const existing = new Set((await db.settings.all()).map((r) => r.id));
  for (const [k, v] of Object.entries(patch)) {
    if (!(k in DEFAULT_SETTINGS) || v === undefined || Number.isNaN(v)) continue;
    if (existing.has(k)) await db.settings.update(k, { value: String(v) });
    else await db.settings.insert({ id: k, value: String(v) });
  }
}

export const PROMO_PACKAGES: Record<PromoPackage, { label: string; hours: number; key: SettingKey; desc: string }> = {
  top24h: { label: "Đẩy top 24 giờ", hours: 24, key: "promoTop24h", desc: "Lên đầu danh sách cự ly trong 1 ngày" },
  top72h: { label: "Đẩy top 72 giờ", hours: 72, key: "promoTop72h", desc: "Ưu tiên hiển thị 3 ngày + nhãn HOT" },
  featured7d: { label: "Nổi bật 7 ngày", hours: 168, key: "promoFeatured7d", desc: "Trang chủ + đầu cự ly + gửi alert người tìm mua" },
};
