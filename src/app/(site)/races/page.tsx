import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, SlidersHorizontal } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { AdSlot } from "@/components/market/ad-slot";
import { RaceCard } from "@/components/market/race-card";
import { getRaceCards } from "@/lib/services/catalog";
import type { RaceType, Region } from "@/lib/types";
import { cn, REGION_LABEL } from "@/lib/utils";

export const metadata: Metadata = { title: "Lịch giải & bib đang bán" };

export default async function RacesPage({ searchParams }: PageProps<"/races">) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const f = { q: get("q"), type: get("type") as RaceType | "", region: get("region") as Region | "", month: get("month"), sort: (get("sort") || "date") as "date" | "listings" | "price" };
  const races = await getRaceCards(f);

  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams(Object.entries({ ...f, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/races${p.size ? `?${p}` : ""}`;
  };
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + i);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}` };
  });
  const chip = (active: boolean) =>
    cn("whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition", active ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white text-stone-600 hover:border-brand-300 hover:text-brand-700");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader eyebrow="Lịch giải 12 tháng" title="Tìm bib cho giải chạy tiếp theo" subtitle={`${races.length} giải phù hợp · Road & Trail trên toàn quốc`} />

      <div className="card mb-6 space-y-4 p-4">
        <form action="/races" className="flex flex-col gap-2 sm:flex-row">
          <input name="q" defaultValue={f.q} placeholder="Tên giải, thành phố…" className="field h-11 flex-1" aria-label="Tìm kiếm" />
          {f.type && <input type="hidden" name="type" value={f.type} />}
          {f.region && <input type="hidden" name="region" value={f.region} />}
          <select name="sort" defaultValue={f.sort} className="field h-11 sm:w-48" aria-label="Sắp xếp">
            <option value="date">Ngày gần nhất</option>
            <option value="listings">Nhiều bib nhất</option>
            <option value="price">Giá thấp nhất</option>
          </select>
          <button className="h-11 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700">Tìm</button>
        </form>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <SlidersHorizontal className="size-4 shrink-0 text-muted" />
          {(["", "road", "trail"] as const).map((t) => (
            <Link key={t} href={href({ type: t })} className={chip(f.type === t)}>{t === "" ? "Tất cả" : t === "road" ? "Road" : "Trail"}</Link>
          ))}
          <span className="mx-1 h-5 w-px shrink-0 bg-line" />
          {(["", "north", "central", "highland", "south"] as const).map((r) => (
            <Link key={r} href={href({ region: r })} className={chip(f.region === r)}>{r === "" ? "Mọi miền" : REGION_LABEL[r]}</Link>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <Link href={href({ month: "" })} className={chip(!f.month)}>Mọi tháng</Link>
          {months.map((m) => (
            <Link key={m.key} href={href({ month: m.key })} className={chip(f.month === m.key)}>{m.label}</Link>
          ))}
        </div>
      </div>

      <AdSlot placement="search_top" target={f.type || "all"} className="mb-6" />

      {races.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {races.map((r) => <RaceCard key={r.id} race={r} />)}
        </div>
      ) : (
        <EmptyState icon={<SearchX className="size-5" />} title="Không tìm thấy giải phù hợp" body="Thử bỏ bớt bộ lọc hoặc tìm theo thành phố." />
      )}
    </div>
  );
}
