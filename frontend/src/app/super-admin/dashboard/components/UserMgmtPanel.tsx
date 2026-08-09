"use client";

import { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { Panel } from "@/components/dashboard/Panel";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ROLE_LABELS } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

interface UserMgmtPanelProps {
  users: Profile[];
  setUsers: React.Dispatch<React.SetStateAction<Profile[]>>;
  saving: string | null;
  setSaving: (s: string | null) => void;
  load: (showLoader?: boolean) => Promise<void>;
  setMsg: (m: string) => void;
}

const staffRoles = [
  "SUPER_ADMIN",
  "HOSPITAL_ADMIN",
  "DEPARTMENT_ADMIN",
  "DOCTOR",
  "NURSE",
  "RECEPTIONIST",
  "LAB_ADMIN",
  "LAB_TECHNICIAN",
  "PHARMACY_ADMIN",
  "PHARMACIST",
  "INSURANCE_ADMIN",
  "SUPPORT_EXECUTIVE",
  "BILLING",
  "EMERGENCY",
  "TELEMEDICINE",
];

export function UserMgmtPanel({
  users,
  setUsers,
  saving,
  setSaving,
  load,
  setMsg,
}: UserMgmtPanelProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [creating, setCreating] = useState(false);

  const [staffForm, setStaffForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "DOCTOR",
  });

  const [staffErrors, setStaffErrors] = useState<Record<string, string>>({});

  async function toggleActive(user: Profile) {
    setSaving(user.id);
    setMsg("");

    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !user.is_active })
      .eq("id", user.id);

    if (error) {
      setMsg(error.message);
    } else {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: !u.is_active } : u
        )
      );

      setMsg(
        `${user.full_name ?? user.email} ${
          !user.is_active ? "activated" : "deactivated"
        }.`
      );
    }

    setSaving(null);
  }

  async function createStaff(e: React.FormEvent) {
    e.preventDefault();

    setStaffErrors({});
    const newErrors: Record<string, string> = {};

    if (!staffForm.full_name.trim() || staffForm.full_name.trim().length < 2) {
      newErrors.full_name = "Full name must be at least 2 characters.";
    } else if (!/^[A-Za-z\s.'-]+$/.test(staffForm.full_name.trim())) {
      newErrors.full_name = "Full name must contain only letters.";
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(staffForm.email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }

    if (staffForm.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (Object.keys(newErrors).length > 0) {
      setStaffErrors(newErrors);
      setMsg("Please fix the validation errors.");
      return;
    }

    setCreating(true);
    setMsg("");

    const supabase = createClient();

    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: staffForm.email,
      password: staffForm.password,
      options: {
        data: {
          full_name: staffForm.full_name,
          role: staffForm.role,
        },
      },
    });

    if (signUpErr || !data.user) {
      setMsg(signUpErr?.message ?? "Failed to create auth user.");
      setCreating(false);
      return;
    }

    const { error: profileErr } = await supabase.from("profiles").insert({
      id: data.user.id,
      full_name: staffForm.full_name,
      email: staffForm.email,
      role: staffForm.role,
      is_active: true,
    });

    if (profileErr) {
      setMsg(profileErr.message);
      setCreating(false);
      return;
    }

    setMsg(`Staff account created for ${staffForm.full_name}.`);

    setStaffForm({
      full_name: "",
      email: "",
      password: "",
      role: "DOCTOR",
    });

    await load(false);
    setCreating(false);
  }

  const filtered = users.filter((user) => {
    const q = search.toLowerCase();

    const matchSearch =
      !q ||
      (user.full_name ?? "").toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q);

    const matchRole =
      roleFilter === "ALL" ||
      user.role === roleFilter ||
      user.role === roleFilter.toLowerCase();

    return matchSearch && matchRole;
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <Panel title="All System Users" subtitle={`${users.length} total accounts`}>
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            className="h-10 min-w-[200px] flex-1 rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search users by name or email"
          />

          <select
            className="h-10 rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter users by role"
          >
            <option value="ALL">All Roles</option>

            {[
              "SUPER_ADMIN",
              "HOSPITAL_ADMIN",
              "DEPARTMENT_ADMIN",
              "DOCTOR",
              "NURSE",
              "RECEPTIONIST",
              "LAB_ADMIN",
              "LAB_TECHNICIAN",
              "PHARMACY_ADMIN",
              "PHARMACIST",
              "INSURANCE_ADMIN",
              "SUPPORT_EXECUTIVE",
              "PATIENT",
              "BILLING",
              "EMERGENCY",
              "TELEMEDICINE",
            ].map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role] ?? role}
              </option>
            ))}
          </select>

          <button
            onClick={() => load(true)}
            className="flex h-10 items-center gap-2 rounded-2xl border border-slate-300 px-4 text-sm font-bold text-slate-600 hover:border-teal-400 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            aria-label="Refresh user list"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-950 text-left text-white">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {user.full_name ?? "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-500">
                    {user.email}
                  </td>

                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge
                      status={user.is_active ? "ACTIVE" : "INACTIVE"}
                    />
                  </td>

                  <td className="px-4 py-3 text-slate-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>

                  <td className="px-4 py-3">
                    <button
                      disabled={saving === user.id}
                      onClick={() => toggleActive(user)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-black text-white transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        user.is_active
                          ? "bg-red-500 hover:bg-red-600 focus:ring-red-500"
                          : "bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500"
                      }`}
                      aria-label={`${user.is_active ? "Deactivate" : "Activate"} user ${user.full_name ?? user.email}`}
                    >
                      {saving === user.id
                        ? "…"
                        : user.is_active
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Create Staff Account" subtitle="Add a new staff member">
        <form onSubmit={createStaff} className="grid gap-4">
          {[
            {
              label: "Full Name",
              key: "full_name",
              type: "text",
              placeholder: "Dr. Jane Smith",
            },
            {
              label: "Email",
              key: "email",
              type: "email",
              placeholder: "staff@medilink.com",
            },
            {
              label: "Password",
              key: "password",
              type: "password",
              placeholder: "Min. 6 characters",
            },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label htmlFor={`staff_${key}`} className="text-xs font-black uppercase tracking-widest text-slate-500">
                {label}
              </label>

              <input
                required
                id={`staff_${key}`}
                type={type}
                minLength={key === "password" ? 6 : undefined}
                className={`mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 ${staffErrors[key] ? 'border-red-400 focus:border-red-400 bg-red-50' : ''}`}
                placeholder={placeholder}
                value={staffForm[key as keyof typeof staffForm]}
                onChange={(e) => {
                  setStaffForm({
                    ...staffForm,
                    [key]: e.target.value,
                  });
                  if (staffErrors[key]) setStaffErrors(prev => ({ ...prev, [key]: "" }));
                }}
              />
              {staffErrors[key] && <p className="mt-1 text-xs font-semibold text-red-500">{staffErrors[key]}</p>}
            </div>
          ))}

          <div>
            <label htmlFor="staff_role" className="text-xs font-black uppercase tracking-widest text-slate-500">
              Role
            </label>

            <select
              id="staff_role"
              className="mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              value={staffForm.role}
              onChange={(e) =>
                setStaffForm({
                  ...staffForm,
                  role: e.target.value,
                })
              }
            >
              {staffRoles.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role] ?? role}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 p-3 font-black text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:opacity-60"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create Staff Account"
            )}
          </button>
        </form>
      </Panel>
    </div>
  );
}
