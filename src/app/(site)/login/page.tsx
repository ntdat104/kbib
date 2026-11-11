import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/site/auth-forms";

export const metadata: Metadata = { title: "Đăng nhập" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  return (
    <div className="bg-sunrise">
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">Chào mừng trở lại 👋</h1>
          <p className="mt-1 text-sm text-muted">Đăng nhập để mua, bán bib và theo dõi đơn hàng.</p>
          <div className="mt-6"><LoginForm next={typeof sp.next === "string" ? sp.next : ""} /></div>
          <p className="mt-6 text-center text-sm text-muted">Chưa có tài khoản? <Link href="/register" className="font-semibold text-brand-700">Đăng ký miễn phí</Link></p>
        </div>
      </div>
    </div>
  );
}
