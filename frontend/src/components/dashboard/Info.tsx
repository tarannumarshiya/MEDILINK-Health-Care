export function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius)] bg-[var(--canvas)] p-4 border border-[var(--line)]">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 font-semibold text-[var(--ink)]">{value}</p>
    </div>
  );
}
