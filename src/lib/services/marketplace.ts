import { db, newId } from "@/lib/db";
import type { AdCampaign, DataSubscription, Listing, PromoPackage, User, Voucher } from "@/lib/types";
import { addDays, addHours, formatVND, nowIso } from "@/lib/utils";
import { discord } from "./discord";
import { scanSeller } from "./fraud";
import { record } from "./ledger";
import { notify } from "./notify";
import { DomainError } from "./orders";
import { maxAllowedPrice } from "./pricing";
import { PROMO_PACKAGES, getSettings } from "./settings";

export async function createListing(
  actor: User,
  input: Pick<Listing, "raceId" | "distanceId" | "price" | "gender" | "shirtSize" | "includesKit" | "note"> & {
    kind?: Listing["kind"];
    quantity?: number;
    clientEmail?: string;
  },
) {
  const s = await getSettings();
  const [race, distance] = await Promise.all([db.races.get(input.raceId), db.distances.get(input.distanceId)]);
  if (!race || !distance || distance.raceId !== race.id) throw new DomainError("Vui lòng chọn giải và cự ly hợp lệ");
  if (race.transferPolicy === "closed") throw new DomainError("Giải này không cho phép chuyển nhượng bib");
  if (race.transferDeadline && race.transferDeadline < new Date().toISOString().slice(0, 10))
    throw new DomainError("Đã quá hạn đổi tên của BTC");

  let kind: Listing["kind"] = input.kind ?? "resale";
  if (kind === "official" && !(actor.role === "admin" || (actor.role === "organizer" && race.organizerId === actor.id)))
    throw new DomainError("Chỉ BTC của giải mới được bán suất chính thức");
  if (kind === "consignment") kind = "resale";

  const cap = maxAllowedPrice(distance.originalPrice, race.priceCapPct || s.priceCapPct);
  if (kind === "resale" && input.price > cap)
    throw new DomainError(`Giá tối đa cho phép là ${formatVND(cap)} (${race.priceCapPct || s.priceCapPct}% giá gốc) – chống phe vé.`);
  if (input.price < 10000) throw new DomainError("Giá không hợp lệ");

  // Agent listing on behalf of a client runner.
  let sellerId = actor.id;
  let agentId = "";
  if (actor.role === "agent") {
    agentId = actor.id;
    if (input.clientEmail) {
      const client = await db.users.find((u) => u.email === input.clientEmail!.toLowerCase().trim());
      if (!client) throw new DomainError("Không tìm thấy khách hàng với email này – mời họ đăng ký qua link giới thiệu.");
      sellerId = client.id;
    }
  }

  if (kind === "resale") {
    const active = await db.listings.where((l) => l.sellerId === sellerId && l.raceId === race.id && ["active", "reserved"].includes(l.status));
    if (active.length >= s.maxActiveListingsPerRace)
      throw new DomainError(`Tối đa ${s.maxActiveListingsPerRace} bib đang bán cho mỗi giải`);
  }

  const listing = await db.listings.insert({
    id: newId("lst"),
    raceId: race.id,
    distanceId: distance.id,
    sellerId,
    kind,
    price: input.price,
    originalPrice: distance.originalPrice,
    gender: input.gender,
    shirtSize: input.shirtSize,
    includesKit: input.includesKit,
    note: input.note,
    status: "active",
    agentId,
    quantity: kind === "official" ? Math.max(1, input.quantity ?? 1) : 1,
    createdAt: nowIso(),
  });
  await matchAlerts(listing);
  if (kind === "resale") await scanSeller(sellerId);
  if (kind === "official")
    discord("listing_official", `BTC mở bán ${listing.quantity} suất chính thức`, {
      fields: { Giải: race.name, "Cự ly": distance.name, Giá: formatVND(listing.price) },
      link: `/listings/${listing.id}`,
    });
  return listing;
}

async function matchAlerts(l: Listing) {
  const alerts = await db.wtb_alerts.where(
    (a) => a.status === "active" && a.distanceId === l.distanceId && (!a.maxPrice || a.maxPrice >= l.price) && a.userId !== l.sellerId,
  );
  const race = await db.races.get(l.raceId);
  for (const a of alerts)
    await notify(a.userId, "Có bib bạn đang tìm!", `${race?.name}: ${formatVND(l.price)}. Mua ngay trước khi hết.`, `/listings/${l.id}`);
}

export async function cancelListing(actor: User, id: string) {
  const l = await db.listings.get(id);
  if (!l || (l.sellerId !== actor.id && l.agentId !== actor.id && l.brokerId !== actor.id && actor.role !== "admin"))
    throw new DomainError("Không có quyền");
  if (l.status !== "active") throw new DomainError("Chỉ huỷ được tin đang bán");
  await db.listings.update(id, { status: "cancelled" });
}

export async function updateListingPrice(actor: User, id: string, price: number) {
  const l = await db.listings.get(id);
  if (!l || (l.sellerId !== actor.id && actor.role !== "admin")) throw new DomainError("Không có quyền");
  const race = await db.races.get(l.raceId);
  const s = await getSettings();
  const cap = maxAllowedPrice(l.originalPrice, race?.priceCapPct || s.priceCapPct);
  if (l.kind === "resale" && price > cap) throw new DomainError(`Giá tối đa ${formatVND(cap)}`);
  await db.listings.update(id, { price });
  if (price < l.price) await matchAlerts({ ...l, price });
}

export async function promoteListing(actor: User, listingId: string, pkg: PromoPackage) {
  const l = await db.listings.get(listingId);
  if (!l || l.status !== "active") throw new DomainError("Tin không còn hoạt động");
  if (l.sellerId !== actor.id && l.agentId !== actor.id && l.brokerId !== actor.id && actor.role !== "organizer")
    throw new DomainError("Không có quyền");
  const s = await getSettings();
  const p = PROMO_PACKAGES[pkg];
  const price = s[p.key];
  const start = l.promotedUntil && new Date(l.promotedUntil) > new Date() ? new Date(l.promotedUntil) : new Date();
  const end = addHours(start, p.hours).toISOString();
  await db.promotions.insert({ id: newId("pro"), listingId, userId: actor.id, pkg, price, startAt: start.toISOString(), endAt: end, createdAt: nowIso() });
  await db.listings.update(listingId, { promotedUntil: end });
  await record({ stream: "promotion", amount: price, raceId: l.raceId, refId: listingId, note: p.label });
  discord("promotion", `Đẩy tin: ${p.label}`, { fields: { "Doanh thu": formatVND(price) }, link: `/listings/${listingId}` });
  return { price, end };
}

export async function createAlert(user: User, raceId: string, distanceId: string, maxPrice: number) {
  const dup = await db.wtb_alerts.find((a) => a.userId === user.id && a.distanceId === distanceId && a.status === "active");
  if (dup) return db.wtb_alerts.update(dup.id, { maxPrice });
  return db.wtb_alerts.insert({ id: newId("wtb"), userId: user.id, raceId, distanceId, maxPrice, status: "active", createdAt: nowIso() });
}

/* ───────── Concierge / consignment (Bán hộ) ───────── */

export async function createConsignment(user: User, input: { raceId: string; distanceId: string; desiredPrice: number; tier: "standard" | "express"; note: string }) {
  const s = await getSettings();
  const distance = await db.distances.get(input.distanceId);
  if (!distance || distance.raceId !== input.raceId) throw new DomainError("Cự ly không hợp lệ");
  const c = await db.consignments.insert({
    id: newId("csg"),
    userId: user.id,
    ...input,
    feePct: input.tier === "express" ? s.conciergeExpressPct : s.conciergeStandardPct,
    status: "new",
    createdAt: nowIso(),
  });
  discord("consignment_new", `Yêu cầu bán hộ mới (${input.tier === "express" ? "Bán nhanh" : "Tiêu chuẩn"})`, {
    fields: { "Cự ly": distance.name, "Giá mong muốn": formatVND(input.desiredPrice), Phí: `${c.feePct}%` },
    link: "/broker",
  });
  for (const b of await db.users.where((u) => u.role === "broker" && u.status === "active"))
    await notify(b.id, "Yêu cầu bán hộ mới", `${distance.name} – mong muốn ${formatVND(input.desiredPrice)}`, "/broker");
  return c;
}

export async function claimConsignment(broker: User, id: string) {
  const c = await db.consignments.get(id);
  if (!c || c.status !== "new") throw new DomainError("Yêu cầu đã có người nhận");
  await db.consignments.update(id, { status: "assigned", brokerId: broker.id });
  await notify(c.userId, "Đã có chuyên viên nhận bán hộ", `${broker.name} sẽ định giá và đăng bán bib của bạn.`, "/dashboard/sell");
}

export async function listConsignment(broker: User, id: string, price: number) {
  const c = await db.consignments.get(id);
  if (!c || c.brokerId !== broker.id || c.status !== "assigned") throw new DomainError("Không hợp lệ");
  const [race, distance] = await Promise.all([db.races.get(c.raceId), db.distances.get(c.distanceId)]);
  if (!race || !distance) throw new DomainError("Không hợp lệ");
  const s = await getSettings();
  const cap = maxAllowedPrice(distance.originalPrice, race.priceCapPct || s.priceCapPct);
  if (price > cap) throw new DomainError(`Giá tối đa ${formatVND(cap)}`);
  const l = await db.listings.insert({
    id: newId("lst"),
    raceId: c.raceId,
    distanceId: c.distanceId,
    sellerId: c.userId,
    kind: "consignment",
    price,
    originalPrice: distance.originalPrice,
    gender: "any",
    note: "Bán hộ bởi chuyên viên KBIB – đã xác minh bib với BTC.",
    status: "active",
    brokerId: broker.id,
    consignmentId: c.id,
    quantity: 1,
    // Express consignments get a free 72h boost.
    promotedUntil: c.tier === "express" ? addHours(new Date(), 72).toISOString() : "",
    createdAt: nowIso(),
  });
  await db.consignments.update(id, { status: "listed", listingId: l.id });
  await notify(c.userId, "Bib của bạn đã lên sàn", `Đăng bán ${formatVND(price)}.`, `/listings/${l.id}`);
  await matchAlerts(l);
}

/* ───────── Brands: ads, vouchers, data ───────── */

export async function createCampaign(brand: User, input: Pick<AdCampaign, "name" | "placement" | "title" | "body" | "cta" | "link" | "target" | "budget" | "cpm"> & { days: number }) {
  discord("campaign_submitted", `Chiến dịch quảng cáo chờ duyệt: ${input.name}`, {
    fields: { Brand: brand.orgName || brand.name, "Vị trí": input.placement, "Ngân sách": formatVND(input.budget) },
    link: "/admin/ads",
  });
  return db.ad_campaigns.insert({
    id: newId("ad"),
    brandId: brand.id,
    ...input,
    status: "pending",
    startAt: nowIso(),
    endAt: addDays(new Date(), input.days).toISOString(),
    createdAt: nowIso(),
  });
}

export async function setCampaignStatus(id: string, status: AdCampaign["status"]) {
  const c = await db.ad_campaigns.get(id);
  if (!c) throw new DomainError("Không tìm thấy chiến dịch");
  if (c.status === "pending" && status === "active")
    await record({ stream: "ads", amount: c.budget, refId: c.id, note: c.name });
  await db.ad_campaigns.update(id, { status });
}

export async function createVoucher(brand: User, input: Pick<Voucher, "code" | "title" | "description" | "discountText" | "target" | "minKm" | "link" | "quantity" | "cpa">) {
  return db.vouchers.insert({ id: newId("vch"), brandId: brand.id, ...input, claimed: 0, active: true, createdAt: nowIso() });
}

export async function subscribeData(user: User, plan: DataSubscription["plan"]) {
  const s = await getSettings();
  const price = plan === "enterprise" ? s.dataEnterprise : plan === "pro" ? s.dataPro : s.dataBasic;
  const sub = await db.data_subscriptions.insert({
    id: newId("sub"),
    userId: user.id,
    plan,
    price,
    startAt: nowIso(),
    endAt: addDays(new Date(), 30).toISOString(),
    createdAt: nowIso(),
  });
  await record({ stream: "data_report", amount: price, refId: sub.id, note: `Gói ${plan}` });
  discord("data_subscription", `Đăng ký gói dữ liệu ${plan.toUpperCase()}`, { fields: { "Khách hàng": user.orgName || user.name, "Doanh thu": formatVND(price) } });
  return sub;
}

export async function activeDataPlan(userId: string) {
  const now = nowIso();
  return db.data_subscriptions.find((s) => s.userId === userId && s.endAt > now);
}
