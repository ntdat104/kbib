"use client";

import { useActionState, useState } from "react";
import { createRaceAction, officialInventoryAction, updateRacePolicyAction } from "@/lib/actions/portal";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";

export function CreateRaceForm() {
  const [state, action] = useActionState(createRaceAction, {});
  return (
    <form action={action} className="grid gap-4 p-5 sm:grid-cols-2">
      <Field label="Tên giải" htmlFor="name" className="sm:col-span-2"><input id="name" name="name" required className="field" /></Field>
      <Field label="Loại" htmlFor="type"><select id="type" name="type" className="field"><option value="road">Road</option><option value="trail">Trail</option></select></Field>
      <Field label="Vùng" htmlFor="region"><select id="region" name="region" className="field"><option value="north">Miền Bắc</option><option value="central">Miền Trung</option><option value="highland">Tây Nguyên</option><option value="south">Miền Nam</option></select></Field>
      <Field label="Địa điểm" htmlFor="city"><input id="city" name="city" required className="field" /></Field>
      <Field label="Ngày chạy" htmlFor="date"><input id="date" name="date" type="date" required className="field" /></Field>
      <Field label="Hạn đổi tên" htmlFor="transferDeadline"><input id="transferDeadline" name="transferDeadline" type="date" required className="field" /></Field>
      <Field label="Chính sách chuyển nhượng" htmlFor="transferPolicy"><select id="transferPolicy" name="transferPolicy" className="field"><option value="official">Đổi tên chính thức qua KBIB</option><option value="allowed">Cho phép (người bán bàn giao)</option><option value="closed">Không cho phép</option></select></Field>
      <Field label="Phí đổi tên (đ)" htmlFor="transferFee"><input id="transferFee" name="transferFee" type="number" defaultValue={150000} step={10000} className="field" /></Field>
      <Field label="Trần giá bán lại (% giá gốc)" htmlFor="priceCapPct"><input id="priceCapPct" name="priceCapPct" type="number" defaultValue={120} min={100} max={200} className="field" /></Field>
      <Field label="Cự ly" hint="Mỗi dòng: Tên | km | giá gốc | D+ (m)" htmlFor="distances" className="sm:col-span-2">
        <textarea id="distances" name="distances" rows={4} className="field font-mono text-xs" defaultValue={"21K | 21.1 | 850000 | 0\n42K | 42.2 | 1200000 | 0"} />
      </Field>
      <Field label="Ảnh bìa (tuỳ chọn)" hint="Link https tới ảnh ngang ≥ 1600px. Bỏ trống để dùng ảnh mặc định của KBIB." htmlFor="coverUrl" className="sm:col-span-2"><input id="coverUrl" name="coverUrl" type="url" placeholder="https://" className="field" /></Field>
      <Field label="Mô tả" htmlFor="description" className="sm:col-span-2"><textarea id="description" name="description" rows={2} className="field" /></Field>
      <div className="flex items-center gap-3 sm:col-span-2"><SubmitButton>Tạo giải</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}

export function PolicyForm({ race }: { race: { id: string; transferPolicy: string; transferFee: number; priceCapPct: number; transferDeadline: string } }) {
  const [state, action] = useActionState(updateRacePolicyAction, {});
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-[1fr_120px_100px_150px_auto]">
      <input type="hidden" name="id" value={race.id} />
      <select name="transferPolicy" defaultValue={race.transferPolicy} className="field h-9 py-1" aria-label="Chính sách"><option value="official">Chính thức</option><option value="allowed">Cho phép</option><option value="closed">Đóng</option></select>
      <input name="transferFee" type="number" defaultValue={race.transferFee} step={10000} className="field h-9 py-1" aria-label="Phí đổi tên" />
      <input name="priceCapPct" type="number" defaultValue={race.priceCapPct} className="field h-9 py-1" aria-label="Trần giá %" />
      <input name="transferDeadline" type="date" defaultValue={race.transferDeadline} className="field h-9 py-1" aria-label="Hạn đổi tên" />
      <SubmitButton size="sm" variant="outline">Lưu</SubmitButton>
      {(state.error || state.message) && <div className="sm:col-span-5"><FormMessage state={state} /></div>}
    </form>
  );
}

export function InventoryForm({ races }: { races: { id: string; name: string; distances: { id: string; name: string; price: number }[] }[] }) {
  const [state, action] = useActionState(officialInventoryAction, {});
  const [raceId, setRaceId] = useState(races[0]?.id ?? "");
  const dists = races.find((r) => r.id === raceId)?.distances ?? [];
  return (
    <form action={action} className="grid gap-4 p-5 sm:grid-cols-2">
      <Field label="Giải" htmlFor="raceId"><select id="raceId" name="raceId" value={raceId} onChange={(e) => setRaceId(e.target.value)} className="field">{races.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></Field>
      <Field label="Cự ly" htmlFor="distanceId"><select id="distanceId" name="distanceId" className="field" key={raceId}>{dists.map((d) => <option key={d.id} value={d.id}>{d.name} (gốc {d.price.toLocaleString("vi-VN")}đ)</option>)}</select></Field>
      <Field label="Giá bán (late-bird / charity)" htmlFor="price"><input id="price" name="price" type="number" step={10000} required className="field" /></Field>
      <Field label="Số suất" htmlFor="quantity"><input id="quantity" name="quantity" type="number" min={1} defaultValue={20} className="field" /></Field>
      <Field label="Ghi chú" htmlFor="note" className="sm:col-span-2"><input id="note" name="note" defaultValue="Suất Late-bird chính thức từ BTC." className="field" /></Field>
      <div className="flex items-center gap-3 sm:col-span-2"><SubmitButton>Mở bán</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}
