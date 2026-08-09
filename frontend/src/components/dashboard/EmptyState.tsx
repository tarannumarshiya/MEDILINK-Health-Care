import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description: string;
}

export function EmptyState({ title = "No records found", description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-black text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-xs">{description}</p>
    </div>
  );
}
export default EmptyState;
