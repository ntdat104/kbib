import type { Metadata } from "next";
import { RegisterForm } from "@/components/site/auth-forms";

export const metadata: Metadata = { title: "Đăng ký" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const sp = await searchParams;
  return (
    <div className="bg-sunrise">
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">Tham gia KBIB</h1>
          <p className="mt-1 text-sm text-muted">Miễn phí đăng ký. Chỉ trả phí khi giao dịch thành công.</p>
          <div className="mt-6"><RegisterForm refCode={typeof sp.ref === "string" ? sp.ref : ""} role={typeof sp.role === "string" ? sp.role : "runner"} /></div>
        </div>
      </div>
    </div>
  );
}
