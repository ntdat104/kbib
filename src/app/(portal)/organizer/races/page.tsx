import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardHeader, PageHeader } from "@/components/ui/card";
import { TypeBadge } from "@/components/market/bits";
import { CreateRaceForm, InventoryForm, PolicyForm } from "@/components/portal/organizer-forms";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Giải & suất chính thức" };

export default async function OrganizerRaces() {
  const user = await requireRole("organizer");
  const [races, distances, listings] = await Promise.all([
    db.races.where((r) => (user.role === "admin" || r.organizerId === user.id) && r.status === "published"),
    db.distances.all(),
    db.listings.where((l) => l.kind === "official" && l.status === "active"),
  ]);
  races.sort((a, b) => a.date.localeCompare(b.date));
  return (
    <>
      <PageHeader title="Giải & suất chính thức" subtitle="Thiết lập chính sách chuyển nhượng, trần giá và mở bán suất late-bird / charity." />
      <Card>
        <CardHeader title="Chính sách chuyển nhượng" subtitle="Chính sách · phí đổi tên · trần giá % · hạn đổi tên" />
        <ul className="divide-y divide-line">
          {races.map((r) => (
            <li key={r.id} className="space-y-2 px-5 py-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <TypeBadge type={r.type} />
                <Link href={`/races/${r.slug}`} className="font-semibold hover:text-brand-700">{r.name}</Link>
                <span className="text-muted">{formatDate(r.date)}</span>
                {listings.filter((l) => l.raceId === r.id).map((l) => <span key={l.id} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{l.quantity} suất chính thức</span>)}
              </div>
              <PolicyForm race={r} />
            </li>
          ))}
        </ul>
      </Card>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card><CardHeader title="Mở bán suất chính thức" subtitle="KBIB phân phối tới runner đang tìm bib – hoa hồng trên mỗi suất bán được" />
          <InventoryForm races={races.map((r) => ({ id: r.id, name: r.name, distances: distances.filter((d) => d.raceId === r.id).map((d) => ({ id: d.id, name: d.name, price: d.originalPrice })) }))} />
        </Card>
        <Card><CardHeader title="Tạo giải mới" /><CreateRaceForm /></Card>
      </div>
    </>
  );
}
