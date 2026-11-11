import { db } from "@/lib/db";
import type { Distance, Listing, Race, RaceType, Region, User } from "@/lib/types";

export interface RaceCard extends Race {
  distances: Distance[];
  activeListings: number;
  minPrice: number | null;
  wtbCount: number;
}

export interface SellerInfo {
  id: string;
  name: string;
  verified: boolean;
  trustScore: number;
  sales: number;
  rating: number;
  role: User["role"];
}

export interface ListingView extends Listing {
  race: Race;
  distance: Distance;
  seller: SellerInfo;
  promoted: boolean;
}

export const isPromoted = (l: Listing) => Boolean(l.promotedUntil) && new Date(l.promotedUntil).getTime() > Date.now();

export async function getRaceCards(f: {
  q?: string;
  type?: RaceType | "";
  region?: Region | "";
  month?: string; // "2027-03"
  sort?: "date" | "listings" | "price";
  upcomingOnly?: boolean;
} = {}): Promise<RaceCard[]> {
  const [races, distances, listings, wtb] = await Promise.all([
    db.races.all(),
    db.distances.all(),
    db.listings.where((l) => l.status === "active"),
    db.wtb_alerts.where((a) => a.status === "active"),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const q = f.q?.trim().toLowerCase();
  const cards = races
    .filter((r) => r.status === "published")
    .filter((r) => (f.upcomingOnly ?? true ? r.date >= today : true))
    .filter((r) => !f.type || r.type === f.type)
    .filter((r) => !f.region || r.region === f.region)
    .filter((r) => !f.month || r.date.startsWith(f.month))
    .filter((r) => !q || `${r.name} ${r.city}`.toLowerCase().includes(q))
    .map((r) => {
      const ls = r.transferDeadline >= today ? listings.filter((l) => l.raceId === r.id) : [];
      return {
        ...r,
        distances: distances.filter((d) => d.raceId === r.id).sort((a, b) => a.km - b.km),
        activeListings: ls.length,
        minPrice: ls.length ? Math.min(...ls.map((l) => l.price)) : null,
        wtbCount: wtb.filter((a) => a.raceId === r.id).length,
      };
    });
  const sort = f.sort ?? "date";
  return cards.sort((a, b) =>
    sort === "listings"
      ? b.activeListings - a.activeListings
      : sort === "price"
        ? (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity)
        : a.date.localeCompare(b.date),
  );
}

export async function getRaceBySlug(slug: string) {
  const race = await db.races.find((r) => r.slug === slug);
  if (!race) return null;
  const distances = (await db.distances.where((d) => d.raceId === race.id)).sort((a, b) => a.km - b.km);
  return { race, distances };
}

export async function sellerInfo(userId: string): Promise<SellerInfo> {
  const [u, sales, reviews] = await Promise.all([
    db.users.get(userId),
    db.orders.where((o) => o.sellerId === userId && o.status === "completed"),
    db.reviews.where((r) => r.revieweeId === userId),
  ]);
  return {
    id: userId,
    name: u?.orgName || u?.name || "Người dùng",
    verified: u?.verified ?? false,
    trustScore: u?.trustScore ?? 0,
    sales: sales.length,
    rating: reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0,
    role: u?.role ?? "runner",
  };
}

async function enrich(ls: Listing[]): Promise<ListingView[]> {
  const [races, distances] = await Promise.all([db.races.all(), db.distances.all()]);
  const sellers = new Map<string, SellerInfo>();
  for (const id of new Set(ls.map((l) => l.sellerId))) sellers.set(id, await sellerInfo(id));
  return ls.flatMap((l) => {
    const race = races.find((r) => r.id === l.raceId);
    const distance = distances.find((d) => d.id === l.distanceId);
    if (!race || !distance) return [];
    return [{ ...l, race, distance, seller: sellers.get(l.sellerId)!, promoted: isPromoted(l) }];
  });
}

const rank = (a: ListingView, b: ListingView) =>
  Number(b.promoted) - Number(a.promoted) || Number(b.kind === "official") - Number(a.kind === "official") || a.price - b.price;

export async function getListingsForRace(raceId: string) {
  const race = await db.races.get(raceId);
  if (!race || race.transferDeadline < new Date().toISOString().slice(0, 10)) return [];
  return (await enrich(await db.listings.where((l) => l.raceId === raceId && l.status === "active"))).sort(rank);
}

export async function getListing(id: string) {
  const l = await db.listings.get(id);
  return l ? (await enrich([l]))[0] ?? null : null;
}

export async function getHotListings(limit = 8) {
  const today = new Date().toISOString().slice(0, 10);
  const views = await enrich(await db.listings.where((l) => l.status === "active"));
  return views
    .filter((v) => v.race.transferDeadline >= today && v.race.transferPolicy !== "closed")
    .sort((a, b) => Number(b.promoted) - Number(a.promoted) || b.views - a.views)
    .slice(0, limit);
}

export async function getListingsBy(pred: (l: Listing) => boolean) {
  return (await enrich(await db.listings.where(pred))).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Trail ultra qualification (ITRA points / UTMB index / longest finished race). */
export function checkEligibility(d: Distance, u: Pick<User, "itraPoints" | "utmbIndex" | "longestRaceKm"> | null) {
  const reqs: { label: string; ok: boolean }[] = [];
  if (d.requiredItraPoints) reqs.push({ label: `≥ ${d.requiredItraPoints} điểm ITRA`, ok: (u?.itraPoints ?? 0) >= d.requiredItraPoints });
  if (d.requiredUtmbIndex) reqs.push({ label: `UTMB Index ≥ ${d.requiredUtmbIndex}`, ok: (u?.utmbIndex ?? 0) >= d.requiredUtmbIndex });
  if (d.requiredLongestKm) reqs.push({ label: `Đã hoàn thành cự ly ≥ ${d.requiredLongestKm}km`, ok: (u?.longestRaceKm ?? 0) >= d.requiredLongestKm });
  return { required: reqs.length > 0, eligible: reqs.every((r) => r.ok), reqs };
}

export async function getUserName(id: string) {
  const u = await db.users.get(id);
  return u?.orgName || u?.name || "—";
}
