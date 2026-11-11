import type { Metadata } from "next";
import { Activity, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { ProfileForm } from "@/components/portal/profile-form";
import { connectStravaAction } from "@/lib/actions/market";
import { requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Hồ sơ năng lực" };

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="Hồ sơ năng lực" subtitle="Hoàn thiện hồ sơ để mua bib ultra và nhận tiền nhanh hơn." />
      <Card className="mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fc4c02]/10 text-[#fc4c02]"><Activity className="size-6" /></span>
        <div className="flex-1">
          <p className="font-semibold">Kết nối Strava / Garmin {user.stravaConnected && <BadgeCheck className="ml-1 inline size-4 text-sky-500" />}</p>
          <p className="text-sm text-muted">Tự động xác thực lịch sử về đích để mở khoá cự ly ultra mà không cần giấy tờ.</p>
        </div>
        <form action={connectStravaAction}><Button variant={user.stravaConnected ? "outline" : "primary"}>{user.stravaConnected ? "Ngắt kết nối" : "Kết nối"}</Button></form>
      </Card>
      <ProfileForm user={user} />
    </>
  );
}
