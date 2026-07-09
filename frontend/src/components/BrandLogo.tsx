import Image from "next/image";
import Link from "next/link";

export default function BrandLogo({
  className = "",
  isLink = true,
}: {
  className?: string;
  isLink?: boolean;
}) {
  const content = (
    <>
      {/* Logo image — shown in full with object-contain so nothing gets cropped */}
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-[0_4px_16px_rgba(14,116,144,0.20)]">
        <Image
          src="/images/LOGO.png"
          alt="Medilink Health Care Logo"
          fill
          sizes="44px"
          className="object-contain"
          priority
        />
      </span>

      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-black tracking-tight text-foreground">
          Medilink
        </span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
          Health Care
        </span>
      </span>
    </>
  );

  if (isLink) {
    return (
      <Link href="/" className={`flex items-center gap-3 ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {content}
    </div>
  );
}
