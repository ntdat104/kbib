import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Gift, Hash, ShieldCheck, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/form";
import { OrderStatusBadge } from "@/components/market/bits";
import { EscrowTimeline } from "@/components/market/escrow-timeline";
import { DisputeForm, ReviewForm } from "@/components/market/order-forms";
import { cancelOrderAction, confirmReceivedAction, sandboxPayAction, sellerHandoverAction } from "@/lib/actions/market";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { getUserName } from "@/lib/services/catalog";
import { getSettings } from "@/lib/services/settings";
import { formatDate, formatDateTime, formatVND } from "@/lib/utils";

export const metadata: Metadata = { title: "Chi tiết đơn hàng" };

export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/orders/${id}`);
  const o = await db.orders.get(id);
  if (!o) notFound();
  const [race, distance, transfer, review, dispute, voucher, s] = await Promise.all([
    db.races.get(o.raceId),
    db.distances.get(o.distanceId),
    db.transfers.find((t) => t.orderId === o.id),
    db.reviews.find((r) => r.orderId === o.id),
    db.disputes.find((d) => d.orderId === o.id),
    o.voucherId ? db.vouchers.get(o.voucherId) : null,
    getSettings(),
  ]);
  const isBuyer = o.buyerId === user.id;
  const isSeller = o.sellerId === user.id;
  const allowed = isBuyer || isSeller || [o.agentId, o.brokerId, race?.organizerId].includes(user.id) || user.role === "admin";
  if (!allowed || !race || !distance) notFound();
  const sellerName = await getUserName(o.sellerId);
  const expiresAt = new Date(new Date(o.createdAt).getTime() + 30 * 60000);
  const bank = { bin: process.env.ESCROW_BANK_BIN ?? "970436", acc: process.env.ESCROW_BANK_ACCOUNT ?? "0123456789", name: process.env.ESCROW_BANK_NAME ?? "CONG TY KBIB" };
  const qr = `https://img.vietqr.io/image/${bank.bin}-${bank.acc}-compact2.png?amount=${o.total}&addInfo=${o.code}&accountName=${encodeURIComponent(bank.name)}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Đơn hàng <span className="font-mono font-semibold text-ink">{o.code}</span> · {formatDateTime(o.createdAt)}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{race.name} · {distance.name}</h1>
        </div>
        <OrderStatusBadge status={o.status} />
      </div>

      <Card className="mt-6 p-5 sm:p-6"><EscrowTimeline status={o.status} /></Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {o.status === "pending_payment" && isBuyer && (
            <Card>
              <CardHeader title="Chuyển khoản để giữ bib" subtitle={<span className="inline-flex items-center gap-1"><Clock className="size-3.5" />Hạn thanh toán {expiresAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>} />
              <div className="grid gap-6 p-5 sm:grid-cols-[200px_1fr]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt={`Mã VietQR thanh toán ${o.code}`} className="mx-auto w-48 rounded-2xl border border-line bg-white p-2" />
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted">Số tiền:</span> <b className="text-lg text-brand-700">{formatVND(o.total)}</b></p>
                  <p><span className="text-muted">Nội dung:</span> <b className="font-mono">{o.code}</b></p>
                  <p><span className="text-muted">Tài khoản escrow:</span> {bank.acc} · {bank.name}</p>
                  <p className="text-xs text-muted">Hệ thống tự xác nhận trong 1–3 phút qua webhook ngân hàng.</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {process.env.PAYMENT_SANDBOX !== "false" && (
                      <form action={sandboxPayAction}><input type="hidden" name="id" value={o.id} /><SubmitButton>Thanh toán thử (sandbox)</SubmitButton></form>
                    )}
                    <form action={cancelOrderAction}><input type="hidden" name="id" value={o.id} /><Button variant="ghost">Huỷ đơn</Button></form>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {transfer && (
            <Card>
              <CardHeader title="Đổi tên chính thức" subtitle={race.transferPolicy === "official" ? "Yêu cầu gửi tới BTC qua KBIB" : "Người bán bàn giao bib, KBIB giám sát"} />
              <div className="space-y-3 p-5 text-sm">
                <div className="flex justify-between"><span className="text-muted">Trạng thái</span><b>{transfer.status === "approved" ? "Đã duyệt ✓" : transfer.status === "rejected" ? "Bị từ chối" : "Đang chờ BTC xử lý"}</b></div>
                <div className="flex justify-between"><span className="text-muted">Người đứng tên mới</span><b>{transfer.runnerInfo?.fullName}</b></div>
                {transfer.newBibCode && (
                  <div className="flex items-center justify-between rounded-xl bg-brand-50 p-3">
                    <span className="inline-flex items-center gap-1.5 text-brand-700"><Hash className="size-4" />Mã bib mới</span>
                    <b className="font-mono text-lg text-brand-700">{transfer.newBibCode}</b>
                  </div>
                )}
                {transfer.reason && <p className="text-rose-600">Lý do: {transfer.reason}</p>}
                {isSeller && transfer.status === "requested" && race.transferPolicy === "allowed" && (
                  <form action={sellerHandoverAction} className="flex gap-2 pt-2">
                    <input type="hidden" name="id" value={o.id} />
                    <input name="bibCode" placeholder="Mã bib / mã QR nhận kit" className="field" required />
                    <SubmitButton>Xác nhận đã bàn giao</SubmitButton>
                  </form>
                )}
              </div>
            </Card>
          )}

          {isBuyer && o.status === "transferred" && (
            <Card className="border-brand-200 p-5">
              <p className="font-semibold">Bạn đã thấy tên mình trên danh sách BTC?</p>
              <p className="mt-1 text-sm text-muted">Xác nhận để giải ngân cho người bán. Hệ thống tự xác nhận sau {s.autoCompleteHours} giờ nếu không có khiếu nại.</p>
              <form action={confirmReceivedAction} className="mt-4"><input type="hidden" name="id" value={o.id} /><SubmitButton size="lg"><ShieldCheck className="size-4" /> Tôi đã nhận bib – hoàn tất</SubmitButton></form>
            </Card>
          )}

          {(isBuyer || isSeller) && ["transferring", "transferred", "paid"].includes(o.status) && <DisputeForm id={o.id} />}

          {dispute && (
            <Card className="border-rose-200 p-5 text-sm">
              <p className="font-semibold text-rose-700">Tranh chấp: {dispute.reason}</p>
              <p className="mt-1 text-muted">{dispute.detail}</p>
              {dispute.status !== "open" && <p className="mt-2"><b>Kết quả:</b> {dispute.status === "resolved_buyer" ? "Hoàn tiền người mua" : "Giải ngân người bán"} – {dispute.resolution}</p>}
            </Card>
          )}

          {o.status === "completed" && isBuyer && voucher && (
            <Card className="overflow-hidden">
              <div className="flex items-center gap-4 bg-gradient-to-r from-brand-500 to-amber-400 p-5 text-white">
                <Gift className="size-8 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-white/85">Quà tặng từ đối tác</p>
                  <p className="text-lg font-bold">{voucher.title}</p>
                </div>
                <span className="rounded-xl bg-white px-3 py-2 font-mono text-sm font-bold text-brand-700">{voucher.code}</span>
              </div>
              <p className="px-5 py-3 text-sm text-muted">{voucher.description} <a href={voucher.link} target="_blank" rel="noopener sponsored" className="font-semibold text-brand-700">Dùng ngay →</a></p>
            </Card>
          )}

          {o.status === "completed" && isBuyer && !review && (
            <Card className="p-5"><p className="mb-3 font-semibold">Đánh giá {sellerName}</p><ReviewForm id={o.id} /></Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="p-5 text-sm">
            <p className="font-semibold">Chi tiết thanh toán</p>
            <dl className="mt-3 space-y-2">
              <div className="flex justify-between"><dt className="text-muted">Giá bib</dt><dd className="tabular-nums">{formatVND(o.price)}</dd></div>
              {isSeller ? (
                <>
                  <div className="flex justify-between"><dt className="text-muted">Phí {o.kind === "consignment" ? "bán hộ" : "người bán"}</dt><dd className="tabular-nums">−{formatVND(o.sellerFee)}</dd></div>
                  <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Bạn nhận</dt><dd className="tabular-nums text-emerald-700">{formatVND(o.sellerPayout)}</dd></div>
                </>
              ) : (
                <>
                  {o.buyerFee > 0 && <div className="flex justify-between"><dt className="text-muted">Phí dịch vụ</dt><dd className="tabular-nums">{formatVND(o.buyerFee)}</dd></div>}
                  <div className="flex justify-between"><dt className="text-muted">Phí escrow</dt><dd className="tabular-nums">{formatVND(o.escrowFee)}</dd></div>
                  {o.addons?.map((a) => <div key={a.serviceId} className="flex justify-between gap-2"><dt className="text-muted">{a.name}</dt><dd className="tabular-nums">{formatVND(a.price)}</dd></div>)}
                  <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Tổng</dt><dd className="tabular-nums">{formatVND(o.total)}</dd></div>
                </>
              )}
            </dl>
          </Card>
          <Card className="p-5 text-sm">
            <p className="font-semibold">Thông tin</p>
            <ul className="mt-3 space-y-1.5 text-muted">
              <li className="flex items-center gap-1.5"><Ticket className="size-4" /> <Link href={`/races/${race.slug}`} className="hover:text-brand-700">{race.name}</Link></li>
              <li>Ngày chạy: {formatDate(race.date)}</li>
              <li>Hạn đổi tên: {formatDate(race.transferDeadline)}</li>
              <li>Người bán: {sellerName}</li>
              {o.paidAt && <li>Thanh toán: {formatDateTime(o.paidAt)}</li>}
              {o.completedAt && <li>Hoàn tất: {formatDateTime(o.completedAt)}</li>}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
