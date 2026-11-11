import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, EmptyState, PageHeader, StatCard } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatDateTime, formatVND } from "@/lib/utils";

export const metadata: Metadata = { title: "Ví & thanh toán" };
const TYPE = { seller_payout: "Tiền bán bib", agent_commission: "Hoa hồng đại lý", broker_commission: "Hoa hồng bán hộ", refund: "Hoàn tiền" };

export default async function WalletPage() {
  const user = await requireUser();
  const payouts = (await db.payouts.where((p) => p.userId === user.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const sum = (st: string) => payouts.filter((p) => p.status === st).reduce((s, p) => s + p.amount, 0);
  return (
    <>
      <PageHeader title="Ví & thanh toán" subtitle="KBIB chuyển khoản tự động mỗi ngày làm việc lúc 16:00." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Đang chờ chuyển" value={formatVND(sum("pending"))} />
        <StatCard label="Đã nhận" value={formatVND(sum("paid"))} />
        <StatCard label="Tài khoản nhận" value={<span className="text-base">{user.bankAccount ? `${user.bankName} · ${user.bankAccount}` : "Chưa cập nhật"}</span>} hint={<Link href="/dashboard/profile" className="text-brand-700">Cập nhật</Link>} tone="stone" />
      </div>
      <Card className="mt-6">
        <CardHeader title="Lịch sử" />
        {payouts.length ? (
          <table className="table-base">
            <thead><tr><th>Loại</th><th>Thời gian</th><th className="text-right">Số tiền</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td>{TYPE[p.type]}<p className="text-xs text-muted"><Link href={`/orders/${p.orderId}`} className="hover:text-brand-700">Xem đơn</Link></p></td>
                  <td className="text-muted">{formatDateTime(p.createdAt)}</td>
                  <td className="text-right font-semibold tabular-nums text-emerald-700">+{formatVND(p.amount)}</td>
                  <td><Badge tone={p.status === "paid" ? "emerald" : "amber"}>{p.status === "paid" ? "Đã chuyển" : "Đang xử lý"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="p-5"><EmptyState title="Chưa có giao dịch" /></div>}
      </Card>
    </>
  );
}
