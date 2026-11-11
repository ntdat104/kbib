import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, PageHeader } from "@/components/ui/card";
import { rotateApiKeyAction } from "@/lib/actions/portal";
import { requireRole } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "API tích hợp" };

export default async function OrganizerApi() {
  const user = await requireRole("organizer");
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return (
    <>
      <PageHeader title="API tích hợp hệ thống đăng ký" subtitle="Đồng bộ yêu cầu đổi tên tự động với hệ thống bán vé / timing của BTC." />
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <KeyRound className="size-6 text-brand-600" />
        <div className="min-w-0 flex-1"><p className="text-sm text-muted">API key</p><p className="truncate font-mono text-sm font-semibold">{user.apiKey || "Chưa có"}</p></div>
        <form action={rotateApiKeyAction}><Button variant="outline">Tạo key mới</Button></form>
      </Card>
      <Card className="mt-6">
        <CardHeader title="Endpoints" />
        <div className="space-y-5 p-5 text-sm">
          <div>
            <p className="font-semibold">Lấy yêu cầu đổi tên đang chờ</p>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-ink p-4 text-xs text-orange-100">{`curl -H "Authorization: Bearer ${user.apiKey}" \\\n  ${base}/api/v1/organizer/transfers?status=requested`}</pre>
          </div>
          <div>
            <p className="font-semibold">Duyệt / từ chối</p>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-ink p-4 text-xs text-orange-100">{`curl -X POST -H "Authorization: Bearer ${user.apiKey}" -H "Content-Type: application/json" \\\n  -d '{"transferId":"trf_...","action":"approve","bibCode":"42K-1234"}' \\\n  ${base}/api/v1/organizer/transfers`}</pre>
          </div>
          <p className="text-muted">Mỗi lần duyệt, KBIB thông báo người mua, chuyển đơn sang “Đã đổi tên” và kích hoạt đếm ngược giải ngân escrow.</p>
        </div>
      </Card>
    </>
  );
}
