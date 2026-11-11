import type { Metadata } from "next";
import { Gift } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Voucher" };

export default async function VouchersPage() {
  const user = await requireUser();
  const [mine, vouchers, users] = await Promise.all([db.user_vouchers.where((v) => v.userId === user.id), db.vouchers.all(), db.users.all()]);
  return (
    <>
      <PageHeader title="Voucher của bạn" subtitle="Quà tặng từ thương hiệu đối tác sau mỗi giao dịch hoàn tất." />
      {mine.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {mine.map((uv) => {
            const v = vouchers.find((x) => x.id === uv.voucherId);
            if (!v) return null;
            return (
              <div key={uv.id} className="card flex overflow-hidden">
                <div className="grid w-24 shrink-0 place-items-center bg-gradient-to-b from-brand-500 to-amber-400 text-lg font-extrabold text-white">{v.discountText}</div>
                <div className="flex-1 border-l-2 border-dashed border-line p-4">
                  <p className="text-xs text-muted">{users.find((u) => u.id === v.brandId)?.orgName}</p>
                  <p className="font-semibold">{v.title}</p>
                  <p className="mt-2 inline-block rounded-lg bg-brand-50 px-2 py-1 font-mono text-sm font-bold text-brand-700">{v.code}</p>
                  <a href={v.link} target="_blank" rel="noopener sponsored" className="ml-3 text-sm font-semibold text-brand-700">Dùng ngay →</a>
                </div>
              </div>
            );
          })}
        </div>
      ) : <EmptyState icon={<Gift className="size-5" />} title="Chưa có voucher" body="Hoàn tất một giao dịch để nhận quà từ đối tác." />}
    </>
  );
}
