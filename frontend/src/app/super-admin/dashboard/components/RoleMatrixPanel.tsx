"use client";

import { Panel } from "@/components/dashboard/Panel";
import { mockRolePermissionMatrix } from "@/lib/mock/superadmin";
import { ROLE_LABELS } from "@/lib/roles";

export function RoleMatrixPanel() {
  return (
    <Panel
      title="Role Permission Matrix"
      subtitle="Module access per role — system reference"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-950 text-left text-xs text-white">
              <th className="px-4 py-3">Module</th>

              {[
                "SUPER_ADMIN",
                "HOSPITAL_ADMIN",
                "DEPARTMENT_ADMIN",
                "DOCTOR",
                "LAB_ADMIN",
                "PHARMACY_ADMIN",
                "PATIENT",
              ].map((role) => (
                <th key={role} className="px-4 py-3">
                  {ROLE_LABELS[role] ?? role}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {mockRolePermissionMatrix.map((row, index) => (
              <tr
                key={row.module}
                className={`border-b border-slate-100 ${
                  index % 2 === 0 ? "bg-white" : "bg-slate-50"
                }`}
              >
                <td className="px-4 py-3 font-bold text-slate-900">
                  {row.module}
                </td>

                {[
                  row.SUPER_ADMIN,
                  row.ADMIN,
                  row.DOCTOR,
                  row.TESTER,
                  row.PHARMACIST,
                  row.EMERGENCY,
                  row.PATIENT,
                ].map((value, idx) => (
                  <td
                    key={idx}
                    className={`px-4 py-3 font-bold ${
                      value === "Manage"
                        ? "text-emerald-600"
                        : value === "View"
                        ? "text-blue-600"
                        : value === "Monitor"
                        ? "text-purple-600"
                        : "text-slate-300"
                    }`}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
