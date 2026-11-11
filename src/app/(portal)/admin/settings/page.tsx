import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/card";
import { SettingsForm } from "@/components/portal/settings-form";
import { requireRole } from "@/lib/auth/dal";
import { getSettings } from "@/lib/services/settings";

export const metadata: Metadata = { title: "Cấu hình phí" };

export default async function AdminSettings() {
  await requireRole("admin");
  return (
    <>
      <PageHeader title="Cấu hình phí & quy tắc" subtitle="Lưu trong tab settings của Google Sheet – áp dụng ngay cho giao dịch mới." />
      <SettingsForm settings={await getSettings()} />
    </>
  );
}
