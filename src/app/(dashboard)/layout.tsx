import { Sidebar } from "@/components/layout/Sidebar";
import { getAgencySettings } from "@/app/actions/agency";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const agency = await getAgencySettings();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar logoUrl={agency.logoUrl} />
      <main className="ml-64 min-h-screen">{children}</main>
    </div>
  );
}
