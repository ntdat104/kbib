import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/form";
import { markPayoutPaidAction } from "@/lib/actions/portal";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatDateTime, formatVND } from "@/lib/utils";

export const metadata: Metadata = { title: "Chi trả" };
const TYPE = { seller_payout: "Người bán", agent_commission: "Đại lý", broker_commission: "Trung gian", refund: "Hoàn tiền" };

export default async function AdminPayouts() {
  await requireRole("admin");
  const [payouts, users] = await Promise.all([db.payouts.where((p) => p.status === "pending"), db.users.all()]);
  const total = payouts.reduce((s, p) => s + p.amount, 0);
  return (
    <>
      <PageHeader title="Chi trả" subtitle={`${payouts.length} khoản chờ chuyển · ${formatVND(total)}`} />
      <form action={markPayoutPaidAction}>
        <Card>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead><tr><th className="w-8" /><th>Người nhận</th><th>Loại</th><th>Tài khoản</th><th>Ngày</th><th className="text-right">Số tiền</th></tr></thead>
              <tbody>
                {payouts.map((p) => {
                  const u = users.find((x) => x.id === p.userId);
                  return (
                    <tr key={p.id}>
                      <td><input type="checkbox" name="id" value={p.id} defaultChecked className="accent-brand-600" aria-label={`Chọn ${u?.name}`} /></td>
                      <td className="font-medium">{u?.name}</td>
                      <td>{TYPE[p.type]}</td>
                      <td className="font-mono text-xs">{u?.bankName} {u?.bankAccount}</td>
                      <td className="text-muted">{formatDateTime(p.createdAt)}</td>
                      <td className="text-right font-semibold tabular-nums">{formatVND(p.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        {payouts.length > 0 && <div className="mt-4 flex justify-end"><SubmitButton>Đánh dấu đã chuyển khoản</SubmitButton></div>}
      </form>
    </>
  );
}
