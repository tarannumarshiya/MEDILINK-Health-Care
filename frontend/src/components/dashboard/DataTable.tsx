import { type ReactNode } from "react";

export type ColumnDef<T> = {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
  align?: "left" | "right" | "center";
};

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]">
      <table className="w-full min-w-[600px] border-collapse text-left text-sm text-[var(--ink)]">
        <thead>
          <tr className="border-b border-[var(--line)] bg-[var(--canvas)]">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`sticky top-0 px-4 py-3 text-[12px] font-semibold uppercase tracking-widest text-[var(--muted)] ${
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : "text-left"
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[var(--ink-2)]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="group transition-colors hover:bg-[var(--brand-tint)]"
              >
                {columns.map((col, idx) => {
                  const content = col.cell
                    ? col.cell(item)
                    : col.accessorKey
                    ? (item[col.accessorKey] as ReactNode)
                    : null;
                  
                  const isNumeric = typeof content === 'number' || col.align === 'right';

                  return (
                    <td
                      key={idx}
                      className={`h-[44px] px-4 py-2 ${
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left"
                      } ${isNumeric ? "tabular-nums" : ""}`}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
