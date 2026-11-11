import { db } from "@/lib/db";
import type { Distance, Order, Race, User } from "@/lib/types";

const SOLD = new Set(["paid", "transferring", "transferred", "completed"]);
const DAY = 86400000;

export function distanceBucket(d: Pick<Distance, "km">, type: Race["type"]) {
  if (type === "road") return d.km <= 10 ? "Road 5–10K" : d.km <= 21.1 ? "Road 21K" : "Road 42K";
  return d.km < 42 ? "Trail < 42K" : d.km < 70 ? "Trail 42–69K" : d.km < 100 ? "Trail 70–99K" : "Trail 100K+";
}

export async function marketInsights() {
  const [races, distances, orders, listings, wtb] = await Promise.all([
    db.races.all(),
    db.distances.all(),
    db.orders.where((o) => SOLD.has(o.status)),
    db.listings.all(),
    db.wtb_alerts.all(),
  ]);
  const raceById = new Map(races.map((r) => [r.id, r]));
  const distById = new Map(distances.map((d) => [d.id, d]));
  const premium = (o: Order) => {
    const d = distById.get(o.distanceId);
    return d?.originalPrice ? o.price / d.originalPrice : 1;
  };

  // 1. Hot races: demand vs supply
  const today = new Date().toISOString().slice(0, 10);
  const hotRaces = races
    .filter((r) => r.date >= today)
    .map((r) => {
      const sold = orders.filter((o) => o.raceId === r.id).length;
      const active = listings.filter((l) => l.raceId === r.id && l.status === "active").length;
      const seekers = wtb.filter((a) => a.raceId === r.id && a.status === "active").length;
      const views = listings.filter((l) => l.raceId === r.id).reduce((s, l) => s + l.views, 0);
      const ro = orders.filter((o) => o.raceId === r.id);
      return {
        race: r,
        sold,
        active,
        seekers,
        views,
        demandScore: sold * 3 + seekers * 2 + Math.round(views / 20),
        avgPremium: ro.length ? ro.reduce((s, o) => s + premium(o), 0) / ro.length : null,
      };
    })
    .sort((a, b) => b.demandScore - a.demandScore);

  // 2. Price vs time-to-race
  const buckets = [
    { label: "> 8 tuần", min: 56, max: Infinity },
    { label: "4–8 tuần", min: 28, max: 56 },
    { label: "2–4 tuần", min: 14, max: 28 },
    { label: "1–2 tuần", min: 7, max: 14 },
    { label: "< 1 tuần", min: -Infinity, max: 7 },
  ];
  const priceCurve = buckets.map((b) => {
    const os = orders.filter((o) => {
      const r = raceById.get(o.raceId);
      if (!r) return false;
      const days = (new Date(r.date).getTime() - new Date(o.createdAt).getTime()) / DAY;
      return days >= b.min && days < b.max;
    });
    return { label: b.label, count: os.length, avgPremium: os.length ? os.reduce((s, o) => s + premium(o), 0) / os.length : 0 };
  });

  // 3. Distance demand
  const byBucket = new Map<string, { label: string; count: number; listings: number; premiumSum: number }>();
  for (const o of orders) {
    const d = distById.get(o.distanceId);
    const r = raceById.get(o.raceId);
    if (!d || !r) continue;
    const k = distanceBucket(d, r.type);
    const e = byBucket.get(k) ?? { label: k, count: 0, listings: 0, premiumSum: 0 };
    e.count++;
    e.premiumSum += premium(o);
    byBucket.set(k, e);
  }
  for (const l of listings) {
    const d = distById.get(l.distanceId);
    const r = raceById.get(l.raceId);
    if (!d || !r) continue;
    const k = distanceBucket(d, r.type);
    const e = byBucket.get(k) ?? { label: k, count: 0, listings: 0, premiumSum: 0 };
    e.listings++;
    byBucket.set(k, e);
  }
  const distanceDemand = [...byBucket.values()]
    .map((e) => ({ label: e.label, count: e.count, listings: e.listings, avgPremium: e.count ? e.premiumSum / e.count : 0, sellThrough: e.listings ? e.count / e.listings : 0 }))
    .sort((a, b) => b.count - a.count);

  // 4. Monthly GMV (last 6 months)
  const months: { key: string; label: string; gmv: number; count: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const os = orders.filter((o) => o.createdAt.startsWith(key));
    months.push({ key, label: `T${d.getMonth() + 1}`, gmv: os.reduce((s, o) => s + o.price, 0), count: os.length });
  }

  // 5. Region split
  const regions = ["north", "central", "highland", "south"].map((reg) => ({
    region: reg,
    count: orders.filter((o) => raceById.get(o.raceId)?.region === reg).length,
  }));

  return {
    totals: {
      gmv: orders.reduce((s, o) => s + o.price, 0),
      orders: orders.length,
      activeListings: listings.filter((l) => l.status === "active").length,
      seekers: wtb.filter((a) => a.status === "active").length,
      avgPremium: orders.length ? orders.reduce((s, o) => s + premium(o), 0) / orders.length : 1,
    },
    hotRaces,
    priceCurve,
    distanceDemand,
    months,
    regions,
  };
}

/** Median of recent sale prices for this distance; falls back to original price. */
export async function suggestedPrice(distanceId: string) {
  const d = await db.distances.get(distanceId);
  if (!d) return null;
  const prices = (await db.orders.where((o) => o.distanceId === distanceId && SOLD.has(o.status))).map((o) => o.price).sort((a, b) => a - b);
  const median = prices.length ? prices[Math.floor(prices.length / 2)] : d.originalPrice;
  return { median, samples: prices.length, original: d.originalPrice };
}

/* ───────── Personalisation ───────── */

const CROSS_SELL: Record<string, { name: string; why: string }[]> = {
  "Road 5–10K": [
    { name: "Giày chạy daily trainer", why: "Êm, bền cho giai đoạn xây nền" },
    { name: "Đai đeo điện thoại", why: "Gọn nhẹ cho cự ly ngắn" },
  ],
  "Road 21K": [
    { name: "Gel năng lượng (3–4 gói)", why: "Nạp carb mỗi 40–45 phút" },
    { name: "Tất chống phồng", why: "Giảm ma sát sau km 15" },
  ],
  "Road 42K": [
    { name: "Giày đĩa carbon", why: "Tối ưu cho mục tiêu Sub-3/Sub-4" },
    { name: "Muối điện giải", why: "Chống chuột rút nửa sau marathon" },
    { name: "Lộ trình carb-loading 3 ngày", why: "Đầy glycogen trước race" },
  ],
  "Trail < 42K": [
    { name: "Giày trail bám đá", why: "Đế Vibram cho dốc trơn" },
    { name: "Vest nước 5L", why: "Mang đủ nước giữa các trạm" },
  ],
  "Trail 42–69K": [
    { name: "Gậy leo núi gấp", why: "Giảm tải cơ đùi khi leo" },
    { name: "Đèn đội đầu 400lm", why: "Bắt buộc cho chặng tối" },
  ],
  "Trail 70–99K": [
    { name: "Gậy leo núi carbon", why: "Leo dốc >4000m D+" },
    { name: "Đèn đội đầu + pin dự phòng", why: "Chạy xuyên đêm" },
    { name: "Áo khoác chống nước", why: "Trang bị bắt buộc của BTC" },
  ],
  "Trail 100K+": [
    { name: "Bộ trang bị bắt buộc ultra", why: "Chăn bạc, còi, áo mưa, đèn x2" },
    { name: "Gel + thực phẩm rắn", why: "Nạp 250–300 kcal/giờ" },
    { name: "Gậy carbon + găng tay", why: "Leo dốc kỹ thuật ban đêm" },
  ],
};

export async function recommendationsFor(user: User | null, limit = 4) {
  const [races, orders, distances] = await Promise.all([db.races.all(), db.orders.all(), db.distances.all()]);
  const today = new Date().toISOString().slice(0, 10);
  const mine = user ? orders.filter((o) => o.buyerId === user.id && SOLD.has(o.status)) : [];
  const myRaces = mine.map((o) => races.find((r) => r.id === o.raceId)).filter(Boolean) as Race[];
  const trailShare = myRaces.length ? myRaces.filter((r) => r.type === "trail").length / myRaces.length : 0.4;
  const regionPref = user?.region || myRaces[0]?.region;
  const owned = new Set(myRaces.map((r) => r.id));

  const scored = races
    .filter((r) => r.status === "published" && r.date >= today && !owned.has(r.id))
    .map((r) => {
      let score = r.type === "trail" ? trailShare : 1 - trailShare;
      if (regionPref && r.region === regionPref) score += 0.5;
      if (r.featured) score += 0.3;
      const days = (new Date(r.date).getTime() - Date.now()) / DAY;
      if (days > 30 && days < 150) score += 0.4; // realistic training window
      if (user && r.type === "trail") {
        const maxKm = Math.max(0, ...distances.filter((d) => d.raceId === r.id).map((d) => d.km));
        if (user.longestRaceKm && maxKm > user.longestRaceKm * 2.5) score -= 0.3;
      }
      return { race: r, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.race);

  const last = mine.at(-1);
  const lastDist = last ? distances.find((d) => d.id === last.distanceId) : null;
  const lastRace = last ? races.find((r) => r.id === last.raceId) : null;
  const bucket = lastDist && lastRace ? distanceBucket(lastDist, lastRace.type) : null;
  return { races: scored, crossSell: bucket ? { bucket, items: CROSS_SELL[bucket] ?? [] } : null };
}

export function crossSellFor(d: Distance, type: Race["type"]) {
  const bucket = distanceBucket(d, type);
  return { bucket, items: CROSS_SELL[bucket] ?? [] };
}
