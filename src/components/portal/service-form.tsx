"use client";

import { useActionState } from "react";
import { createServiceAction } from "@/lib/actions/portal";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";

export function ServiceForm({ races }: { races: { id: string; name: string }[] }) {
  const [state, action] = useActionState(createServiceAction, {});
  return (
    <form action={action} className="grid gap-4 p-5 sm:grid-cols-2">
      <Field label="Loại dịch vụ" htmlFor="type"><select id="type" name="type" className="field"><option value="travel">Xe / combo du lịch</option><option value="hotel">Khách sạn</option><option value="kit_pickup">Nhận hộ race kit</option><option value="insurance">Bảo hiểm (giá theo % bib)</option></select></Field>
      <Field label="Áp dụng cho giải" htmlFor="raceId"><select id="raceId" name="raceId" className="field"><option value="">Tất cả giải</option>{races.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></Field>
      <Field label="Tên dịch vụ" htmlFor="name" className="sm:col-span-2"><input id="name" name="name" required className="field" /></Field>
      <Field label="Mô tả" htmlFor="description" className="sm:col-span-2"><input id="description" name="description" className="field" /></Field>
      <Field label="Giá (đ)" htmlFor="price"><input id="price" name="price" type="number" step={10000} defaultValue={0} className="field" /></Field>
      <Field label="Hoa hồng cho KBIB (%)" htmlFor="commissionPct"><input id="commissionPct" name="commissionPct" type="number" defaultValue={10} min={5} max={50} className="field" /></Field>
      <div className="flex items-center gap-3 sm:col-span-2"><SubmitButton>Thêm dịch vụ</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}
