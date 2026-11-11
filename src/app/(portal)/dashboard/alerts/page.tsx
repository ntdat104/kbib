import type { Metadata } from "next";
import Link from "next/link";
import { BellRing } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { closeAlertAction } from "@/lib/actions/market";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatVND } from "@/lib/utils";

export const metadata: Metadata = { title: "Theo dõi bib" };

export default async function AlertsPage() {
  const user = await requireUser();
  const [alerts, races, distances, listings] = await Promise.all([db.wtb_alerts.where((a) => a.userId === user.id && a.status !== "closed"), db.races.all(), db.distances.all(), db.listings.where((l) => l.status === "active")]);
  return (
    <>
      <PageHeader title="Theo dõi bib" subtitle="Nhận thông báo ngay khi có bib đúng cự ly và mức giá bạn đặt." />
      {alerts.length ? (
        <Card>
          <table className="table-base">
            <thead><tr><th>Giải · cự ly</th><th className="text-right">Giá tối đa</th><th>Khớp hiện tại</th><th /></tr></thead>
            <tbody>
              {alerts.map((a) => {
                const r = races.find((x) => x.id === a.raceId);
                const matches = listings.filter((l) => l.distanceId === a.distanceId && (!a.maxPrice || l.price <= a.maxPrice)).length;
                return (
                  <tr key={a.id}>
                    <td><Link href={`/races/${r?.slug}?d=${a.distanceId}`} className="font-medium hover:text-brand-700">{r?.name}</Link><p className="text-xs text-muted">{distances.find((d) => d.id === a.distanceId)?.name}</p></td>
                    <td className="text-right tabular-nums">{a.maxPrice ? formatVND(a.maxPrice) : "Bất kỳ"}</td>
                    <td>{a.status === "matched" ? <Badge tone="emerald">Đã mua</Badge> : matches ? <Badge tone="brand">{matches} bib phù hợp</Badge> : <Badge>Đang chờ</Badge>}</td>
                    <td className="text-right"><form action={closeAlertAction}><input type="hidden" name="id" value={a.id} /><Button variant="ghost" size="sm">Tắt</Button></form></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState icon={<BellRing className="size-5" />} title="Chưa theo dõi bib nào" body="Vào trang giải chạy và bấm “Báo khi có bib”." />
      )}
    </>
  );
}
