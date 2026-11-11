import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { adminUserAction } from "@/lib/actions/portal";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import type { Role } from "@/lib/types";
import { formatDate, ROLE_LABEL } from "@/lib/utils";

export const metadata: Metadata = { title: "Người dùng" };

export default async function AdminUsers({ searchParams }: PageProps<"/admin/users">) {
  await requireRole("admin");
  const q = String((await searchParams).q ?? "").toLowerCase();
  const users = (await db.users.where((u) => !q || `${u.name} ${u.email} ${u.orgName}`.toLowerCase().includes(q))).slice(0, 100);
  return (
    <>
      <PageHeader title="Người dùng" action={<form className="flex gap-2"><input name="q" defaultValue={q} placeholder="Tìm tên, email…" className="field h-9 w-56" /><Button size="sm" variant="outline">Tìm</Button></form>} />
      <Card>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Tài khoản</th><th>Vai trò</th><th>Uy tín</th><th>Trạng thái</th><th>Tham gia</th><th /></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><p className="font-medium">{u.orgName || u.name}</p><p className="text-xs text-muted">{u.email}{u.referredBy ? ` · ref ${u.referredBy}` : ""}</p></td>
                  <td>
                    <form action={adminUserAction} className="flex gap-1">
                      <input type="hidden" name="id" value={u.id} />
                      <select name="role" defaultValue={u.role} className="field h-8 w-36 py-0 text-xs" aria-label="Vai trò">
                        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </select>
                      <Button size="sm" variant="ghost">Lưu</Button>
                    </form>
                  </td>
                  <td className="tabular-nums">{u.trustScore}{u.verified && <Badge tone="sky" className="ml-1">KYC</Badge>}</td>
                  <td><Badge tone={u.status === "active" ? "emerald" : "rose"}>{u.status === "active" ? "Hoạt động" : "Khoá"}</Badge></td>
                  <td className="text-xs text-muted">{formatDate(u.createdAt)}</td>
                  <td className="flex gap-1">
                    <form action={adminUserAction}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="verified" value={String(!u.verified)} /><Button size="sm" variant="ghost">{u.verified ? "Bỏ KYC" : "Duyệt KYC"}</Button></form>
                    <form action={adminUserAction}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="status" value={u.status === "active" ? "suspended" : "active"} /><Button size="sm" variant="ghost" className={u.status === "active" ? "text-rose-600" : ""}>{u.status === "active" ? "Khoá" : "Mở khoá"}</Button></form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
