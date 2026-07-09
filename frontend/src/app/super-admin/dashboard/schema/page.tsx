"use client";

import { useState, useMemo } from "react";
import {
  Database, Table2, Key, Link2, Shield, Search,
  ChevronDown, ChevronRight, GitBranch, AlertCircle,
  CheckCircle2, Circle, Hash,
} from "lucide-react";
import {
  schema, MODULE_GROUPS, MODULE_COLORS,
  type TableDef, type ColumnDef,
} from "@/lib/schema";

/* ── helpers ── */
function TypeBadge({ type }: { type: string }) {
  const color =
    type.startsWith("uuid")        ? "bg-violet-100 text-violet-700" :
    type.startsWith("text")        ? "bg-sky-100    text-sky-700"    :
    type.startsWith("bool")        ? "bg-emerald-100 text-emerald-700":
    type.startsWith("numeric") ||
    type.startsWith("int") ||
    type.startsWith("small")       ? "bg-amber-100  text-amber-700"  :
    type.startsWith("timestamp")   ? "bg-rose-100   text-rose-700"   :
    type.startsWith("date") ||
    type.startsWith("time")        ? "bg-orange-100 text-orange-700" :
    type.startsWith("jsonb") ||
    type.startsWith("json")        ? "bg-pink-100   text-pink-700"   :
    type.startsWith("inet")        ? "bg-cyan-100   text-cyan-700"   :
                                     "bg-slate-100  text-slate-600"  ;
  return (
    <span className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${color}`}>
      {type}
    </span>
  );
}

function ColumnRow({ col }: { col: ColumnDef }) {
  return (
    <tr className="border-b border-[var(--line)] hover:bg-[var(--canvas)] transition-colors">
      {/* Name */}
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          {col.pk ? (
            <Key className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          ) : col.fk ? (
            <Link2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          ) : (
            <Hash className="h-3.5 w-3.5 text-slate-300 shrink-0" />
          )}
          <span className={`font-mono text-sm font-bold ${col.pk ? "text-amber-600" : col.fk ? "text-blue-600" : "text-[var(--ink)]"}`}>
            {col.name}
          </span>
          {col.unique && !col.pk && (
            <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-violet-600">UQ</span>
          )}
        </div>
        {col.fk && (
          <p className="mt-0.5 pl-5 font-mono text-[10px] text-blue-400">→ {col.fk}</p>
        )}
      </td>
      {/* Type */}
      <td className="px-4 py-2.5"><TypeBadge type={col.type} /></td>
      {/* Nullable */}
      <td className="px-4 py-2.5">
        {col.nullable
          ? <span className="flex items-center gap-1 text-xs text-slate-400"><Circle className="h-3 w-3" /> NULL</span>
          : <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3 w-3" /> NOT NULL</span>
        }
      </td>
      {/* Default */}
      <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{col.default ?? "—"}</td>
      {/* Note */}
      <td className="px-4 py-2.5 text-xs text-[var(--muted)]">{col.note ?? ""}</td>
    </tr>
  );
}

function TableCard({ table, active, onClick }: { table: TableDef; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
        active
          ? `border-[var(--primary)] bg-[var(--primary-soft)]`
          : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--primary)]/40 hover:bg-[var(--canvas)]"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${table.color}`}>
          <Table2 className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`truncate font-mono text-sm font-bold ${active ? "text-[var(--primary)]" : "text-[var(--ink)]"}`}>
            {table.name}
          </p>
          <p className="truncate text-[10px] text-[var(--muted)]">{table.columns.length} cols</p>
        </div>
        {active && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />}
      </div>
    </button>
  );
}

function TableDetail({ table }: { table: TableDef }) {
  const [showRelations, setShowRelations] = useState(false);
  const [showIndexes, setShowIndexes]     = useState(false);

  const pkCols  = table.columns.filter(c => c.pk);
  const fkCols  = table.columns.filter(c => c.fk);
  const reqCols = table.columns.filter(c => !c.nullable && !c.pk);

  return (
    <div className="animate-fade-rise">
      {/* Header */}
      <div className={`rounded-2xl bg-gradient-to-r ${table.color} p-6 text-white`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-white/70">{table.module} Module</p>
                <h2 className="font-mono text-2xl font-black">{table.name}</h2>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">{table.description}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black text-white">
              {table.columns.length} columns
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black text-white">
              {pkCols.length} PK
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black text-white">
              {fkCols.length} FK
            </span>
          </div>
        </div>

        {/* RLS Banner */}
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-black/20 px-4 py-3">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-white/70" />
          <p className="text-xs font-bold text-white/80"><span className="font-black text-white">RLS Policy:</span> {table.rls}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Columns",    value: table.columns.length,              color: "text-[var(--ink)]" },
          { label: "Primary Keys",     value: pkCols.length,                     color: "text-amber-600" },
          { label: "Foreign Keys",     value: fkCols.length,                     color: "text-blue-600" },
          { label: "Required Fields",  value: reqCols.length,                    color: "text-emerald-600" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-center shadow-[var(--shadow)]">
            <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Columns Table */}
      <div className="mt-5 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <div className="border-b border-[var(--line)] bg-[var(--canvas)] px-5 py-3">
          <h3 className="text-sm font-black text-[var(--ink)]">Column Definitions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-[var(--line)] bg-slate-950 text-left text-xs text-white">
                <th className="px-4 py-3 font-black">Column</th>
                <th className="px-4 py-3 font-black">Type</th>
                <th className="px-4 py-3 font-black">Nullable</th>
                <th className="px-4 py-3 font-black">Default</th>
                <th className="px-4 py-3 font-black">Notes</th>
              </tr>
            </thead>
            <tbody>
              {table.columns.map(col => (
                <ColumnRow key={col.name} col={col} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relations */}
      <div className="mt-4 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <button
          onClick={() => setShowRelations(v => !v)}
          className="flex w-full items-center justify-between px-5 py-3 text-sm font-black text-[var(--ink)] hover:bg-[var(--canvas)]"
        >
          <span className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-blue-500" />
            Relationships ({table.relations.length})
          </span>
          {showRelations ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {showRelations && (
          <div className="border-t border-[var(--line)] px-5 py-4">
            <div className="grid gap-2">
              {table.relations.map((r, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
                  <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                  <code className="font-mono text-xs">{r}</code>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Indexes */}
      {table.indexes && (
        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]">
          <button
            onClick={() => setShowIndexes(v => !v)}
            className="flex w-full items-center justify-between px-5 py-3 text-sm font-black text-[var(--ink)] hover:bg-[var(--canvas)]"
          >
            <span className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-amber-500" />
              Indexes & Constraints ({table.indexes.length})
            </span>
            {showIndexes ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {showIndexes && (
            <div className="border-t border-[var(--line)] px-5 py-4">
              <div className="flex flex-wrap gap-2">
                {table.indexes.map((idx, i) => (
                  <code key={i} className="rounded-lg bg-amber-50 px-3 py-1.5 font-mono text-xs font-bold text-amber-700">
                    {idx}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────── */
export default function SchemaPage() {
  const [selected, setSelected]  = useState<string>(schema[0].name);
  const [search, setSearch]      = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");

  const activeTable = schema.find(t => t.name === selected)!;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return schema.filter(t => {
      const matchSearch = !q ||
        t.name.includes(q) ||
        t.label.toLowerCase().includes(q) ||
        t.module.toLowerCase().includes(q) ||
        t.columns.some(c => c.name.includes(q));
      const matchModule = moduleFilter === "All" || t.module === moduleFilter;
      return matchSearch && matchModule;
    });
  }, [search, moduleFilter]);

  const modules = ["All", ...Object.keys(MODULE_GROUPS)];
  const totalCols = schema.reduce((s, t) => s + t.columns.length, 0);
  const totalFKs  = schema.reduce((s, t) => s + t.columns.filter(c => c.fk).length, 0);

  return (
    <div className="min-h-screen bg-[var(--canvas)] font-sans">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--surface)] px-6 py-4">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-black text-[var(--ink)]">Database Schema</h1>
              <p className="text-xs text-[var(--muted)]">
                {schema.length} tables &bull; {totalCols} columns &bull; {totalFKs} foreign keys &bull; Multi-hospital SaaS
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Module filter */}
            <div className="flex flex-wrap gap-1.5">
              {modules.map(m => (
                <button
                  key={m}
                  onClick={() => setModuleFilter(m)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    moduleFilter === m
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : `${MODULE_COLORS[m] ?? "bg-slate-100 text-slate-600"} hover:brightness-95`
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-screen-2xl gap-0">
        {/* ── Sidebar ── */}
        <aside className="sticky top-[73px] h-[calc(100vh-73px)] w-64 shrink-0 overflow-y-auto border-r border-[var(--line)] bg-[var(--surface)] p-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
            <input
              className="h-9 w-full rounded-xl border border-[var(--line)] bg-[var(--canvas)] pl-9 pr-3 text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:border-[var(--primary)] focus:outline-none"
              placeholder="Search tables or columns…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Grouped table list */}
          {Object.entries(MODULE_GROUPS).map(([mod, tableNames]) => {
            const visibleTables = tableNames
              .map(n => schema.find(t => t.name === n)!)
              .filter(Boolean)
              .filter(t => filtered.includes(t));
            if (!visibleTables.length) return null;
            if (moduleFilter !== "All" && moduleFilter !== mod) return null;

            return (
              <div key={mod} className="mb-4">
                <p className={`mb-1.5 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest ${MODULE_COLORS[mod] ?? "bg-slate-100 text-slate-600"}`}>
                  {mod}
                </p>
                <div className="grid gap-1.5">
                  {visibleTables.map(t => (
                    <TableCard
                      key={t.name}
                      table={t}
                      active={selected === t.name}
                      onClick={() => setSelected(t.name)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="mt-6 flex flex-col items-center gap-2 text-center">
              <AlertCircle className="h-8 w-8 text-slate-300" />
              <p className="text-xs text-slate-400">No tables match your search.</p>
            </div>
          )}
        </aside>

        {/* ── Main content ── */}
        <main className="min-w-0 flex-1 p-6">
          {activeTable && <TableDetail key={activeTable.name} table={activeTable} />}
        </main>
      </div>
    </div>
  );
}
