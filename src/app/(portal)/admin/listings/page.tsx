import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { adminListingStatusAction } from "@/lib/actions/portal";
import { requireRole } from "@/lib/auth/dal";
import { getListingsBy } from "@/lib/services/catalog";
import { formatDateTime, formatVND } from "@/lib/utils";

export const metadata: Metadata = { title: "Kiểm duyệt tin đăng" };

export default async function AdminListings() {
  await requireRole("admin");
  const listings = (await getListingsBy((l) => l.status === "active")).slice(0, 150);
  return (
    <>
      <PageHeader title="Tin đăng đang hoạt động" subtitle="Gỡ tin vi phạm (sai giá, bib giả, trùng lặp)." />
      <Card>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Giải · cự ly</th><th>Người bán</th><th className="text-right">Giá / gốc</th><th>Loại</th><th>Đăng</th><th /></tr></thead>
            <tbody>
              {listings.map((l) => {
                const ratio = l.price / l.originalPrice;
                return (
                  <tr key={l.id}>
                    <td><Link href={`/listings/${l.id}`} className="font-medium hover:text-brand-700">{l.race.name}</Link><p className="text-xs text-muted">{l.distance.name} · {l.views} lượt xem</p></td>
                    <td>{l.seller.name}<p className="text-xs text-muted">Uy tín {l.seller.trustScore}</p></td>
                    <td className="text-right tabular-nums">{formatVND(l.price)}<p className={ratio > 1.15 ? "text-xs font-semibold text-rose-600" : "text-xs text-muted"}>{Math.round(ratio * 100)}%</p></td>
                    <td>{l.promoted && <Badge tone="brand">Đẩy</Badge>} <Badge>{l.kind}</Badge></td>
                    <td className="text-xs text-muted">{formatDateTime(l.createdAt)}</td>
                    <td><form action={adminListingStatusAction}><input type="hidden" name="id" value={l.id} /><input type="hidden" name="status" value="cancelled" /><Button size="sm" variant="ghost" className="text-rose-600">Gỡ</Button></form></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
