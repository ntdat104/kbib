"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/components/ui/form";
import { requireUser } from "@/lib/auth/dal";
import { db, newId } from "@/lib/db";
import * as market from "@/lib/services/marketplace";
import * as orders from "@/lib/services/orders";
import type { PromoPackage } from "@/lib/types";
import { formatVND, nowIso } from "@/lib/utils";
import { guard, money, str } from "./helpers";

const listingSchema = z.object({
  raceId: z.string().min(1, "Chọn giải chạy"),
  distanceId: z.string().min(1, "Chọn cự ly"),
  price: money,
  gender: z.enum(["male", "female", "any"]).default("any"),
  shirtSize: str(10).default(""),
  includesKit: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
  note: str(500).default(""),
  kind: z.enum(["resale", "official"]).default("resale"),
  quantity: z.coerce.number().int().min(1).max(5000).default(1),
  clientEmail: str(120).optional(),
  promote: z.enum(["", "top24h", "top72h", "featured7d"]).default(""),
});

export async function createListingAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("/sell");
  let id = "";
  const res = await guard(async () => {
    const input = listingSchema.parse(Object.fromEntries(fd));
    const l = await market.createListing(user, { ...input, clientEmail: input.clientEmail || undefined });
    if (input.promote) await market.promoteListing(user, l.id, input.promote);
    id = l.id;
  });
  if (res.error) return res;
  revalidatePath("/races");
  redirect(`/listings/${id}?created=1`);
}

const consignSchema = z.object({
  raceId: z.string().min(1, "Chọn giải chạy"),
  distanceId: z.string().min(1, "Chọn cự ly"),
  desiredPrice: money,
  tier: z.enum(["standard", "express"]),
  note: str(500).default(""),
});

export async function createConsignmentAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("/sell");
  return guard(async () => {
    await market.createConsignment(user, consignSchema.parse(Object.fromEntries(fd)));
    return { ok: true, message: "Đã gửi yêu cầu bán hộ. Chuyên viên KBIB sẽ liên hệ trong 2 giờ làm việc." };
  });
}

export async function cancelListingAction(fd: FormData) {
  const user = await requireUser();
  await guard(() => market.cancelListing(user, String(fd.get("id"))));
  revalidatePath("/dashboard/listings");
}

export async function updatePriceAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  return guard(async () => {
    await market.updateListingPrice(user, String(fd.get("id")), money.parse(fd.get("price")));
    revalidatePath(`/listings/${fd.get("id")}`);
    return { ok: true, message: "Đã cập nhật giá" };
  });
}

export async function promoteAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  return guard(async () => {
    const r = await market.promoteListing(user, String(fd.get("id")), String(fd.get("pkg")) as PromoPackage);
    revalidatePath("/dashboard/listings");
    return { ok: true, message: `Đã đẩy tin (${formatVND(r.price)}) đến ${new Date(r.end).toLocaleString("vi-VN")}` };
  });
}

export async function createAlertAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  return guard(async () => {
    await market.createAlert(user, String(fd.get("raceId")), String(fd.get("distanceId")), money.parse(fd.get("maxPrice") || 0));
    return { ok: true, message: "Đã bật thông báo. Bạn sẽ nhận tin ngay khi có bib phù hợp." };
  });
}

export async function closeAlertAction(fd: FormData) {
  const user = await requireUser();
  const a = await db.wtb_alerts.get(String(fd.get("id")));
  if (a && a.userId === user.id) await db.wtb_alerts.update(a.id, { status: "closed" });
  revalidatePath("/dashboard/alerts");
}

/* ───────── Checkout & escrow ───────── */

const runnerSchema = z.object({
  fullName: z.string().trim().min(2, "Nhập họ tên trên CCCD"),
  dob: z.string().min(8, "Nhập ngày sinh"),
  gender: z.enum(["male", "female"]),
  idNumber: z.string().trim().regex(/^\d{9,12}$/, "Số CCCD/CMND không hợp lệ"),
  phone: z.string().trim().regex(/^0\d{9,10}$/, "Số điện thoại không hợp lệ"),
  shirtSize: str(10).default("M"),
  emergencyContact: z.string().trim().min(5, "Nhập liên hệ khẩn cấp"),
});

export async function checkoutAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const listingId = String(fd.get("listingId"));
  const user = await requireUser(`/checkout/${listingId}`);
  let orderId = "";
  const res = await guard(async () => {
    if (fd.get("agree") !== "on") return { error: "Vui lòng đồng ý điều khoản chuyển nhượng" };
    const runnerInfo = runnerSchema.parse(Object.fromEntries(fd));
    const order = await orders.createOrder({ buyer: user, listingId, runnerInfo, serviceIds: fd.getAll("services").map(String) });
    orderId = order.id;
  });
  if (res.error) return res;
  redirect(`/orders/${orderId}`);
}

export async function sandboxPayAction(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get("id"));
  const o = await db.orders.get(id);
  if (!o || o.buyerId !== user.id || process.env.PAYMENT_SANDBOX === "false") return;
  await orders.markPaid(id, "sandbox", `SBX${Date.now()}`);
  revalidatePath(`/orders/${id}`);
}

export async function cancelOrderAction(fd: FormData) {
  const user = await requireUser();
  const o = await db.orders.get(String(fd.get("id")));
  if (o && o.buyerId === user.id) await orders.cancelOrder(o.id);
  revalidatePath(`/orders/${fd.get("id")}`);
}

export async function confirmReceivedAction(fd: FormData) {
  const user = await requireUser();
  await guard(() => orders.confirmReceived(String(fd.get("id")), user));
  revalidatePath(`/orders/${fd.get("id")}`);
}

export async function sellerHandoverAction(fd: FormData) {
  // For races with transferPolicy "allowed" (no organizer API) the seller hands the bib over directly.
  const user = await requireUser();
  const t = await db.transfers.find((t) => t.orderId === String(fd.get("id")) && t.status === "requested");
  if (t) await guard(() => orders.approveTransfer(t.id, user, String(fd.get("bibCode") ?? "")));
  revalidatePath(`/orders/${fd.get("id")}`);
}

export async function disputeAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  return guard(async () => {
    const o = await db.orders.get(String(fd.get("id")));
    if (!o || (o.buyerId !== user.id && o.sellerId !== user.id)) return { error: "Không có quyền" };
    await orders.openDispute(o.id, user.id, str(120).min(3, "Chọn lý do").parse(fd.get("reason")), str(1000).parse(fd.get("detail") ?? ""));
    revalidatePath(`/orders/${o.id}`);
    return { ok: true, message: "Đã mở tranh chấp. Tiền tiếp tục được giữ an toàn trong khi KBIB xử lý (≤ 48h)." };
  });
}

export async function reviewAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  return guard(async () => {
    const o = await db.orders.get(String(fd.get("id")));
    if (!o || o.buyerId !== user.id || o.status !== "completed") return { error: "Không thể đánh giá đơn này" };
    if (await db.reviews.find((r) => r.orderId === o.id)) return { error: "Bạn đã đánh giá đơn này" };
    await db.reviews.insert({
      id: newId("rev"),
      orderId: o.id,
      reviewerId: user.id,
      revieweeId: o.sellerId,
      rating: z.coerce.number().int().min(1).max(5).parse(fd.get("rating")),
      comment: str(500).parse(fd.get("comment") ?? ""),
      createdAt: nowIso(),
    });
    revalidatePath(`/orders/${o.id}`);
    return { ok: true, message: "Cảm ơn bạn đã đánh giá!" };
  });
}

/* ───────── Profile ───────── */

const profileSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().regex(/^0\d{9,10}$/, "Số điện thoại không hợp lệ"),
  region: z.enum(["", "north", "central", "south", "highland"]),
  itraPoints: z.coerce.number().int().min(0).max(50),
  utmbIndex: z.coerce.number().int().min(0).max(1000),
  longestRaceKm: z.coerce.number().min(0).max(500),
  bankName: str(60),
  bankAccount: str(30),
});

export async function updateProfileAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  return guard(async () => {
    await db.users.update(user.id, profileSchema.parse(Object.fromEntries(fd)));
    revalidatePath("/dashboard/profile");
    return { ok: true, message: "Đã lưu hồ sơ" };
  });
}

export async function connectStravaAction() {
  // Placeholder for the OAuth flow: marks the account as linked so qualification checks can use it.
  const user = await requireUser();
  await db.users.update(user.id, { stravaConnected: !user.stravaConnected });
  revalidatePath("/dashboard/profile");
}

export async function markNotificationsReadAction() {
  const user = await requireUser();
  for (const n of await db.notifications.where((n) => n.userId === user.id && !n.read)) await db.notifications.update(n.id, { read: true });
  revalidatePath("/dashboard/notifications");
}
