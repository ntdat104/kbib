import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/form";
import { OrdersTable } from "@/components/portal/orders-table";
import { adminApproveTransferAction, adminCompleteAction, adminMarkPaidAction } from "@/lib/actions/portal";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import type { Order, OrderStatus } from "@/lib/types";
import { cn, ORDER_STATUS } from "@/lib/utils";

export const metadata: Metadata = { title: "Đơn & escrow" };

export default async function AdminOrders({ searchParams }: PageProps<"/admin/orders">) {
  await requireRole("admin");
  const status = (await searchParams).status as OrderStatus | undefined;
  const [orders, transfers] = await Promise.all([db.orders.all(), db.transfers.where((t) => t.status === "requested")]);
  const list = orders.filter((o) => !status || o.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100);
  const actions = (o: Order) => {
    if (o.status === "pending_payment")
      return <form action={adminMarkPaidAction}><input type="hidden" name="id" value={o.id} /><SubmitButton size="sm" variant="outline">Xác nhận đã nhận tiền</SubmitButton></form>;
    const t = transfers.find((x) => x.orderId === o.id);
    if (o.status === "transferring" && t)
      return <form action={adminApproveTransferAction}><input type="hidden" name="id" value={t.id} /><SubmitButton size="sm" variant="outline">Duyệt đổi tên</SubmitButton></form>;
    if (o.status === "transferred")
      return <form action={adminCompleteAction}><input type="hidden" name="id" value={o.id} /><SubmitButton size="sm" variant="outline">Giải ngân</SubmitButton></form>;
    return null;
  };
  return (
    <>
      <PageHeader title="Đơn hàng & escrow" subtitle="Đối soát thanh toán, đẩy tiến trình đổi tên và giải ngân." />
      <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-none">
        <Link href="/admin/orders" className={cn("whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium", !status ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white")}>Tất cả ({orders.length})</Link>
        {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => (
          <Link key={s} href={`?status=${s}`} className={cn("whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium", status === s ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white")}>
            {ORDER_STATUS[s].label} ({orders.filter((o) => o.status === s).length})
          </Link>
        ))}
      </div>
      <Card><OrdersTable orders={list} perspective="admin" actions={actions} /></Card>
    </>
  );
}
