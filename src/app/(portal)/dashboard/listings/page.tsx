import type { Metadata } from "next";
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/ui/card";
import { ListingRow } from "@/components/market/listing-card";
import { cancelListingAction } from "@/lib/actions/market";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { getListingsBy } from "@/lib/services/catalog";
import { formatDate, formatVND } from "@/lib/utils";

export const metadata: Metadata = { title: "Tin đăng của tôi" };
const CS = { new: ["Chờ nhận", "amber"], assigned: ["Đang định giá", "sky"], listed: ["Đã lên sàn", "brand"], sold: ["Đã bán", "emerald"], cancelled: ["Đã huỷ", "stone"] } as const;

export default async function MyListings() {
  const user = await requireUser();
  const [listings, consignments, races] = await Promise.all([
    getListingsBy((l) => (l.sellerId === user.id || l.agentId === user.id) && ["active", "reserved"].includes(l.status)),
    db.consignments.where((c) => c.userId === user.id),
    db.races.all(),
  ]);
  return (
    <>
      <PageHeader title="Tin đăng của tôi" subtitle="Quản lý bib đang bán và yêu cầu bán hộ." action={<ButtonLink href="/sell">Đăng bán mới</ButtonLink>} />
      {listings.length ? (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="relative">
              <ListingRow l={l} showRace />
              {l.status === "active" && (
                <form action={cancelListingAction} className="mt-1 flex justify-end">
                  <input type="hidden" name="id" value={l.id} />
                  <Button variant="ghost" size="sm">Gỡ tin</Button>
                </form>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Tag className="size-5" />} title="Chưa có tin đăng" body="Đăng bán bib chỉ mất 2 phút." action={<ButtonLink href="/sell">Đăng bán</ButtonLink>} />
      )}
      {consignments.length > 0 && (
        <Card className="mt-8">
          <CardHeader title="Yêu cầu bán hộ" />
          <table className="table-base">
            <thead><tr><th>Giải</th><th>Gói</th><th className="text-right">Giá mong muốn</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {consignments.map((c) => (
                <tr key={c.id}>
                  <td>{races.find((r) => r.id === c.raceId)?.name}<p className="text-xs text-muted">{formatDate(c.createdAt)}</p></td>
                  <td>{c.tier === "express" ? "Bán nhanh" : "Tiêu chuẩn"} ({c.feePct}%)</td>
                  <td className="text-right tabular-nums">{formatVND(c.desiredPrice)}</td>
                  <td><Badge tone={CS[c.status][1]}>{CS[c.status][0]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
