"use client";
import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl" style={{ background: "var(--gradient-primary)" }}>
        <AlertTriangle className="h-8 w-8 text-white" />
      </div>
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">An unexpected error occurred. Our team has been notified.</p>
      </div>
      <div className="flex gap-3">
        <button onClick={reset}
          className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-primary/10">
          Try again
        </button>
        <Link href="/"
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
          style={{ background: "var(--gradient-primary)" }}>
          Go home
        </Link>
      </div>
    </div>
  );
}
