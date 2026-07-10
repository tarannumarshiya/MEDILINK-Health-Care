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
      <div className="relative flex shrink-0 items-center justify-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 drop-shadow-sm"
        >
          {/* Top-Left Square */}
          <rect x="14" y="14" width="42" height="42" rx="14" fill="#0B2856" />
          <circle cx="22" cy="22" r="1.5" fill="#ffffff" opacity="0.25" />
          <circle cx="28" cy="28" r="1.5" fill="#ffffff" opacity="0.25" />
          <circle cx="34" cy="34" r="1.5" fill="#ffffff" opacity="0.25" />
          <circle cx="40" cy="40" r="1.5" fill="#ffffff" opacity="0.25" />
          <circle cx="46" cy="46" r="1.5" fill="#ffffff" opacity="0.25" />

          {/* Top-Right Square */}
          <rect x="62" y="14" width="42" height="42" rx="14" fill="#216BFF" />
          <circle cx="70" cy="22" r="1.5" fill="#ffffff" opacity="0.1" />
          <circle cx="76" cy="28" r="1.5" fill="#ffffff" opacity="0.1" />
          <circle cx="82" cy="34" r="1.5" fill="#ffffff" opacity="0.1" />
          <circle cx="88" cy="40" r="1.5" fill="#ffffff" opacity="0.1" />
          <circle cx="94" cy="46" r="1.5" fill="#ffffff" opacity="0.1" />

          {/* Bottom-Left Square */}
          <rect x="14" y="62" width="42" height="42" rx="14" fill="#1775FF" />
          <circle cx="22" cy="70" r="1.5" fill="#ffffff" opacity="0.25" />
          <circle cx="28" cy="76" r="1.5" fill="#ffffff" opacity="0.25" />
          <circle cx="34" cy="82" r="1.5" fill="#ffffff" opacity="0.25" />
          <circle cx="40" cy="88" r="1.5" fill="#ffffff" opacity="0.25" />
          <circle cx="46" cy="94" r="1.5" fill="#ffffff" opacity="0.25" />

          {/* Bottom-Right Square */}
          <rect x="62" y="62" width="42" height="42" rx="14" fill="#10B981" />
          <circle cx="70" cy="70" r="1.5" fill="#ffffff" opacity="0.25" />
          <circle cx="76" cy="76" r="1.5" fill="#ffffff" opacity="0.25" />
          <circle cx="82" cy="82" r="1.5" fill="#ffffff" opacity="0.25" />
          <circle cx="88" cy="88" r="1.5" fill="#ffffff" opacity="0.25" />
          <circle cx="94" cy="94" r="1.5" fill="#ffffff" opacity="0.25" />

          {/* Outer Dots */}
          <circle cx="8" cy="8" r="4" fill="#0B2856" />
          <circle cx="56" cy="56" r="4" fill="#1775FF" />
          <circle cx="110" cy="110" r="3.5" fill="#10B981" />
        </svg>
      </div>

      <span className="flex flex-col leading-none ml-1">
        <span className="font-display text-[26px] font-black tracking-tight">
          <span className="text-[#0B2856]">Medi</span>
          <span className="text-[#00B4D8]">link</span>
        </span>
        <span className="mt-1 text-[8px] font-extrabold uppercase tracking-[0.25em] text-[#9CA3AF] whitespace-nowrap">
          Digital Health. Connected
        </span>
      </span>
    </>
  );

  if (isLink) {
    return (
      <Link href="/" className={`flex items-center gap-1.5 hover:opacity-90 transition-opacity ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {content}
    </div>
  );
}
