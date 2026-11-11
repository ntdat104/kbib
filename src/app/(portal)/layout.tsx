import { Sidebar } from "@/components/portal/sidebar";
import { SiteHeader } from "@/components/site/header";
import { requireUser } from "@/lib/auth/dal";

export default async function PortalLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  return (
    <>
      <SiteHeader />
      <div className="mx-auto w-full max-w-7xl flex-1 gap-8 px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[220px_1fr] lg:py-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Sidebar role={user.role} />
        </aside>
        <main className="min-w-0 pt-4 lg:pt-0">{children}</main>
      </div>
    </>
  );
}
