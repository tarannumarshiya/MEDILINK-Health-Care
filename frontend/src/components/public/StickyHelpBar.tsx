import Link from "next/link";
import { hospitalInfo } from "@/lib/constants";

export default function StickyHelpBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-3 py-3 shadow-2xl backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
        <Link href="/appointment" className="rounded-xl bg-teal-700 px-2 py-3 text-white">
          Book
        </Link>
        <a href={`tel:${hospitalInfo.emergency}`} className="rounded-xl bg-red-600 px-2 py-3 text-white">
          Emergency
        </a>
        <Link href="/patient/track" className="rounded-xl border border-slate-300 px-2 py-3 text-slate-700">
          Track
        </Link>
      </div>
    </div>
  );
}