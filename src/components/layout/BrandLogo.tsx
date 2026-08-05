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
      <span className="text-2xl font-black italic text-orange-500 tracking-tight">
        novarota
      </span>
      <div className={cn("text-[10px] tracking-[0.2em] uppercase mt-0.5", dark ? "text-gray-400" : "text-gray-500")}>
        marketing.
      </div>
    </div>
  );
}
