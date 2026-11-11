"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/components/ui/form";
import { requireRole } from "@/lib/auth/dal";
import { db, invalidateCache, newId } from "@/lib/db";
import * as market from "@/lib/services/marketplace";
import { discord } from "@/lib/services/discord";
import * as orders from "@/lib/services/orders";
import { DEFAULT_SETTINGS, saveSettings, type Settings } from "@/lib/services/settings";
import type { Role } from "@/lib/types";
import { nowIso, slugify } from "@/lib/utils";
import { guard, money, str } from "./helpers";

/* ───────── Broker ───────── */

export async function claimConsignmentAction(fd: FormData) {
  const u = await requireRole("broker");
  await guard(() => market.claimConsignment(u, String(fd.get("id"))));
  revalidatePath("/broker");
}

export async function listConsignmentAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const u = await requireRole("broker");
  return guard(async () => {
    await market.listConsignment(u, String(fd.get("id")), money.parse(fd.get("price")));
    revalidatePath("/broker");
    return { ok: true, message: "Đã đăng bán" };
  });
}

/* ───────── Transfers (organizer / broker / admin) ───────── */

export async function approveTransferAction(fd: FormData) {
  const u = await requireRole("organizer", "broker");
  await guard(() => orders.approveTransfer(String(fd.get("id")), u, String(fd.get("bibCode") ?? "")));
  revalidatePath("/organizer/transfers");
  revalidatePath("/broker");
}

export async function rejectTransferAction(fd: FormData) {
  const u = await requireRole("organizer", "broker");
  await guard(() => orders.rejectTransfer(String(fd.get("id")), u, String(fd.get("reason") || "Thông tin không hợp lệ")));
  revalidatePath("/organizer/transfers");
}

/* ───────── Organizer ───────── */

const raceSchema = z.object({
  name: z.string().trim().min(4, "Nhập tên giải"),
  type: z.enum(["road", "trail"]),
  city: z.string().trim().min(2, "Nhập địa điểm"),
  region: z.enum(["north", "central", "south", "highland"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Chọn ngày"),
  transferDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Chọn hạn đổi tên"),
  transferPolicy: z.enum(["official", "allowed", "closed"]),
  transferFee: money,
  priceCapPct: z.coerce.number().int().min(100).max(200),
  description: str(2000).default(""),
  coverUrl: z.union([z.literal(""), z.url({ protocol: /^https$/, message: "Link ảnh phải là https://" })]).default(""),
  distances: z.string().min(1, "Nhập ít nhất 1 cự ly"),
});

/** distances textarea: one per line "42K | 42.2 | 1200000 | 0" (name | km | price | D+) */
export async function createRaceAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const u = await requireRole("organizer");
  return guard(async () => {
    const input = raceSchema.parse(Object.fromEntries(fd));
    const lines = input.distances.split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p[0]);
    if (!lines.length) return { error: "Nhập ít nhất 1 cự ly" };
    const race = await db.races.insert({
      id: newId("race"),
      slug: `${slugify(input.name)}-${Math.random().toString(36).slice(2, 5)}`,
      name: input.name, type: input.type, city: input.city, region: input.region, date: input.date,
      organizerId: u.id, description: input.description, transferPolicy: input.transferPolicy,
      transferDeadline: input.transferDeadline, transferFee: input.transferFee, priceCapPct: input.priceCapPct,
      featured: false, status: "published", hue: 10 + Math.floor(Math.random() * 24), coverUrl: input.coverUrl, createdAt: nowIso(),
    });
    await db.distances.insertMany(
      lines.map(([name, km, price, elev]) => {
        const k = Number(km) || parseFloat(name) || 0;
        return {
          id: newId("dst"), raceId: race.id, name, km: k, originalPrice: Number(price) || 0, elevationGain: Number(elev) || 0,
          capacity: 1000, requiredItraPoints: input.type === "trail" ? (k >= 100 ? 4 : k >= 70 ? 2 : 0) : 0,
          requiredUtmbIndex: input.type === "trail" && k >= 100 ? 450 : 0,
          requiredLongestKm: input.type === "trail" ? (k >= 100 ? 70 : k >= 70 ? 42 : 0) : 0,
          cutoffHours: Math.ceil(k / (input.type === "trail" ? 4.5 : 8)),
        };
      }),
    );
    revalidatePath("/organizer/races");
    return { ok: true, message: `Đã tạo giải ${race.name}` };
  });
}

export async function updateRacePolicyAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const u = await requireRole("organizer");
  return guard(async () => {
    const race = await db.races.get(String(fd.get("id")));
    if (!race || (race.organizerId !== u.id && u.role !== "admin")) return { error: "Không có quyền" };
    await db.races.update(race.id, {
      transferPolicy: z.enum(["official", "allowed", "closed"]).parse(fd.get("transferPolicy")),
      transferFee: money.parse(fd.get("transferFee")),
      priceCapPct: z.coerce.number().int().min(100).max(200).parse(fd.get("priceCapPct")),
      transferDeadline: String(fd.get("transferDeadline")),
    });
    revalidatePath("/organizer/races");
    return { ok: true, message: "Đã cập nhật chính sách" };
  });
}

export async function officialInventoryAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const u = await requireRole("organizer");
  return guard(async () => {
    await market.createListing(u, {
      raceId: String(fd.get("raceId")), distanceId: String(fd.get("distanceId")), price: money.parse(fd.get("price")),
      gender: "any", shirtSize: "", includesKit: true, note: str(300).parse(fd.get("note") ?? ""), kind: "official",
      quantity: z.coerce.number().int().min(1).parse(fd.get("quantity")),
    });
    revalidatePath("/organizer/races");
    return { ok: true, message: "Đã mở bán suất chính thức" };
  });
}

export async function rotateApiKeyAction() {
  const u = await requireRole("organizer");
  await db.users.update(u.id, { apiKey: `kbib_org_${crypto.randomUUID().replace(/-/g, "")}` });
  revalidatePath("/organizer/api");
}

/* ───────── Brand ───────── */

export async function createCampaignAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const u = await requireRole("brand");
  return guard(async () => {
    const input = z
      .object({
        name: z.string().trim().min(3, "Nhập tên chiến dịch"),
        placement: z.enum(["home_hero", "race_sidebar", "checkout", "search_top"]),
        title: z.string().trim().min(5, "Nhập tiêu đề"),
        body: str(200),
        cta: str(30).default("Xem ngay"),
        link: z.url("Link không hợp lệ"),
        target: z.enum(["all", "road", "trail"]),
        budget: money.min(1000000, "Ngân sách tối thiểu 1.000.000đ"),
        cpm: money,
        days: z.coerce.number().int().min(1).max(180),
      })
      .parse(Object.fromEntries(fd));
    await market.createCampaign(u, input);
    revalidatePath("/brand");
    return { ok: true, message: "Đã gửi chiến dịch, chờ KBIB duyệt (≤ 24h)." };
  });
}

export async function toggleCampaignAction(fd: FormData) {
  const u = await requireRole("brand");
  const c = await db.ad_campaigns.get(String(fd.get("id")));
  if (c && (c.brandId === u.id || u.role === "admin") && ["active", "paused"].includes(c.status))
    await market.setCampaignStatus(c.id, c.status === "active" ? "paused" : "active");
  revalidatePath("/brand");
}

export async function createVoucherAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const u = await requireRole("brand");
  return guard(async () => {
    const input = z
      .object({
        code: z.string().trim().min(3).max(20).transform((s) => s.toUpperCase()),
        title: z.string().trim().min(3),
        description: str(300),
        discountText: str(20),
        target: z.enum(["all", "road", "trail"]),
        minKm: z.coerce.number().min(0),
        link: z.url("Link không hợp lệ"),
        quantity: z.coerce.number().int().min(1),
        cpa: money,
      })
      .parse(Object.fromEntries(fd));
    await market.createVoucher(u, input);
    revalidatePath("/brand");
    return { ok: true, message: "Đã tạo voucher – sẽ tặng cho runner sau khi giao dịch hoàn tất." };
  });
}

export async function subscribeDataAction(fd: FormData) {
  const u = await requireRole("brand", "organizer");
  await market.subscribeData(u, z.enum(["basic", "pro", "enterprise"]).parse(fd.get("plan")));
  revalidatePath("/insights");
  revalidatePath("/brand");
}

/* ───────── Partner ───────── */

export async function createServiceAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const u = await requireRole("partner");
  return guard(async () => {
    const input = z
      .object({
        type: z.enum(["insurance", "kit_pickup", "travel", "hotel"]),
        name: z.string().trim().min(3, "Nhập tên dịch vụ"),
        description: str(400),
        raceId: str(60).default(""),
        price: money,
        commissionPct: z.coerce.number().min(5, "Hoa hồng tối thiểu 5%").max(50),
      })
      .parse(Object.fromEntries(fd));
    await db.services.insert({ id: newId("svc"), partnerId: u.id, ...input, active: true, createdAt: nowIso() });
    revalidatePath("/partner");
    return { ok: true, message: "Đã thêm dịch vụ" };
  });
}

export async function toggleServiceAction(fd: FormData) {
  const u = await requireRole("partner");
  const s = await db.services.get(String(fd.get("id")));
  if (s && (s.partnerId === u.id || u.role === "admin")) await db.services.update(s.id, { active: !s.active });
  revalidatePath("/partner");
}

/* ───────── Admin ───────── */

export async function adminMarkPaidAction(fd: FormData) {
  await requireRole("admin");
  await guard(async () => {
    await orders.markPaid(String(fd.get("id")), "vietqr", String(fd.get("ref") || "ADMIN"));
  });
  revalidatePath("/admin/orders");
}

export async function adminApproveTransferAction(fd: FormData) {
  const u = await requireRole("admin");
  await guard(() => orders.approveTransfer(String(fd.get("id")), u, ""));
  revalidatePath("/admin/orders");
}

export async function adminCompleteAction(fd: FormData) {
  await requireRole("admin");
  await orders.completeOrder(String(fd.get("id")));
  revalidatePath("/admin/orders");
}

export async function runEscrowJobsAction() {
  await requireRole("admin");
  await orders.expireUnpaidOrders();
  await orders.autoCompleteOrders();
  revalidatePath("/admin");
}

export async function resolveDisputeAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole("admin");
  return guard(async () => {
    await orders.resolveDispute(String(fd.get("id")), z.enum(["buyer", "seller"]).parse(fd.get("outcome")), str(500).parse(fd.get("resolution") ?? ""));
    revalidatePath("/admin/disputes");
    return { ok: true, message: "Đã xử lý tranh chấp" };
  });
}

export async function markPayoutPaidAction(fd: FormData) {
  await requireRole("admin");
  const ids = fd.getAll("id").map(String);
  let total = 0;
  for (const id of ids) total += (await db.payouts.update(id, { status: "paid", paidAt: nowIso() })).amount;
  if (ids.length) discord("payout_batch", `Đã chi trả ${ids.length} khoản`, { fields: { "Tổng tiền": `${total.toLocaleString("vi-VN")}đ` }, link: "/admin/payouts" });
  revalidatePath("/admin/payouts");
}

export async function setCampaignStatusAction(fd: FormData) {
  await requireRole("admin");
  await guard(() => market.setCampaignStatus(String(fd.get("id")), z.enum(["active", "paused", "ended"]).parse(fd.get("status"))));
  revalidatePath("/admin/ads");
}

export async function adminListingStatusAction(fd: FormData) {
  await requireRole("admin");
  await db.listings.update(String(fd.get("id")), { status: z.enum(["active", "cancelled"]).parse(fd.get("status")) });
  revalidatePath("/admin/listings");
}

export async function adminUserAction(fd: FormData) {
  await requireRole("admin");
  const id = String(fd.get("id"));
  const role = fd.get("role");
  const status = fd.get("status");
  const verified = fd.get("verified");
  await db.users.update(id, {
    ...(role ? { role: String(role) as Role } : {}),
    ...(status ? { status: status === "suspended" ? "suspended" : "active" } : {}),
    ...(verified ? { verified: verified === "true" } : {}),
  });
  revalidatePath("/admin/users");
}

export async function fraudFlagAction(fd: FormData) {
  await requireRole("admin");
  const f = await db.fraud_flags.get(String(fd.get("id")));
  if (!f) return;
  const action = String(fd.get("action"));
  await db.fraud_flags.update(f.id, { status: action === "clear" ? "cleared" : "actioned" });
  if (action === "suspend") await db.users.update(f.userId, { status: "suspended" });
  revalidatePath("/admin/fraud");
}

export async function saveSettingsAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole("admin");
  return guard(async () => {
    const patch: Partial<Settings> = {};
    for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
      const v = fd.get(k);
      if (v !== null && v !== "") patch[k] = Number(v);
    }
    await saveSettings(patch);
    revalidatePath("/", "layout");
    return { ok: true, message: "Đã lưu cấu hình phí" };
  });
}

export async function reloadCacheAction() {
  await requireRole("admin");
  invalidateCache();
  revalidatePath("/", "layout");
}
