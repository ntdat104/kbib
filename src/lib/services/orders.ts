import { db, newId, withLock } from "@/lib/db";
import type { Order, OrderAddon, RunnerInfo, Transfer, User } from "@/lib/types";
import { formatVND, nowIso } from "@/lib/utils";
import { checkEligibility } from "./catalog";
import { scanBuyer } from "./fraud";
import { discord } from "./discord";
import { orderRevenueEntries, record } from "./ledger";
import { notify, notifyAdmins } from "./notify";
import { quote, servicePrice } from "./pricing";
import { getSettings } from "./settings";

export class DomainError extends Error {}

const PAYMENT_WINDOW_MIN = 30;

function orderCode() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `KB${ymd}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/** Release listings held by orders that were never paid. Cheap enough to run lazily. */
export async function expireUnpaidOrders() {
  const cutoff = Date.now() - PAYMENT_WINDOW_MIN * 60000;
  const stale = await db.orders.where((o) => o.status === "pending_payment" && new Date(o.createdAt).getTime() < cutoff);
  for (const o of stale) await cancelOrder(o.id, "Hết hạn thanh toán");
}

export async function createOrder(input: {
  buyer: User;
  listingId: string;
  runnerInfo: RunnerInfo;
  serviceIds: string[];
}): Promise<Order> {
  const { buyer, listingId } = input;
  await expireUnpaidOrders();
  return withLock(`listing:${listingId}`, async () => {
    const s = await getSettings();
    const listing = await db.listings.get(listingId);
    if (!listing || listing.status !== "active") throw new DomainError("Bib này vừa được người khác đặt. Hãy chọn bib khác.");
    if (listing.sellerId === buyer.id) throw new DomainError("Bạn không thể mua bib của chính mình.");
    const [race, distance] = await Promise.all([db.races.get(listing.raceId), db.distances.get(listing.distanceId)]);
    if (!race || !distance) throw new DomainError("Giải chạy không tồn tại.");
    if (race.transferPolicy === "closed") throw new DomainError("Giải này đã đóng chuyển nhượng.");
    if (race.transferDeadline && race.transferDeadline < new Date().toISOString().slice(0, 10))
      throw new DomainError("Đã quá hạn đổi tên của BTC.");

    const elig = checkEligibility(distance, buyer);
    if (!elig.eligible)
      throw new DomainError(`Cự ly ${distance.name} yêu cầu: ${elig.reqs.filter((r) => !r.ok).map((r) => r.label).join(", ")}. Cập nhật hồ sơ năng lực để mua.`);

    const owned = await db.orders.where(
      (o) => o.buyerId === buyer.id && o.distanceId === distance.id && !["cancelled", "refunded"].includes(o.status),
    );
    if (owned.length >= s.maxPurchasesPerDistance)
      throw new DomainError("Mỗi runner chỉ được mua 1 bib cho mỗi cự ly (chống gom bib).");

    const services = await db.services.where((x) => input.serviceIds.includes(x.id) && x.active);
    const addons: OrderAddon[] = services.map((svc) => {
      const price = servicePrice(s, svc, listing.price);
      return {
        serviceId: svc.id,
        type: svc.type,
        name: svc.name,
        price,
        commission: Math.round((price * svc.commissionPct) / 100),
        partnerId: svc.partnerId,
      };
    });
    const addonsTotal = addons.reduce((a, b) => a + b.price, 0);
    const consignment = listing.consignmentId ? await db.consignments.get(listing.consignmentId) : null;
    const q = quote(s, listing.kind, listing.price, addonsTotal, consignment?.feePct);

    // Agent: whoever listed it on behalf of a client, else the agent who referred the buyer.
    let agentId = listing.agentId;
    if (!agentId && buyer.referredBy) {
      agentId = (await db.users.find((u) => u.referralCode === buyer.referredBy && u.role === "agent"))?.id ?? "";
    }
    const agentCommission = agentId ? Math.round(((q.buyerFee + q.sellerFee) * s.agentSharePct) / 100) : 0;
    const brokerCommission = listing.brokerId ? Math.round((q.sellerFee * s.brokerSharePct) / 100) : 0;

    if (listing.quantity > 1) await db.listings.update(listing.id, { quantity: listing.quantity - 1 });
    else await db.listings.update(listing.id, { status: "reserved" });

    const order = await db.orders.insert({
      id: newId("ord"),
      code: orderCode(),
      listingId: listing.id,
      raceId: race.id,
      distanceId: distance.id,
      buyerId: buyer.id,
      sellerId: listing.sellerId,
      kind: listing.kind,
      price: q.price,
      buyerFee: q.buyerFee,
      sellerFee: q.sellerFee,
      escrowFee: q.escrowFee,
      addonsTotal,
      total: q.total,
      sellerPayout: q.sellerPayout,
      addons,
      runnerInfo: input.runnerInfo,
      status: "pending_payment",
      paymentMethod: "vietqr",
      agentId,
      agentCommission,
      brokerId: listing.brokerId,
      brokerCommission,
      createdAt: nowIso(),
    });
    await scanBuyer(buyer.id);
    return order;
  });
}

export async function markPaid(orderId: string, method: Order["paymentMethod"], ref: string) {
  return withLock(`order:${orderId}`, async () => {
    const o = await db.orders.get(orderId);
    if (!o) throw new DomainError("Không tìm thấy đơn hàng");
    if (o.status !== "pending_payment") return o;
    const listing = await db.listings.get(o.listingId);
    if (listing && listing.status === "reserved") await db.listings.update(listing.id, { status: "sold" });
    const race = await db.races.get(o.raceId);
    const transfer = await db.transfers.insert({
      id: newId("trf"),
      orderId: o.id,
      raceId: o.raceId,
      distanceId: o.distanceId,
      fromUserId: o.sellerId,
      toUserId: o.buyerId,
      runnerInfo: o.runnerInfo,
      status: "requested",
      organizerFee: race?.transferFee ?? 0,
      createdAt: nowIso(),
    });
    const updated = await db.orders.update(o.id, {
      status: "transferring",
      paymentMethod: method,
      paymentRef: ref,
      paidAt: nowIso(),
    });
    // Close the buyer's matching want-to-buy alerts.
    for (const a of await db.wtb_alerts.where((a) => a.userId === o.buyerId && a.distanceId === o.distanceId && a.status === "active"))
      await db.wtb_alerts.update(a.id, { status: "matched" });

    await notify(o.buyerId, "Thanh toán thành công", `Đơn ${o.code}: tiền đang được giữ an toàn tại KBIB. Chúng tôi đã gửi yêu cầu đổi tên tới BTC.`, `/orders/${o.id}`);
    await notify(o.sellerId, "Bib của bạn đã được bán", `Đơn ${o.code} đã thanh toán. Tiền sẽ về ví sau khi đổi tên thành công.`, `/orders/${o.id}`);
    if (race?.organizerId) await notify(race.organizerId, "Yêu cầu đổi tên mới", `${race.name}: ${o.runnerInfo?.fullName}`, `/organizer/transfers`);
    discord("order_paid", `Đơn ${o.code} đã thanh toán – tiền vào escrow`, {
      fields: { Giải: race?.name ?? "", "Giá bib": formatVND(o.price), "Tổng thu": formatVND(o.total), "Phương thức": method, Loại: o.kind },
      link: `/orders/${o.id}`,
    });
    if (o.brokerId) await notify(o.brokerId, "Bib ủy thác đã bán", `Đơn ${o.code} – hỗ trợ đổi tên cho khách.`, `/broker`);
    return { ...updated, transferId: transfer.id };
  });
}

/** Who may approve a name change: admin, the race organizer, the assigned broker,
 *  or the seller themself when the race allows direct hand-over (no organizer API). */
export async function canHandleTransfer(user: User, t: Pick<Transfer, "raceId" | "fromUserId">, orderBrokerId: string) {
  if (user.role === "admin") return true;
  if (user.role === "broker" && orderBrokerId === user.id) return true;
  const race = await db.races.get(t.raceId);
  if (race?.transferPolicy === "allowed" && t.fromUserId === user.id) return true;
  return user.role === "organizer" && race?.organizerId === user.id;
}

export async function approveTransfer(transferId: string, actor: User, bibCode: string) {
  const t = await db.transfers.get(transferId);
  if (!t || t.status !== "requested") throw new DomainError("Yêu cầu không hợp lệ");
  const o = await db.orders.get(t.orderId);
  if (!o) throw new DomainError("Không tìm thấy đơn");
  if (!(await canHandleTransfer(actor, t, o.brokerId))) throw new DomainError("Bạn không có quyền duyệt yêu cầu này");
  const s = await getSettings();
  const platformShare = Math.round((t.organizerFee * s.transferSharePct) / 100);
  await db.transfers.update(t.id, {
    status: "approved",
    newBibCode: bibCode || `BIB-${Math.floor(1000 + Math.random() * 8999)}`,
    platformShare,
    handledBy: actor.id,
    handledAt: nowIso(),
  });
  if (platformShare) await record({ stream: "transfer_share", amount: platformShare, orderId: o.id, raceId: o.raceId, refId: t.id });
  await db.orders.update(o.id, { status: "transferred", transferredAt: nowIso() });
  discord("transfer_approved", `Đổi tên thành công – đơn ${o.code}`, {
    fields: { "Duyệt bởi": actor.orgName || actor.name, "Mã bib": bibCode || "tự sinh", "Chia sẻ phí BTC": formatVND(platformShare) },
    link: `/orders/${o.id}`,
  });
  await notify(o.buyerId, "Đổi tên thành công 🎉", `Bib mới đã đứng tên bạn. Xác nhận để hoàn tất đơn ${o.code}.`, `/orders/${o.id}`);
  await notify(o.sellerId, "BTC đã duyệt đổi tên", `Đơn ${o.code} chờ người mua xác nhận (tự động sau 72h).`, `/orders/${o.id}`);
}

export async function rejectTransfer(transferId: string, actor: User, reason: string) {
  const t = await db.transfers.get(transferId);
  if (!t || t.status !== "requested") throw new DomainError("Yêu cầu không hợp lệ");
  const o = await db.orders.get(t.orderId);
  if (!o || !(await canHandleTransfer(actor, t, o.brokerId))) throw new DomainError("Bạn không có quyền");
  await db.transfers.update(t.id, { status: "rejected", reason, handledBy: actor.id, handledAt: nowIso() });
  await openDispute(o.id, actor.id, "Đổi tên bị từ chối", reason);
}

export async function completeOrder(orderId: string) {
  return withLock(`order:${orderId}`, async () => {
    const o = await db.orders.get(orderId);
    if (!o || !["transferred", "disputed"].includes(o.status)) return;
    const at = nowIso();
    await db.orders.update(o.id, { status: "completed", completedAt: at });
    await db.ledger.insertMany(orderRevenueEntries(o, at));
    const payouts = [
      { userId: o.sellerId, type: "seller_payout" as const, amount: o.sellerPayout },
      { userId: o.agentId, type: "agent_commission" as const, amount: o.agentCommission },
      { userId: o.brokerId, type: "broker_commission" as const, amount: o.brokerCommission },
    ].filter((p) => p.userId && p.amount > 0);
    await db.payouts.insertMany(payouts.map((p) => ({ id: newId("pay"), orderId: o.id, status: "pending" as const, createdAt: at, ...p })));

    const seller = await db.users.get(o.sellerId);
    if (seller) await db.users.update(seller.id, { trustScore: Math.min(100, seller.trustScore + 2) });
    const listing = await db.listings.get(o.listingId);
    if (listing?.consignmentId) await db.consignments.update(listing.consignmentId, { status: "sold" });

    await rewardVoucher(o);
    const revenue = orderRevenueEntries(o, at).reduce((s, e) => s + (e.amount ?? 0), 0);
    discord("order_completed", `Đơn ${o.code} hoàn tất – giải ngân`, {
      fields: { "Trả người bán": formatVND(o.sellerPayout), "Doanh thu ròng": formatVND(revenue), "Hoa hồng đại lý": formatVND(o.agentCommission), "Hoa hồng trung gian": formatVND(o.brokerCommission) },
      link: "/admin/payouts",
    });
    await notify(o.sellerId, "Tiền đã được giải ngân", `Đơn ${o.code}: ${o.sellerPayout.toLocaleString("vi-VN")}đ đang chờ chuyển khoản.`, `/dashboard/wallet`);
    await notify(o.buyerId, "Đơn hoàn tất – chúc bạn chạy tốt!", "Bạn nhận được voucher từ đối tác. Đừng quên đánh giá người bán.", `/orders/${o.id}`);
  });
}

async function rewardVoucher(o: Order) {
  const [race, distance] = await Promise.all([db.races.get(o.raceId), db.distances.get(o.distanceId)]);
  const v = await db.vouchers.find(
    (v) => v.active && v.claimed < v.quantity && (v.target === "all" || v.target === race?.type) && (distance?.km ?? 0) >= v.minKm,
  );
  if (!v) return;
  await db.vouchers.update(v.id, { claimed: v.claimed + 1 });
  await db.user_vouchers.insert({ id: newId("uv"), userId: o.buyerId, voucherId: v.id, orderId: o.id, createdAt: nowIso() });
  await db.orders.update(o.id, { voucherId: v.id });
  if (v.cpa) await record({ stream: "voucher", amount: v.cpa, orderId: o.id, raceId: o.raceId, refId: v.id, note: v.code });
}

export async function confirmReceived(orderId: string, user: User) {
  const o = await db.orders.get(orderId);
  if (!o || o.buyerId !== user.id) throw new DomainError("Không có quyền");
  if (o.status !== "transferred") throw new DomainError("Đơn chưa ở trạng thái đã đổi tên");
  await completeOrder(o.id);
}

/** Auto-release escrow N hours after a successful transfer if the buyer stays silent. */
export async function autoCompleteOrders() {
  const s = await getSettings();
  const cutoff = Date.now() - s.autoCompleteHours * 3600000;
  const due = await db.orders.where((o) => o.status === "transferred" && new Date(o.transferredAt).getTime() < cutoff);
  for (const o of due) await completeOrder(o.id);
  return due.length;
}

export async function openDispute(orderId: string, userId: string, reason: string, detail: string) {
  const o = await db.orders.get(orderId);
  if (!o) throw new DomainError("Không tìm thấy đơn");
  if (!["transferring", "transferred", "paid"].includes(o.status)) throw new DomainError("Không thể mở tranh chấp ở trạng thái này");
  await db.disputes.insert({ id: newId("dsp"), orderId, openedBy: userId, reason, detail, status: "open", createdAt: nowIso() });
  await db.orders.update(o.id, { status: "disputed" });
  await notifyAdmins("Tranh chấp mới", `Đơn ${o.code}: ${reason}`, "/admin/disputes");
  discord("dispute_opened", `Tranh chấp mới – đơn ${o.code}`, {
    description: detail.slice(0, 500),
    fields: { "Lý do": reason, "Giá trị đang giữ": formatVND(o.total), "SLA": "48 giờ" },
    link: "/admin/disputes",
  });
  for (const uid of [o.buyerId, o.sellerId].filter((x) => x !== userId))
    await notify(uid, "Đơn hàng đang tranh chấp", `Đơn ${o.code}: ${reason}. Tiền vẫn được giữ an toàn.`, `/orders/${o.id}`);
}

export async function resolveDispute(disputeId: string, outcome: "buyer" | "seller", resolution: string) {
  const d = await db.disputes.get(disputeId);
  if (!d || d.status !== "open") throw new DomainError("Tranh chấp đã xử lý");
  const o = await db.orders.get(d.orderId);
  if (!o) throw new DomainError("Không tìm thấy đơn");
  await db.disputes.update(d.id, { status: outcome === "buyer" ? "resolved_buyer" : "resolved_seller", resolution, resolvedAt: nowIso() });
  discord("dispute_resolved", `Đã xử lý tranh chấp đơn ${o.code}`, {
    fields: { "Kết quả": outcome === "buyer" ? "Hoàn tiền người mua" : "Giải ngân người bán", "Giá trị": formatVND(o.total) },
    description: resolution.slice(0, 500),
    link: `/orders/${o.id}`,
  });
  if (outcome === "seller") {
    await completeOrder(o.id);
  } else {
    await db.orders.update(o.id, { status: "refunded" });
    await db.payouts.insert({ id: newId("pay"), userId: o.buyerId, orderId: o.id, type: "refund", amount: o.total, status: "pending", createdAt: nowIso() });
    await notify(o.buyerId, "Bạn được hoàn tiền", `Đơn ${o.code}: hoàn ${o.total.toLocaleString("vi-VN")}đ.`, `/orders/${o.id}`);
    await notify(o.sellerId, "Tranh chấp kết thúc", `Đơn ${o.code} được hoàn tiền cho người mua. ${resolution}`, `/orders/${o.id}`);
  }
}

export async function cancelOrder(orderId: string, reason = "Người mua huỷ") {
  return withLock(`order:${orderId}`, async () => {
    const o = await db.orders.get(orderId);
    if (!o || o.status !== "pending_payment") return;
    await db.orders.update(o.id, { status: "cancelled", paymentRef: reason });
    const l = await db.listings.get(o.listingId);
    if (l?.status === "reserved") await db.listings.update(l.id, { status: "active" });
    else if (l && l.quantity >= 1 && l.kind === "official") await db.listings.update(l.id, { quantity: l.quantity + 1 });
  });
}
