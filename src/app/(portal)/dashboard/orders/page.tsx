import type { Metadata } from "next";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { OrdersTable } from "@/components/portal/orders-table";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Đơn mua & bán" };

export default async function MyOrders({ searchParams }: PageProps<"/dashboard/orders">) {
  const user = await requireUser();
  const tab = (await searchParams).tab === "sales" ? "sales" : "purchases";
  const orders = (await db.orders.where((o) => (tab === "sales" ? o.sellerId : o.buyerId) === user.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeader title="Đơn mua & bán" />
      <div className="mb-4 inline-flex rounded-xl border border-line bg-white p-1">
        {[["purchases", "Đã mua"], ["sales", "Đã bán"]].map(([k, l]) => (
          <Link key={k} href={`?tab=${k}`} className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold", tab === k ? "bg-brand-600 text-white" : "text-stone-600")}>{l}</Link>
        ))}
      </div>
      <Card>{orders.length ? <OrdersTable orders={orders} perspective={tab === "sales" ? "seller" : "buyer"} /> : <div className="p-5"><EmptyState icon={<Receipt className="size-5" />} title="Chưa có đơn nào" /></div>}</Card>
    </>
  );
}
