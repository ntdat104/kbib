import type { Metadata } from "next";
import { Package, Receipt, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, PageHeader, StatCard } from "@/components/ui/card";
import { ServiceForm } from "@/components/portal/service-form";
import { toggleServiceAction } from "@/lib/actions/portal";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatDateTime, formatVND } from "@/lib/utils";

export const metadata: Metadata = { title: "Cổng đối tác dịch vụ" };
const TYPE = { insurance: "Bảo hiểm", kit_pickup: "Nhận kit", travel: "Xe / combo", hotel: "Khách sạn" };

export default async function PartnerPage() {
  const user = await requireRole("partner");
  const [services, orders, races] = await Promise.all([
    db.services.where((s) => s.partnerId === user.id),
    db.orders.where((o) => o.addons?.some((a) => a.partnerId === user.id) && !["cancelled", "pending_payment"].includes(o.status)),
    db.races.all(),
  ]);
  const lines = orders.flatMap((o) => o.addons.filter((a) => a.partnerId === user.id).map((a) => ({ o, a }))).sort((x, y) => y.o.createdAt.localeCompare(x.o.createdAt));
  const gross = lines.reduce((s, l) => s + l.a.price, 0);
  const comm = lines.reduce((s, l) => s + l.a.commission, 0);
  return (
    <>
      <PageHeader eyebrow={user.orgName} title="Dịch vụ race-day" subtitle="Dịch vụ của bạn được gợi ý ngay trong checkout – đúng giải, đúng thời điểm." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Đơn dịch vụ" value={lines.length} icon={<Receipt className="size-4" />} />
        <StatCard label="Doanh thu gộp" value={formatVND(gross)} icon={<Package className="size-4" />} />
        <StatCard label="Thực nhận (sau hoa hồng)" value={formatVND(gross - comm)} icon={<Wallet className="size-4" />} />
      </div>
      <Card className="mt-6">
        <CardHeader title="Dịch vụ của bạn" />
        <table className="table-base">
          <thead><tr><th>Dịch vụ</th><th>Loại</th><th>Giải</th><th className="text-right">Giá</th><th className="text-right">HH</th><th /></tr></thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id}>
                <td className="max-w-72"><p className="truncate font-medium">{s.name}</p></td>
                <td>{TYPE[s.type]}</td>
                <td className="max-w-48 truncate text-muted">{s.raceId ? races.find((r) => r.id === s.raceId)?.name : "Tất cả"}</td>
                <td className="text-right tabular-nums">{s.type === "insurance" ? "% bib" : formatVND(s.price)}</td>
                <td className="text-right">{s.commissionPct}%</td>
                <td><form action={toggleServiceAction}><input type="hidden" name="id" value={s.id} /><Button size="sm" variant="ghost">{s.active ? "Tắt" : "Bật"}</Button></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="mt-6">
        <CardHeader title="Đơn cần phục vụ" />
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Đơn</th><th>Khách</th><th>Dịch vụ</th><th>Giải</th><th className="text-right">Giá</th></tr></thead>
            <tbody>
              {lines.slice(0, 30).map(({ o, a }) => (
                <tr key={`${o.id}${a.serviceId}`}>
                  <td><p className="font-mono text-xs font-semibold">{o.code}</p><p className="text-xs text-muted">{formatDateTime(o.createdAt)}</p></td>
                  <td>{o.runnerInfo?.fullName}<p className="text-xs text-muted">{o.runnerInfo?.phone}</p></td>
                  <td>{a.name}</td>
                  <td className="max-w-48 truncate">{races.find((r) => r.id === o.raceId)?.name}</td>
                  <td className="text-right tabular-nums">{formatVND(a.price)} <Badge tone={o.status === "refunded" ? "rose" : "emerald"}>{o.status === "refunded" ? "Huỷ" : "OK"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="mt-6"><CardHeader title="Thêm dịch vụ" /><ServiceForm races={races.filter((r) => r.status === "published").map((r) => ({ id: r.id, name: r.name }))} /></Card>
    </>
  );
}
