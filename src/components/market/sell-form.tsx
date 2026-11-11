"use client";

import { useActionState, useMemo, useState } from "react";
import { Info, Sparkles, Timer, UserCheck, Zap } from "lucide-react";
import { createConsignmentAction, createListingAction } from "@/lib/actions/market";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import type { Role } from "@/lib/types";
import { cn, formatDate, formatVND } from "@/lib/utils";

type RaceOpt = { id: string; name: string; date: string; type: string; cap: number; policy: string; transferFee: number };
type DistOpt = { id: string; raceId: string; name: string; price: number; median: number };

export function SellForm({ mode: initialMode, role, initialRace, races, distances, fees, promos }: {
  mode: "self" | "concierge"; role: Role; initialRace: string; races: RaceOpt[]; distances: DistOpt[];
  fees: { sellerPct: number; standardPct: number; expressPct: number; officialPct: number };
  promos: { key: string; label: string; desc: string; price: number }[];
}) {
  const [mode, setMode] = useState(initialMode);
  const [raceId, setRaceId] = useState(initialRace || "");
  const [q, setQ] = useState("");
  const [distanceId, setDistanceId] = useState("");
  const [price, setPrice] = useState(0);
  const [tier, setTier] = useState<"standard" | "express">("standard");
  const [promo, setPromo] = useState("");
  const [lState, listAction] = useActionState(createListingAction, {});
  const [cState, consignAction] = useActionState(createConsignmentAction, {});

  const race = races.find((r) => r.id === raceId);
  const dists = distances.filter((d) => d.raceId === raceId);
  const dist = dists.find((d) => d.id === distanceId);
  const cap = dist && race ? Math.floor((dist.price * race.cap) / 100 / 1000) * 1000 : 0;
  const official = role === "organizer";
  const filtered = useMemo(() => races.filter((r) => r.name.toLowerCase().includes(q.toLowerCase())).slice(0, 60), [races, q]);
  const feePct = mode === "concierge" ? (tier === "express" ? fees.expressPct : fees.standardPct) : official ? fees.officialPct : fees.sellerPct;
  const fee = Math.round((price * feePct) / 100);
  const promoPrice = promos.find((p) => p.key === promo)?.price ?? 0;

  const pickDistance = (d: DistOpt) => {
    setDistanceId(d.id);
    setPrice(d.median || d.price);
  };

  return (
    <div className="mt-8">
      <div className="inline-flex rounded-2xl border border-line bg-white p-1 shadow-soft" role="tablist">
        {([["self", "Tự đăng bán", UserCheck], ["concierge", "KBIB bán hộ", Timer]] as const).map(([k, label, Icon]) => (
          <button key={k} role="tab" aria-selected={mode === k} type="button" onClick={() => setMode(k)}
            className={cn("inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition", mode === k ? "bg-brand-600 text-white" : "text-stone-600 hover:text-brand-700")}>
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      <form action={mode === "self" ? listAction : consignAction} className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="font-semibold">1. Chọn giải chạy</h2>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên giải…" className="field mt-3" aria-label="Tìm giải" />
            <input type="hidden" name="raceId" value={raceId} />
            <div className="mt-3 max-h-64 space-y-1 overflow-y-auto pr-1">
              {filtered.map((r) => (
                <button type="button" key={r.id} onClick={() => { setRaceId(r.id); setDistanceId(""); setPrice(0); }}
                  className={cn("flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition", raceId === r.id ? "bg-brand-50 font-semibold text-brand-700 ring-1 ring-brand-200" : "hover:bg-stone-50")}>
                  <span className="truncate">{r.name}</span>
                  <span className="shrink-0 pl-2 text-xs text-muted">{formatDate(r.date)} · {r.type === "trail" ? "Trail" : "Road"}</span>
                </button>
              ))}
              {!filtered.length && <p className="px-3 py-4 text-sm text-muted">Không có giải phù hợp hoặc giải đã hết hạn đổi tên.</p>}
            </div>
          </section>

          {race && (
            <section className="card p-5 sm:p-6">
              <h2 className="font-semibold">2. Cự ly</h2>
              <input type="hidden" name="distanceId" value={distanceId} />
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {dists.map((d) => (
                  <button type="button" key={d.id} onClick={() => pickDistance(d)}
                    className={cn("rounded-2xl border p-3 text-left transition", distanceId === d.id ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-line hover:border-brand-200")}>
                    <p className="text-lg font-extrabold">{d.name}</p>
                    <p className="text-xs text-muted">Gốc {formatVND(d.price)}</p>
                  </button>
                ))}
              </div>
              {race.policy === "allowed" && <p className="mt-3 flex gap-1.5 text-xs text-amber-700"><Info className="mt-0.5 size-3.5 shrink-0" />Giải này không có API đổi tên – bạn sẽ bàn giao bib/QR nhận kit cho người mua sau khi họ thanh toán.</p>}
            </section>
          )}

          {dist && (
            <section className="card p-5 sm:p-6">
              <h2 className="font-semibold">3. {mode === "self" ? "Giá & thông tin" : "Giá mong muốn"}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label={mode === "self" ? "Giá bán" : "Giá mong muốn"} hint={mode === "self" && !official ? `Tối đa ${formatVND(cap)} (${race!.cap}% giá gốc) – chống phe vé` : undefined} htmlFor="price">
                  <input id="price" name={mode === "self" ? "price" : "desiredPrice"} type="number" step={10000} min={10000} max={mode === "self" && !official ? cap : undefined}
                    value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} required className="field text-lg font-semibold" />
                </Field>
                <div className="rounded-2xl bg-brand-50/70 p-3 text-sm">
                  <p className="flex items-center gap-1.5 font-semibold text-brand-700"><Sparkles className="size-4" /> Gợi ý giá</p>
                  <p className="mt-1 text-stone-600">{dist.median ? <>Giá giao dịch trung vị: <b>{formatVND(dist.median)}</b></> : <>Chưa có giao dịch – giá gốc <b>{formatVND(dist.price)}</b></>}</p>
                  <div className="mt-2 flex gap-1.5">
                    {[0.9, 1, 1.1].map((k) => {
                      const v = Math.min(Math.round((dist.price * k) / 10000) * 10000, official ? Infinity : cap);
                      return <button type="button" key={k} onClick={() => setPrice(v)} className="rounded-lg bg-white px-2 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100">{formatVND(v)}</button>;
                    })}
                  </div>
                </div>
              </div>

              {mode === "self" ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {official ? (
                    <Field label="Số suất mở bán" htmlFor="quantity"><input id="quantity" name="quantity" type="number" min={1} defaultValue={10} className="field" /></Field>
                  ) : (
                    <Field label="Giới tính đăng ký" htmlFor="gender">
                      <select id="gender" name="gender" className="field"><option value="any">Không giới hạn</option><option value="male">Nam</option><option value="female">Nữ</option></select>
                    </Field>
                  )}
                  <Field label="Size áo" htmlFor="shirtSize"><select id="shirtSize" name="shirtSize" className="field" defaultValue="M">{["", "XS", "S", "M", "L", "XL", "XXL"].map((s) => <option key={s} value={s}>{s || "—"}</option>)}</select></Field>
                  <label className="flex items-center gap-2 self-end rounded-xl border border-line px-3 py-2.5 text-sm"><input type="checkbox" name="includesKit" className="accent-brand-600" /> Đã nhận race kit</label>
                  {official && <input type="hidden" name="kind" value="official" />}
                  {role === "agent" && (
                    <Field label="Email khách hàng (đăng thay)" hint="Bỏ trống nếu bán bib của chính bạn" htmlFor="clientEmail" className="sm:col-span-3">
                      <input id="clientEmail" name="clientEmail" type="email" className="field" />
                    </Field>
                  )}
                  <Field label="Ghi chú cho người mua" htmlFor="note" className="sm:col-span-3"><textarea id="note" name="note" rows={2} maxLength={500} className="field" placeholder="Lý do nhượng, tình trạng race kit…" /></Field>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <input type="hidden" name="tier" value={tier} />
                  {([["standard", "Tiêu chuẩn", fees.standardPct, "Chuyên viên định giá & đăng bán trong 24h"], ["express", "Bán nhanh", fees.expressPct, "Đăng trong 2h + đẩy top 72h + gửi alert người tìm mua"]] as const).map(([k, label, p, d]) => (
                    <button type="button" key={k} onClick={() => setTier(k)} className={cn("flex w-full items-start gap-3 rounded-2xl border p-4 text-left", tier === k ? "border-brand-500 bg-brand-50" : "border-line")}>
                      {k === "express" ? <Zap className="mt-0.5 size-5 text-brand-600" /> : <Timer className="mt-0.5 size-5 text-brand-600" />}
                      <span className="flex-1"><span className="flex justify-between font-semibold"><span>{label}</span><span>{p}%</span></span><span className="text-sm text-muted">{d}</span></span>
                    </button>
                  ))}
                  <Field label="Ghi chú" htmlFor="cnote"><textarea id="cnote" name="note" rows={2} className="field" placeholder="Thời gian liên hệ thuận tiện…" /></Field>
                </div>
              )}
            </section>
          )}

          {dist && mode === "self" && !official && (
            <section className="card p-5 sm:p-6">
              <h2 className="font-semibold">4. Bán nhanh hơn <span className="text-sm font-normal text-muted">(tuỳ chọn)</span></h2>
              <input type="hidden" name="promote" value={promo} />
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {promos.map((p) => (
                  <button type="button" key={p.key} onClick={() => setPromo(promo === p.key ? "" : p.key)}
                    className={cn("rounded-2xl border p-3 text-left transition", promo === p.key ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-line hover:border-brand-200")}>
                    <p className="text-sm font-semibold">{p.label}</p>
                    <p className="text-lg font-bold text-brand-700">{formatVND(p.price)}</p>
                    <p className="text-xs text-muted">{p.desc}</p>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Bạn sẽ nhận</p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums text-emerald-700">{formatVND(Math.max(0, price - fee - promoPrice))}</p>
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Giá bán</dt><dd className="tabular-nums">{formatVND(price)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">{mode === "concierge" ? "Phí bán hộ" : official ? "Hoa hồng phân phối" : "Phí sàn"} ({feePct}%)</dt><dd className="tabular-nums">−{formatVND(fee)}</dd></div>
              {promoPrice > 0 && <div className="flex justify-between"><dt className="text-muted">Đẩy tin</dt><dd className="tabular-nums">−{formatVND(promoPrice)}</dd></div>}
              {race?.transferFee ? <div className="flex justify-between text-xs"><dt className="text-muted">Phí đổi tên BTC (trả BTC)</dt><dd>{formatVND(race.transferFee)}</dd></div> : null}
            </dl>
            <div className="mt-5 space-y-3">
              <FormMessage state={mode === "self" ? lState : cState} />
              <SubmitButton size="lg" className="w-full" disabled={!dist || !price}>{mode === "self" ? "Đăng bán ngay" : "Gửi yêu cầu bán hộ"}</SubmitButton>
              <p className="text-center text-xs text-muted">Tiền về ví sau khi người mua đứng tên chính thức.</p>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
