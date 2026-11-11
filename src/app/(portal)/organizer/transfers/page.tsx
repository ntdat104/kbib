import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/form";
import { approveTransferAction, rejectTransferAction } from "@/lib/actions/portal";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, formatVND } from "@/lib/utils";

export const metadata: Metadata = { title: "Duyệt đổi tên" };

export default async function TransfersPage() {
  const user = await requireRole("organizer");
  const races = await db.races.where((r) => user.role === "admin" || r.organizerId === user.id);
  const ids = new Set(races.map((r) => r.id));
  const [transfers, distances, users] = await Promise.all([db.transfers.where((t) => ids.has(t.raceId)), db.distances.all(), db.users.all()]);
  const pending = transfers.filter((t) => t.status === "requested").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const done = transfers.filter((t) => t.status !== "requested").sort((a, b) => b.handledAt.localeCompare(a.handledAt)).slice(0, 30);
  return (
    <>
      <PageHeader title="Duyệt đổi tên" subtitle="Người mua đã thanh toán vào escrow. Duyệt để cấp mã bib mới – có thể tích hợp tự động qua API." />
      {pending.length ? (
        <div className="space-y-3">
          {pending.map((t) => {
            const r = races.find((x) => x.id === t.raceId);
            const ri = t.runnerInfo;
            return (
              <Card key={t.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{r?.name} · {distances.find((d) => d.id === t.distanceId)?.name}</p>
                    <p className="text-xs text-muted">Yêu cầu lúc {formatDateTime(t.createdAt)} · Phí đổi tên {formatVND(t.organizerFee)}</p>
                  </div>
                  <Badge tone="amber">Chờ duyệt</Badge>
                </div>
                <div className="mt-4 grid gap-4 rounded-xl bg-stone-50 p-4 text-sm sm:grid-cols-2">
                  <div><p className="text-xs uppercase tracking-wide text-muted">Từ</p><p className="font-medium">{users.find((u) => u.id === t.fromUserId)?.name}</p></div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted">Sang</p>
                    <p className="font-medium">{ri?.fullName} · {ri?.gender === "female" ? "Nữ" : "Nam"} · {formatDate(ri?.dob ?? "")}</p>
                    <p className="text-xs text-muted">CCCD {ri?.idNumber} · {ri?.phone} · Áo {ri?.shirtSize}</p>
                    <p className="text-xs text-muted">Khẩn cấp: {ri?.emergencyContact}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={approveTransferAction} className="flex gap-2">
                    <input type="hidden" name="id" value={t.id} />
                    <input name="bibCode" placeholder="Mã bib mới (tự sinh nếu trống)" className="field h-10 w-64" />
                    <SubmitButton>Duyệt</SubmitButton>
                  </form>
                  <form action={rejectTransferAction} className="flex gap-2">
                    <input type="hidden" name="id" value={t.id} />
                    <input name="reason" placeholder="Lý do từ chối" className="field h-10 w-48" />
                    <Button variant="outline">Từ chối</Button>
                  </form>
                </div>
              </Card>
            );
          })}
        </div>
      ) : <EmptyState icon={<ClipboardCheck className="size-5" />} title="Không có yêu cầu chờ duyệt" />}

      <h2 className="mb-3 mt-10 text-lg font-bold">Đã xử lý gần đây</h2>
      <Card>
        <table className="table-base">
          <thead><tr><th>Runner mới</th><th>Giải</th><th>Mã bib</th><th>Kết quả</th></tr></thead>
          <tbody>
            {done.map((t) => (
              <tr key={t.id}>
                <td>{t.runnerInfo?.fullName}</td>
                <td className="max-w-56 truncate">{races.find((r) => r.id === t.raceId)?.name}</td>
                <td className="font-mono text-xs">{t.newBibCode || "—"}</td>
                <td><Badge tone={t.status === "approved" ? "emerald" : "rose"}>{t.status === "approved" ? "Đã duyệt" : "Từ chối"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
