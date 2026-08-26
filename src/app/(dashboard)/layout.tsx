import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { getAgencySettings } from "@/app/actions/agency";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const agency = await getAgencySettings();

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar logoUrl={agency.logoUrl} />
        <main className="lg:ml-64 print:ml-0 min-h-screen">{children}</main>
      </div>
    </SidebarProvider>
  );
}
