import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { PwaRegister } from "@/components/providers/PwaRegister";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { getAgencySettings } from "@/app/actions/agency";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const agency = await getAgencySettings();

  return {
    title: "NovaRotaAdm - Marketing Agency Management",
    description: "Complete management system for marketing agencies",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "NovaRota",
    },
    icons: {
      apple: agency.appIconUrl || "/icons/apple-touch-icon.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#ea580c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionProvider>{children}</SessionProvider>
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
