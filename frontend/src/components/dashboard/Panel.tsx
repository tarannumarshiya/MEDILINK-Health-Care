import { type ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--ink)]">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-[var(--ink-2)]">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
