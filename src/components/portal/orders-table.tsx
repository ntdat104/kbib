import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { OrderStatusBadge } from "@/components/market/bits";
import { db } from "@/lib/db";
import type { Order } from "@/lib/types";
import { formatDateTime, formatVND } from "@/lib/utils";

export async function OrdersTable({ orders, perspective = "buyer", actions }: { orders: Order[]; perspective?: "buyer" | "seller" | "admin"; actions?: (o: Order) => React.ReactNode }) {
  const [races, distances, users] = await Promise.all([db.races.all(), db.distances.all(), db.users.all()]);
  const name = (id: string) => users.find((u) => u.id === id)?.name ?? "—";
  return (
    <div className="overflow-x-auto">
      <table className="table-base">
        <thead>
          <tr>
            <th>Đơn</th><th>Giải · cự ly</th>
            {perspective === "admin" && <th>Mua / Bán</th>}
            <th className="text-right">{perspective === "seller" ? "Bạn nhận" : "Giá trị"}</th>
            <th>Trạng thái</th>{actions && <th />}<th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const r = races.find((x) => x.id === o.raceId);
            const d = distances.find((x) => x.id === o.distanceId);
            return (
              <tr key={o.id} className="hover:bg-brand-50/40">
                <td><p className="font-mono text-xs font-semibold">{o.code}</p><p className="text-xs text-muted">{formatDateTime(o.createdAt)}</p></td>
                <td><p className="max-w-56 truncate font-medium">{r?.name}</p><p className="text-xs text-muted">{d?.name}{o.kind !== "resale" ? ` · ${o.kind === "official" ? "Chính thức" : "Bán hộ"}` : ""}</p></td>
                {perspective === "admin" && <td className="text-xs"><p>{name(o.buyerId)}</p><p className="text-muted">{name(o.sellerId)}</p></td>}
                <td className="text-right font-semibold tabular-nums">{formatVND(perspective === "seller" ? o.sellerPayout : o.total)}</td>
                <td><OrderStatusBadge status={o.status} /></td>
                {actions && <td>{actions(o)}</td>}
                <td><Link href={`/orders/${o.id}`} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-white hover:text-brand-700" aria-label={`Xem đơn ${o.code}`}><ChevronRight className="size-4" /></Link></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
