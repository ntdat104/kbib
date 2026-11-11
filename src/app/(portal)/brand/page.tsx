import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Eye, Gift, MousePointerClick } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, PageHeader, StatCard } from "@/components/ui/card";
import { CampaignForm, VoucherForm } from "@/components/portal/brand-forms";
import { toggleCampaignAction } from "@/lib/actions/portal";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { activeDataPlan } from "@/lib/services/marketplace";
import { formatDate, formatNumber, formatVND } from "@/lib/utils";

export const metadata: Metadata = { title: "Cổng thương hiệu" };
const PLACEMENT = { home_hero: "Trang chủ", race_sidebar: "Trang giải", checkout: "Checkout", search_top: "Tìm kiếm" };
const STATUS = { pending: ["Chờ duyệt", "amber"], active: ["Đang chạy", "emerald"], paused: ["Tạm dừng", "stone"], ended: ["Kết thúc", "stone"] } as const;

export default async function BrandPage() {
  const user = await requireRole("brand");
  const [campaigns, vouchers, plan] = await Promise.all([
    db.ad_campaigns.where((c) => c.brandId === user.id),
    db.vouchers.where((v) => v.brandId === user.id),
    activeDataPlan(user.id),
  ]);
  const impr = campaigns.reduce((s, c) => s + c.impressions, 0);
  const clicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  return (
    <>
      <PageHeader eyebrow={user.orgName} title="Quảng cáo, voucher & dữ liệu" subtitle="Tiếp cận runner đúng cự ly, đúng thời điểm họ vừa có bib." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Lượt hiển thị" value={formatNumber(impr)} icon={<Eye className="size-4" />} />
        <StatCard label="Lượt click" value={formatNumber(clicks)} hint={`CTR ${impr ? ((clicks / impr) * 100).toFixed(2) : 0}%`} icon={<MousePointerClick className="size-4" />} />
        <StatCard label="Voucher đã phát" value={formatNumber(vouchers.reduce((s, v) => s + v.claimed, 0))} icon={<Gift className="size-4" />} />
        <StatCard label="Gói dữ liệu" value={plan ? plan.plan.toUpperCase() : "Chưa có"} hint={plan ? `Đến ${formatDate(plan.endAt)}` : <Link href="/insights" className="text-brand-700">Xem gói</Link>} icon={<BarChart3 className="size-4" />} />
      </div>

      <Card className="mt-6">
        <CardHeader title="Chiến dịch" />
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Chiến dịch</th><th>Vị trí</th><th className="text-right">Ngân sách</th><th className="text-right">Hiển thị</th><th className="text-right">Click</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td><p className="font-medium">{c.name}</p><p className="text-xs text-muted">{c.title}</p></td>
                  <td>{PLACEMENT[c.placement]}</td>
                  <td className="text-right tabular-nums">{formatVND(c.budget)}</td>
                  <td className="text-right tabular-nums">{formatNumber(c.impressions)}</td>
                  <td className="text-right tabular-nums">{formatNumber(c.clicks)}</td>
                  <td><Badge tone={STATUS[c.status][1]}>{STATUS[c.status][0]}</Badge></td>
                  <td>{["active", "paused"].includes(c.status) && <form action={toggleCampaignAction}><input type="hidden" name="id" value={c.id} /><Button size="sm" variant="ghost">{c.status === "active" ? "Tạm dừng" : "Chạy lại"}</Button></form>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Voucher sau giao dịch" subtitle="Tự động tặng cho runner khi đơn hoàn tất – bạn chỉ trả CPA cho voucher được phát" />
        <table className="table-base">
          <thead><tr><th>Mã</th><th>Ưu đãi</th><th>Đối tượng</th><th className="text-right">Đã phát</th><th className="text-right">CPA</th></tr></thead>
          <tbody>
            {vouchers.map((v) => (
              <tr key={v.id}><td className="font-mono font-semibold">{v.code}</td><td>{v.title}</td><td>{v.target === "all" ? "Tất cả" : v.target}{v.minKm ? ` · ≥${v.minKm}km` : ""}</td><td className="text-right tabular-nums">{v.claimed}/{v.quantity}</td><td className="text-right tabular-nums">{formatVND(v.cpa)}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card><CardHeader title="Tạo chiến dịch quảng cáo" /><CampaignForm /></Card>
        <Card><CardHeader title="Tạo voucher" /><VoucherForm /></Card>
      </div>
    </>
  );
}
