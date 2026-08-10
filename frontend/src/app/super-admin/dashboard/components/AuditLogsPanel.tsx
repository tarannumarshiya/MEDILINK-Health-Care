"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Panel } from "@/components/dashboard/Panel";

type AuditLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  detail: string;
  created_at: string;
  actor_name?: string;
};

interface AuditLogsPanelProps {
  auditLogs: AuditLog[];
  load: (showLoader?: boolean) => Promise<void>;
}

export function AuditLogsPanel({ auditLogs, load }: AuditLogsPanelProps) {
  const [auditSearch, setAuditSearch] = useState("");

  const filteredLogs = auditLogs.filter((log) => {
    const q = auditSearch.toLowerCase();
    return (
      !q ||
      log.action.toLowerCase().includes(q) ||
      log.entity.toLowerCase().includes(q) ||
      (log.detail ?? "").toLowerCase().includes(q) ||
      (log.actor_name ?? "").toLowerCase().includes(q)
    );
  });

  const usingMockLogs = auditLogs.length > 0 && auditLogs[0].id.startsWith("al-");

  return (
    <Panel
      title="Audit Logs"
      subtitle={
        usingMockLogs
          ? "⚠ audit_logs table empty — showing mock data"
          : `${auditLogs.length} entries`
      }
      action={
        <button
          type="button"
          onClick={() => load(true)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          aria-label="Refresh audit logs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      }
    >
      <div className="mb-4">
        <input
          className="h-10 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          placeholder="Filter by action, entity, actor, or detail…"
          value={auditSearch}
          onChange={(e) => setAuditSearch(e.target.value)}
          aria-label="Filter audit logs by action, entity, actor, or detail"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-950 text-left text-white">
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Detail</th>
            </tr>
          </thead>

          <tbody>
            {filteredLogs.map((log) => (
              <tr
                key={log.id}
                className="border-b border-slate-100 hover:bg-slate-50"
              >
                <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                  {new Date(log.created_at).toLocaleString()}
                </td>

                <td className="px-4 py-3 font-bold text-slate-900">
                  {log.actor_name ?? log.actor_id ?? "—"}
                </td>

                <td className="px-4 py-3">
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-teal-700">
                    {log.action}
                  </span>
                </td>

                <td className="px-4 py-3 text-slate-500">
                  {log.entity}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {log.detail}
                </td>
              </tr>
            ))}

            {filteredLogs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No log entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
