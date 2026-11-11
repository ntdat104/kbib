import { ShieldAlert } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export default function Forbidden() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <ShieldAlert className="mx-auto size-12 text-brand-500" />
      <h1 className="mt-4 text-2xl font-bold">Bạn không có quyền truy cập</h1>
      <p className="mt-2 text-muted">Trang này dành cho vai trò khác. Liên hệ KBIB nếu bạn cần nâng cấp tài khoản đối tác.</p>
      <ButtonLink href="/" className="mt-6">Về trang chủ</ButtonLink>
    </div>
  );
}
