export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let cls = "bg-[var(--canvas)] text-[var(--muted)] border-[var(--line)]";

  if (["pending","processing","in_progress","new","ongoing","partial","lab_requested"].some(x => s.includes(x) || s === x)) {
    cls = "bg-amber-50 text-amber-700 border-amber-100";
  } else if (["approved","completed","paid","verified","success","resolved","active","available","delivered","ready","settled","dispensed","collected"].some(x => s.includes(x) || s === x)) {
    cls = "bg-[var(--accent-soft)] text-[var(--accent-deep)] border-transparent";
  } else if (["rejected","cancelled","critical","failed","error","unpaid","overdue","occupied","urgent"].some(x => s.includes(x) || s === x)) {
    cls = "bg-red-50 text-red-700 border-red-100";
  } else if (["scheduled","info","read","normal","refunded","prescription_ready"].some(x => s.includes(x) || s === x)) {
    cls = "bg-[var(--primary-soft)] text-[var(--primary)] border-transparent";
  }

  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
