import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-display text-8xl font-black text-primary/20">404</p>
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      </div>
      <div className="flex gap-3">
        <Link href="/appointment"
          className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-primary/10">
          Book Appointment
        </Link>
        <Link href="/"
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
          style={{ background: "var(--gradient-primary)" }}>
          Go home
        </Link>
      </div>
    </div>
  );
}
