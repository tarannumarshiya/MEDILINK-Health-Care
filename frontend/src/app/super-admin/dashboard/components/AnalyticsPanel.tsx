"use client";

import { Panel } from "@/components/dashboard/Panel";
import { ROLE_LABELS } from "@/lib/roles";

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

type Analytics = {
  totalPatients: number;
  totalStaff: number;
  totalDoctors: number;
  totalAppointments: number;
  pendingAppointments: number;
  totalInvoices: number;
  unpaidInvoices: number;
  totalRevenue: number;
  appointmentsByDept: { department: string; count: number }[];
};

interface AnalyticsPanelProps {
  analytics: Analytics | null;
  users: Profile[];
}

export function AnalyticsPanel({ analytics, users }: AnalyticsPanelProps) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Registered Patients",
            value: analytics?.totalPatients ?? 0,
          },
          {
            label: "Staff Members",
            value: analytics?.totalStaff ?? 0,
          },
          {
            label: "Total Appointments",
            value: analytics?.totalAppointments ?? 0,
          },
          {
            label: "Pending Approvals",
            value: analytics?.pendingAppointments ?? 0,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              {stat.label}
            </p>

            <p className="mt-3 text-4xl font-black tabular-nums text-slate-950">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Invoices",
            value: analytics?.totalInvoices ?? 0,
          },
          {
            label: "Unpaid Invoices",
            value: analytics?.unpaidInvoices ?? 0,
          },
          {
            label: "Revenue Collected",
            value: `৳${(analytics?.totalRevenue ?? 0).toLocaleString()}`,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              {stat.label}
            </p>

            <p className="mt-3 text-3xl font-black tabular-nums text-slate-950">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <Panel title="Appointments by Department" subtitle="Real-time breakdown">
        {analytics?.appointmentsByDept.length ? (
          <div className="grid gap-4">
            {analytics.appointmentsByDept.map((dept) => (
              <div key={dept.department} className="flex items-center gap-4">
                <p className="w-52 shrink-0 truncate text-sm font-bold text-slate-700">
                  {dept.department}
                </p>

                <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all"
                    style={{
                      width: `${
                        (dept.count /
                          analytics.appointmentsByDept[0].count) *
                        100
                      }%`,
                    }}
                  />
                </div>

                <p className="w-10 text-right font-black text-slate-900">
                  {dept.count}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            No appointments in the database yet.
          </p>
        )}
      </Panel>

      <Panel title="Staff by Role" subtitle="Current role distribution">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(
            users.reduce<Record<string, number>>((acc, user) => {
              const key = ROLE_LABELS[user.role] ?? user.role;
              acc[key] = (acc[key] || 0) + 1;
              return acc;
            }, {})
          )
            .sort((a, b) => b[1] - a[1])
            .map(([role, count]) => (
              <div
                key={role}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4"
              >
                <span className="font-bold text-slate-700">{role}</span>
                <span className="text-2xl font-black text-slate-950">
                  {count}
                </span>
              </div>
            ))}
        </div>
      </Panel>
    </div>
  );
}
