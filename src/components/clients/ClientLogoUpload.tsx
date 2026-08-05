"use client";

import { LogoUpload } from "@/components/settings/LogoUpload";
import { updateClientLogo } from "@/app/actions/logo";

export function ClientLogoUpload({ clientId, logoUrl }: { clientId: string; logoUrl?: string | null }) {
  return (
    <LogoUpload
      currentUrl={logoUrl}
      onUploaded={(url) => updateClientLogo(clientId, url)}
      label={logoUrl ? "Trocar Logo" : "Enviar Logo"}
    />
  );
}
