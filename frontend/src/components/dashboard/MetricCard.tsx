import { type ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export function MetricCard({
  label,
  value,
  icon,
  delta,
  deltaType = "neutral",
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  delta?: string;
  deltaType?: "increase" | "decrease" | "neutral";
}) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-widest text-[var(--muted)]">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-[var(--ink)]">
            {value}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-tint)] text-[var(--brand)]">
          {icon}
        </div>
      </div>
      {delta && (
        <div className="mt-4 flex items-center gap-1.5 text-sm font-medium">
          {deltaType === "increase" && <TrendingUp className="h-4 w-4 text-[var(--ok)]" />}
          {deltaType === "decrease" && <TrendingDown className="h-4 w-4 text-[var(--danger)]" />}
          <span
            className={
              deltaType === "increase"
                ? "text-[var(--ok)]"
                : deltaType === "decrease"
                ? "text-[var(--danger)]"
                : "text-[var(--ink-2)]"
            }
          >
            {delta}
          </span>
        </div>
      )}
    </div>
  );
}
