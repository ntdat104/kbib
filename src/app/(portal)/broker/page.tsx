import type { Metadata } from "next";
import Link from "next/link";
import { Coins, Inbox, Timer, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, EmptyState, PageHeader, StatCard } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/form";
import { ConsignListForm } from "@/components/portal/consign-list-form";
import { approveTransferAction, claimConsignmentAction } from "@/lib/actions/portal";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { suggestedPrice } from "@/lib/services/insights";
import { maxAllowedPrice } from "@/lib/services/pricing";
import { formatDateTime, formatVND } from "@/lib/utils";

export const metadata: Metadata = { title: "Cổng trung gian" };

export default async function BrokerPage() {
  const user = await requireRole("broker");
  const [queue, mine, races, distances, users, payouts, orders, transfers] = await Promise.all([
    db.consignments.where((c) => c.status === "new"),
    db.consignments.where((c) => c.brokerId === user.id),
    db.races.all(), db.distances.all(), db.users.all(),
    db.payouts.where((p) => p.userId === user.id),
    db.orders.where((o) => o.brokerId === user.id),
    db.transfers.where((t) => t.status === "requested"),
  ]);
  const race = (id: string) => races.find((r) => r.id === id);
  const dist = (id: string) => distances.find((d) => d.id === id);
  const assigned = mine.filter((c) => c.status === "assigned");
  const toTransfer = orders.filter((o) => o.status === "transferring").map((o) => ({ o, t: transfers.find((t) => t.orderId === o.id) })).filter((x) => x.t);
  const suggestions = new Map(await Promise.all(assigned.map(async (c) => [c.id, (await suggestedPrice(c.distanceId))?.median ?? c.desiredPrice] as const)));

  return (
    <>
      <PageHeader eyebrow="Trung gian pass bib" title="Hàng đợi bán hộ" subtitle="Nhận yêu cầu, định giá, đăng bán và hỗ trợ khách đổi tên với BTC." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Yêu cầu mới" value={queue.length} icon={<Inbox className="size-4" />} />
        <StatCard label="Đang xử lý" value={assigned.length} icon={<Timer className="size-4" />} />
        <StatCard label="Đã bán" value={mine.filter((c) => c.status === "sold").length} />
        <StatCard label="Hoa hồng" value={formatVND(payouts.reduce((a, p) => a + p.amount, 0))} icon={<Coins className="size-4" />} />
      </div>

      <Card className="mt-6">
        <CardHeader title="Yêu cầu mới" subtitle="Ưu tiên gói Bán nhanh – cam kết đăng trong 2 giờ" />
        {queue.length ? (
          <ul className="divide-y divide-line">
            {queue.sort((a, b) => Number(b.tier === "express") - Number(a.tier === "express")).map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                {c.tier === "express" ? <Badge tone="brand" icon={<Zap className="size-3" />}>Nhanh {c.feePct}%</Badge> : <Badge>Tiêu chuẩn {c.feePct}%</Badge>}
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{race(c.raceId)?.name} · {dist(c.distanceId)?.name}</p><p className="text-xs text-muted">{users.find((u) => u.id === c.userId)?.name} · mong muốn {formatVND(c.desiredPrice)} · {formatDateTime(c.createdAt)}</p></div>
                <form action={claimConsignmentAction}><input type="hidden" name="id" value={c.id} /><SubmitButton size="sm" variant="dark">Nhận xử lý</SubmitButton></form>
              </li>
            ))}
          </ul>
        ) : <div className="p-5"><EmptyState title="Hàng đợi trống" /></div>}
      </Card>

      <Card className="mt-6">
        <CardHeader title="Đang xử lý của bạn" />
        {assigned.length ? (
          <ul className="divide-y divide-line">
            {assigned.map((c) => {
              const d = dist(c.distanceId)!;
              const r = race(c.raceId)!;
              return (
                <li key={c.id} className="space-y-2 px-5 py-4">
                  <p className="text-sm font-medium">{r.name} · {d.name} <span className="text-muted">(gốc {formatVND(d.originalPrice)}, khách muốn {formatVND(c.desiredPrice)})</span></p>
                  <ConsignListForm id={c.id} suggested={suggestions.get(c.id) ?? c.desiredPrice} cap={maxAllowedPrice(d.originalPrice, r.priceCapPct)} />
                </li>
              );
            })}
          </ul>
        ) : <div className="p-5 text-sm text-muted">Không có yêu cầu đang xử lý.</div>}
      </Card>

      {toTransfer.length > 0 && (
        <Card className="mt-6">
          <CardHeader title="Hỗ trợ đổi tên" subtitle="Đơn bán hộ đã thanh toán – liên hệ BTC & xác nhận mã bib mới" />
          <ul className="divide-y divide-line">
            {toTransfer.map(({ o, t }) => (
              <li key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="flex-1 text-sm"><Link href={`/orders/${o.id}`} className="font-mono font-semibold">{o.code}</Link> · {t!.runnerInfo?.fullName}</div>
                <form action={approveTransferAction} className="flex gap-2"><input type="hidden" name="id" value={t!.id} /><input name="bibCode" placeholder="Mã bib mới" className="field h-9 w-36" required /><SubmitButton size="sm">Xác nhận</SubmitButton></form>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
