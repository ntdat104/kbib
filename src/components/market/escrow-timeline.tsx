import { Check } from "lucide-react";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = ["Giữ bib", "Thanh toán escrow", "BTC đổi tên", "Xác nhận", "Giải ngân"];
const INDEX: Record<OrderStatus, number> = {
  pending_payment: 0, paid: 1, transferring: 2, transferred: 3, completed: 5, disputed: 2, refunded: 1, cancelled: 0,
};

export function EscrowTimeline({ status }: { status: OrderStatus }) {
  const current = INDEX[status];
  const broken = status === "disputed" || status === "refunded" || status === "cancelled";
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Tiến trình escrow">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current && !broken;
        return (
          <li key={label} className="flex flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={cn("h-0.5 flex-1", i === 0 ? "opacity-0" : done || active ? "bg-brand-500" : "bg-line")} />
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ring-4 ring-white",
                  done ? "bg-brand-600 text-white" : active ? "bg-brand-100 text-brand-700 ring-brand-50" : broken && i === current ? "bg-rose-100 text-rose-600" : "bg-stone-100 text-stone-400",
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn("h-0.5 flex-1", i === STEPS.length - 1 ? "opacity-0" : done ? "bg-brand-500" : "bg-line")} />
            </div>
            <span className={cn("mt-2 text-[11px] font-medium leading-tight sm:text-xs", done || active ? "text-ink" : "text-muted")}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
