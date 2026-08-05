import { LoginForm } from "@/components/auth/LoginForm";
import { getAgencySettings } from "@/app/actions/agency";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const agency = await getAgencySettings();

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <LoginForm logoUrl={agency.logoUrl} />
    </div>
  );
}
