import { cn } from "@/lib/utils";

export function GradientBlobs({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary/30 blur-3xl animate-blob" />
      <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-cyan/25 blur-3xl animate-blob [animation-delay:-6s]" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-mint/25 blur-3xl animate-blob [animation-delay:-12s]" />
    </div>
  );
}
