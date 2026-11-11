import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { SellForm } from "@/components/market/sell-form";
import { getSettings, PROMO_PACKAGES } from "@/lib/services/settings";

export const metadata: Metadata = { title: "Đăng bán bib" };

const SOLD = new Set(["paid", "transferring", "transferred", "completed"]);

export default async function SellPage({ searchParams }: PageProps<"/sell">) {
  const sp = await searchParams;
  const user = await requireUser("/sell");
  const today = new Date().toISOString().slice(0, 10);
  const [races, distances, orders, s] = await Promise.all([db.races.all(), db.distances.all(), db.orders.where((o) => SOLD.has(o.status)), getSettings()]);
  const open = races
    .filter((r) => r.status === "published" && r.transferPolicy !== "closed" && r.transferDeadline >= today)
    .filter((r) => user.role !== "organizer" || r.organizerId === user.id)
    .sort((a, b) => a.date.localeCompare(b.date));
  const ids = new Set(open.map((r) => r.id));
  const median = (id: string) => {
    const p = orders.filter((o) => o.distanceId === id).map((o) => o.price).sort((a, b) => a - b);
    return p.length ? p[Math.floor(p.length / 2)] : 0;
  };

  return (
    <div className="bg-sunrise">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Bán bib</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Không chạy được? Pass bib trong 2 phút.</h1>
        <p className="mt-2 max-w-2xl text-muted">Tiền về ví ngay khi người mua đứng tên. Không cần trao đổi chuyển khoản riêng, không lo bị lừa.</p>
        <SellForm
          mode={sp.mode === "concierge" ? "concierge" : "self"}
          role={user.role}
          initialRace={typeof sp.race === "string" && ids.has(sp.race) ? sp.race : ""}
          races={open.map((r) => ({ id: r.id, name: r.name, date: r.date, type: r.type, cap: r.priceCapPct || s.priceCapPct, policy: r.transferPolicy, transferFee: r.transferFee }))}
          distances={distances.filter((d) => ids.has(d.raceId)).map((d) => ({ id: d.id, raceId: d.raceId, name: d.name, price: d.originalPrice, median: median(d.id) }))}
          fees={{ sellerPct: s.sellerFeePct, standardPct: s.conciergeStandardPct, expressPct: s.conciergeExpressPct, officialPct: s.officialCommissionPct }}
          promos={Object.entries(PROMO_PACKAGES).map(([k, p]) => ({ key: k, label: p.label, desc: p.desc, price: s[p.key] }))}
        />
      </div>
    </div>
  );
}
