import BrandLogo from "@/components/BrandLogo";

export default function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <BrandLogo isLink={false} />
        <p className="text-sm font-semibold text-muted-foreground mt-2">Loading…</p>
      </div>
    </div>
  );
}
