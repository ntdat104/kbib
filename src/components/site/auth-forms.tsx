"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { loginAction, registerAction } from "@/lib/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { cn } from "@/lib/utils";

const DEMO = [
  ["runner@kbib.vn", "Runner"], ["daily@kbib.vn", "Đại lý"], ["trunggian@kbib.vn", "Trung gian"], ["btc@kbib.vn", "BTC"],
  ["btc.trail@kbib.vn", "BTC Trail"], ["brand@kbib.vn", "Brand"], ["doitac@kbib.vn", "Đối tác"], ["admin@kbib.vn", "Admin"],
];

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(loginAction, {});
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  return (
    <>
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <Field label="Email" htmlFor="email"><input id="email" name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" /></Field>
        <Field label="Mật khẩu" htmlFor="password"><input id="password" name="password" type="password" required autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} className="field" /></Field>
        <FormMessage state={state} />
        <SubmitButton size="lg" className="w-full">Đăng nhập</SubmitButton>
      </form>
      <div className="mt-6 rounded-2xl bg-brand-50/70 p-4">
        <p className="text-xs font-semibold text-brand-700">Tài khoản demo (mật khẩu kbib@123)</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DEMO.map(([e, label]) => (
            <button key={e} type="button" onClick={() => { setEmail(e); setPw("kbib@123"); }} className="rounded-lg bg-white px-2 py-1 text-xs font-medium text-stone-700 ring-1 ring-line hover:ring-brand-300">{label}</button>
          ))}
        </div>
      </div>
    </>
  );
}

const ROLES = [
  ["runner", "Runner", "Mua & bán bib"],
  ["agent", "Đại lý", "Giới thiệu & hoa hồng"],
  ["broker", "Trung gian", "Nhận bán hộ"],
  ["organizer", "Ban tổ chức", "Quản lý chuyển nhượng"],
  ["brand", "Thương hiệu", "Quảng cáo & dữ liệu"],
  ["partner", "Đối tác dịch vụ", "Xe, KS, bảo hiểm"],
] as const;

export function RegisterForm({ refCode, role: initialRole }: { refCode: string; role: string }) {
  const [state, action] = useActionState(registerAction, {});
  const [role, setRole] = useState(ROLES.some((r) => r[0] === initialRole) ? initialRole : "runner");
  const org = ["organizer", "brand", "partner"].includes(role);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="role" value={role} />
      <fieldset>
        <legend className="label">Bạn là</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ROLES.map(([k, label, d]) => (
            <button key={k} type="button" onClick={() => setRole(k)} aria-pressed={role === k}
              className={cn("rounded-xl border p-2.5 text-left transition", role === k ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100" : "border-line hover:border-brand-200")}>
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-[11px] text-muted">{d}</p>
            </button>
          ))}
        </div>
      </fieldset>
      <Field label="Họ tên" htmlFor="name"><input id="name" name="name" required autoComplete="name" className="field" /></Field>
      {org && <Field label="Tên tổ chức / doanh nghiệp" htmlFor="orgName"><input id="orgName" name="orgName" required className="field" /></Field>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="email"><input id="email" name="email" type="email" required autoComplete="email" className="field" /></Field>
        <Field label="Số điện thoại" htmlFor="phone"><input id="phone" name="phone" required inputMode="tel" autoComplete="tel" className="field" /></Field>
      </div>
      <Field label="Mật khẩu" hint="Tối thiểu 8 ký tự" htmlFor="password"><input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" className="field" /></Field>
      <Field label="Mã giới thiệu đại lý (nếu có)" htmlFor="ref"><input id="ref" name="ref" defaultValue={refCode} className="field uppercase" /></Field>
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full">Tạo tài khoản</SubmitButton>
      <p className="text-center text-sm text-muted">Đã có tài khoản? <Link href="/login" className="font-semibold text-brand-700">Đăng nhập</Link></p>
    </form>
  );
}
