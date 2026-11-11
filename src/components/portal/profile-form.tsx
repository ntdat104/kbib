"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/actions/market";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import type { User } from "@/lib/types";

export function ProfileForm({ user }: { user: Pick<User, "name" | "phone" | "region" | "itraPoints" | "utmbIndex" | "longestRaceKm" | "bankName" | "bankAccount"> }) {
  const [state, action] = useActionState(updateProfileAction, {});
  return (
    <form action={action} className="space-y-6">
      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold">Thông tin cá nhân</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Họ tên" htmlFor="name"><input id="name" name="name" defaultValue={user.name} className="field" required /></Field>
          <Field label="Số điện thoại" htmlFor="phone"><input id="phone" name="phone" defaultValue={user.phone} className="field" required /></Field>
          <Field label="Khu vực" htmlFor="region">
            <select id="region" name="region" defaultValue={user.region} className="field">
              <option value="">—</option><option value="north">Miền Bắc</option><option value="central">Miền Trung</option><option value="highland">Tây Nguyên</option><option value="south">Miền Nam</option>
            </select>
          </Field>
        </div>
      </section>
      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold">Hồ sơ năng lực (Trail ultra)</h2>
        <p className="mt-1 text-sm text-muted">Dùng để kiểm tra điều kiện mua bib 70K, 100K theo yêu cầu an toàn của BTC. Có thể bị yêu cầu đối chiếu.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Điểm ITRA" htmlFor="itraPoints"><input id="itraPoints" name="itraPoints" type="number" min={0} defaultValue={user.itraPoints} className="field" /></Field>
          <Field label="UTMB Index" htmlFor="utmbIndex"><input id="utmbIndex" name="utmbIndex" type="number" min={0} defaultValue={user.utmbIndex} className="field" /></Field>
          <Field label="Cự ly dài nhất đã về đích (km)" htmlFor="longestRaceKm"><input id="longestRaceKm" name="longestRaceKm" type="number" min={0} step="0.1" defaultValue={user.longestRaceKm} className="field" /></Field>
        </div>
      </section>
      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold">Tài khoản nhận tiền</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Ngân hàng" htmlFor="bankName"><input id="bankName" name="bankName" defaultValue={user.bankName} className="field" /></Field>
          <Field label="Số tài khoản" htmlFor="bankAccount"><input id="bankAccount" name="bankAccount" defaultValue={user.bankAccount} inputMode="numeric" className="field" /></Field>
        </div>
      </section>
      <div className="flex items-center gap-3"><SubmitButton>Lưu hồ sơ</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}
