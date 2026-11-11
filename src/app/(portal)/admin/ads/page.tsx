import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { setCampaignStatusAction } from "@/lib/actions/portal";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatNumber, formatVND } from "@/lib/utils";

export const metadata: Metadata = { title: "Quảng cáo" };

export default async function AdminAds() {
  await requireRole("admin");
  const [ads, users] = await Promise.all([db.ad_campaigns.all(), db.users.all()]);
  const sorted = [...ads].sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));
  return (
    <>
      <PageHeader title="Quảng cáo thương hiệu" subtitle="Duyệt nội dung trước khi hiển thị. Ngân sách ghi nhận doanh thu khi kích hoạt." />
      <Card>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Chiến dịch</th><th>Brand</th><th>Vị trí</th><th className="text-right">Ngân sách</th><th className="text-right">Hiển thị / click</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>
              {sorted.map((a) => (
                <tr key={a.id}>
                  <td><p className="font-medium">{a.name}</p><p className="max-w-64 truncate text-xs text-muted">{a.title}</p></td>
                  <td>{users.find((u) => u.id === a.brandId)?.orgName}</td>
                  <td>{a.placement}</td>
                  <td className="text-right tabular-nums">{formatVND(a.budget)}</td>
                  <td className="text-right tabular-nums">{formatNumber(a.impressions)} / {formatNumber(a.clicks)}</td>
                  <td><Badge tone={a.status === "active" ? "emerald" : a.status === "pending" ? "amber" : "stone"}>{a.status}</Badge></td>
                  <td className="flex gap-1">
                    {a.status !== "active" && a.status !== "ended" && <form action={setCampaignStatusAction}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="status" value="active" /><Button size="sm" variant="secondary">{a.status === "pending" ? "Duyệt" : "Chạy"}</Button></form>}
                    {a.status === "active" && <form action={setCampaignStatusAction}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="status" value="paused" /><Button size="sm" variant="ghost">Dừng</Button></form>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
