import type { MetadataRoute } from "next";
import { getAgencySettings } from "@/app/actions/agency";

export const dynamic = "force-dynamic";

function guessImageType(url: string): string {
  const ext = url.split(".").pop()?.toLowerCase().split("?")[0];
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/png";
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const agency = await getAgencySettings();

  const icons: MetadataRoute.Manifest["icons"] = agency.appIconUrl
    ? [
        { src: agency.appIconUrl, sizes: "192x192", type: guessImageType(agency.appIconUrl) },
        { src: agency.appIconUrl, sizes: "512x512", type: guessImageType(agency.appIconUrl) },
      ]
    : [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ];

  return {
    name: agency.name || "NovaRota Marketing",
    short_name: agency.name || "NovaRota",
    description: "Sistema de gestão da agência",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ea580c",
    icons,
  };
}
