"use client";

import { useActionState } from "react";
import { createCampaignAction, createVoucherAction } from "@/lib/actions/portal";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";

export function CampaignForm() {
  const [state, action] = useActionState(createCampaignAction, {});
  return (
    <form action={action} className="grid gap-4 p-5 sm:grid-cols-2">
      <Field label="Tên chiến dịch" htmlFor="name"><input id="name" name="name" required className="field" /></Field>
      <Field label="Vị trí" htmlFor="placement">
        <select id="placement" name="placement" className="field">
          <option value="home_hero">Trang chủ (banner)</option><option value="race_sidebar">Trang giải chạy</option><option value="checkout">Checkout</option><option value="search_top">Đầu trang tìm kiếm</option>
        </select>
      </Field>
      <Field label="Tiêu đề" htmlFor="title" className="sm:col-span-2"><input id="title" name="title" required className="field" /></Field>
      <Field label="Nội dung" htmlFor="body" className="sm:col-span-2"><input id="body" name="body" className="field" /></Field>
      <Field label="Nút CTA" htmlFor="cta"><input id="cta" name="cta" defaultValue="Xem ngay" className="field" /></Field>
      <Field label="Link đích" htmlFor="link"><input id="link" name="link" type="url" required placeholder="https://" className="field" /></Field>
      <Field label="Nhắm mục tiêu" htmlFor="target"><select id="target" name="target" className="field"><option value="all">Tất cả</option><option value="road">Runner Road</option><option value="trail">Runner Trail</option></select></Field>
      <Field label="Số ngày chạy" htmlFor="days"><input id="days" name="days" type="number" defaultValue={30} min={1} className="field" /></Field>
      <Field label="Ngân sách (đ)" htmlFor="budget"><input id="budget" name="budget" type="number" defaultValue={10000000} step={1000000} className="field" /></Field>
      <Field label="CPM (đ / 1000 hiển thị)" htmlFor="cpm"><input id="cpm" name="cpm" type="number" defaultValue={50000} step={5000} className="field" /></Field>
      <div className="flex items-center gap-3 sm:col-span-2"><SubmitButton>Gửi duyệt</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}

export function VoucherForm() {
  const [state, action] = useActionState(createVoucherAction, {});
  return (
    <form action={action} className="grid gap-4 p-5 sm:grid-cols-2">
      <Field label="Mã voucher" htmlFor="code"><input id="code" name="code" required className="field uppercase" /></Field>
      <Field label="Hiển thị ưu đãi" htmlFor="discountText"><input id="discountText" name="discountText" placeholder="-15%" required className="field" /></Field>
      <Field label="Tiêu đề" htmlFor="vtitle" className="sm:col-span-2"><input id="vtitle" name="title" required className="field" /></Field>
      <Field label="Mô tả" htmlFor="description" className="sm:col-span-2"><input id="description" name="description" className="field" /></Field>
      <Field label="Đối tượng" htmlFor="vtarget"><select id="vtarget" name="target" className="field"><option value="all">Tất cả</option><option value="road">Road</option><option value="trail">Trail</option></select></Field>
      <Field label="Cự ly tối thiểu (km)" htmlFor="minKm"><input id="minKm" name="minKm" type="number" defaultValue={0} className="field" /></Field>
      <Field label="Số lượng" htmlFor="quantity"><input id="quantity" name="quantity" type="number" defaultValue={500} className="field" /></Field>
      <Field label="CPA (đ / voucher phát)" htmlFor="cpa"><input id="cpa" name="cpa" type="number" defaultValue={10000} step={1000} className="field" /></Field>
      <Field label="Link sử dụng" htmlFor="vlink" className="sm:col-span-2"><input id="vlink" name="link" type="url" required placeholder="https://" className="field" /></Field>
      <div className="flex items-center gap-3 sm:col-span-2"><SubmitButton>Tạo voucher</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}
