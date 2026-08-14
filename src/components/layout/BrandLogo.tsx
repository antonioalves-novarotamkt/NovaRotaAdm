import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({ logoUrl, dark, size = 40 }: { logoUrl?: string | null; dark?: boolean; size?: number }) {
  if (logoUrl) {
    return (
      <div className="relative" style={{ height: size, width: size * 2.5 }}>
        <Image src={logoUrl} alt="Logo" fill className="object-contain object-left" unoptimized />
      </div>
    );
  }

  return (
    <div className="leading-none">
      <span
        style={{ fontSize: size * 0.5 }}
        className="font-black italic text-orange-500 tracking-tight block"
      >
        novarota
      </span>
      <div
        style={{ fontSize: Math.max(size * 0.13, 9) }}
        className={cn("tracking-[0.2em] uppercase mt-1", dark ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400")}
      >
        marketing.
      </div>
    </div>
  );
}
