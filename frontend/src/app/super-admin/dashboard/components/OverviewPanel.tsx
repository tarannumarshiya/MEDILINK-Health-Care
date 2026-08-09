"use client";

import { Panel } from "@/components/dashboard/Panel";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
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
  appointmentsByDept: { department: string; count: number }[];
};

interface OverviewPanelProps {
  analytics: Analytics | null;
  users: Profile[];
}

export function OverviewPanel({ analytics, users }: OverviewPanelProps) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Total Patients",
            value: analytics?.totalPatients ?? 0,
            color: "bg-teal-500",
          },
          {
            label: "Total Staff",
            value: analytics?.totalStaff ?? 0,
            color: "bg-indigo-500",
          },
          {
            label: "Doctors",
            value: analytics?.totalDoctors ?? 0,
            color: "bg-blue-500",
          },
          {
            label: "Appointments",
            value: analytics?.totalAppointments ?? 0,
            color: "bg-purple-500",
          },
          {
            label: "Pending",
            value: analytics?.pendingAppointments ?? 0,
            color: "bg-orange-500",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.color} rounded-2xl p-6 text-white shadow-lg`}
          >
            <p className="text-sm font-bold text-white/80">
              {stat.label}
            </p>
            <p className="mt-2 text-4xl font-black tabular-nums">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Recently Joined Users" subtitle="Last 8 registered accounts">
          <div className="grid gap-3">
            {users.slice(0, 8).map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="font-bold text-slate-900">
                    {user.full_name ?? "—"}
                  </p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                  <StatusBadge
                    status={user.is_active ? "ACTIVE" : "INACTIVE"}
                  />
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">
                No users yet.
              </p>
            )}
          </div>
        </Panel>

        <Panel title="Appointments by Department" subtitle="Live distribution">
          {analytics?.appointmentsByDept.length ? (
            <div className="grid gap-3">
              {analytics.appointmentsByDept.map((dept) => (
                <div key={dept.department} className="flex items-center gap-3">
                  <p className="w-44 shrink-0 truncate text-sm font-bold text-slate-700">
                    {dept.department}
                  </p>

                  <div
                    role="progressbar"
                    aria-valuenow={dept.count}
                    aria-valuemin={0}
                    aria-valuemax={analytics.appointmentsByDept[0].count}
                    aria-label={`Appointments in ${dept.department}: ${dept.count}`}
                    className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100"
                  >
                    <div
                      className="h-full rounded-full bg-teal-500 transition-all"
                      style={{
                        width: `${
                          (dept.count /
                            analytics.appointmentsByDept[0].count) *
                          100
                        }%`,
                      }}
                    />
                  </div>

                  <p className="w-8 text-right text-sm font-black text-slate-700">
                    {dept.count}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              No appointment data yet.
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}
