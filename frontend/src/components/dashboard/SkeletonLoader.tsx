export function SkeletonLoader({
  variant = "card",
  count = 3,
}: {
  variant?: "card" | "table" | "stat";
  count?: number;
}) {
  if (variant === "stat") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-[var(--radius)] bg-[var(--line)]"
          />
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="mb-6 h-6 w-48 animate-pulse rounded-[var(--radius-sm)] bg-[var(--line)]" />
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-[var(--radius-sm)] bg-[var(--line)]"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-[var(--radius)] bg-[var(--line)]"
        />
      ))}
    </div>
  );
}
