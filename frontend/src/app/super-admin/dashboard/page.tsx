"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Users,
  ShieldCheck,
  FileText,
  Loader2,
  RefreshCw,
  ClipboardList,
  Database,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/apiFetch";
import {
  DashboardShell,
  type TabItem,
} from "@/components/dashboard/DashboardShell";
import { Panel } from "@/components/dashboard/Panel";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { mockRolePermissionMatrix, mockAuditLogs } from "@/lib/mock/superadmin";
import { ROLE_LABELS } from "@/lib/roles";
import { OverviewPanel } from "./components/OverviewPanel";
import { UserMgmtPanel } from "./components/UserMgmtPanel";
import { AuditLogsPanel } from "./components/AuditLogsPanel";
import { RoleMatrixPanel } from "./components/RoleMatrixPanel";
import { AnalyticsPanel } from "./components/AnalyticsPanel";
import { PaymentSettingsPanel } from "./components/PaymentSettingsPanel";

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

type AuditLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  detail: string;
  created_at: string;
  actor_name?: string;
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

type AppointmentRow = {
  id: string;
  department: string | null;
  status: string | null;
};

type InvoiceRow = {
  id: string;
  total: number | null;
  status: string | null;
};

type DashboardData = {
  profiles: Profile[];
  auditLogs: AuditLog[];
  analytics: Analytics;
};

type Tab = "overview" | "users" | "audit" | "roles" | "analytics" | "schema" | "settings";

const tabs: TabItem[] = [
  {
    label: "Overview",
    value: "overview",
    icon: <BarChart3 className="h-[18px] w-[18px]" />,
  },
  {
    label: "User Mgmt",
    value: "users",
    icon: <Users className="h-[18px] w-[18px]" />,
  },
  {
    label: "Audit Logs",
    value: "audit",
    icon: <ClipboardList className="h-[18px] w-[18px]" />,
  },
  {
    label: "Role Matrix",
    value: "roles",
    icon: <ShieldCheck className="h-[18px] w-[18px]" />,
  },
  {
    label: "Analytics",
    value: "analytics",
    icon: <FileText className="h-[18px] w-[18px]" />,
  },
  {
    label: "DB Schema",
    value: "schema",
    icon: <Database className="h-[18px] w-[18px]" />,
  },
  {
    label: "Settings",
    value: "settings",
    icon: <Settings className="h-[18px] w-[18px]" />,
  },
];

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

async function fetchSuperAdminDashboardData(): Promise<DashboardData> {
  const supabase = createClient();

  const [
    profilesRes,
    patientsRes,
    appointmentsRes,
    invoicesRes,
    paymentsRes,
    doctorsRes,
    auditRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role, is_active, created_at")
      .order("created_at", { ascending: false }),

    supabase.from("patients").select("id", {
      count: "exact",
      head: true,
    }),

    supabase.from("appointments").select("id, department, status"),

    supabase.from("invoices").select("id, total, status"),

    supabase.from("payments").select("amount").in("status", ["SUCCESS", "COMPLETED"]),

    supabase.from("doctors").select("id", {
      count: "exact",
      head: true,
    }),

    supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const profiles = (profilesRes.data ?? []) as Profile[];
  const appointments = (appointmentsRes.data ?? []) as AppointmentRow[];
  const invoices = (invoicesRes.data ?? []) as InvoiceRow[];
  const payments = (paymentsRes.data ?? []) as { amount: number }[];
  const logs = (auditRes.data ?? []) as AuditLog[];

  const deptMap: Record<string, number> = {};

  appointments.forEach((appointment) => {
    if (appointment.department) {
      deptMap[appointment.department] =
        (deptMap[appointment.department] || 0) + 1;
    }
  });

  const appointmentsByDept = Object.entries(deptMap)
    .map(([department, count]) => ({
      department,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const totalRevenue = payments.reduce(
    (sum, payment) => sum + Number(payment.amount ?? 0),
    0
  );

  const totalDoctors =
    doctorsRes.count ??
    profiles.filter(
      (profile) => profile.role === "doctor" || profile.role === "DOCTOR"
    ).length;

  const totalStaff = profiles.filter(
    (profile) => profile.role !== "patient" && profile.role !== "PATIENT"
  ).length;

  const pendingAppointments = appointments.filter(
    (appointment) =>
      appointment.status === "pending" || appointment.status === "PENDING"
  ).length;

  const unpaidInvoices = invoices.filter(
    (invoice) => invoice.status === "UNPAID" || invoice.status === "unpaid"
  ).length;

  return {
    profiles,
    auditLogs: logs.length > 0 ? logs : mockAuditLogs,
    analytics: {
      totalPatients: patientsRes.count ?? 0,
      totalDoctors,
      totalStaff,
      totalAppointments: appointments.length,
      pendingAppointments,
      totalInvoices: invoices.length,
      unpaidInvoices,
      totalRevenue,
      appointmentsByDept,
    },
  };
}

export default function SuperAdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const [users, setUsers] = useState<Profile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAuthAndLoad() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.location.replace("/login"); return; }
        const { data: profile } = await supabase
          .from("profiles").select("role, is_active").eq("id", user.id).single();
        if (!profile || profile.role !== "SUPER_ADMIN" || !profile.is_active) {
          window.location.replace("/login"); return;
        }
        const dashboardData = await fetchSuperAdminDashboardData();
        if (cancelled) return;
        setUsers(dashboardData.profiles);
        setAuditLogs(dashboardData.auditLogs);
        setAnalytics(dashboardData.analytics);
      } catch {
        if (cancelled) return;
        setMsg("Failed to load dashboard data. Please refresh and try again.");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    checkAuthAndLoad();

    return () => {
      cancelled = true;
    };
  }, []);

  async function load(showLoader = false) {
    if (showLoader) setLoading(true);

    try {
      const dashboardData = await fetchSuperAdminDashboardData();

      setUsers(dashboardData.profiles);
      setAuditLogs(dashboardData.auditLogs);
      setAnalytics(dashboardData.analytics);
    } catch {
      setMsg("Failed to load dashboard data. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <DashboardShell
      portalName="Super Admin"
      portalSubtitle="System Control Center"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as Tab)}
      liveSummary={[
        { label: "Total Users", value: users.length },
        {
          label: "Active",
          value: users.filter((user) => user.is_active).length,
        },
        {
          label: "Appointments",
          value: analytics?.totalAppointments ?? 0,
        },
        {
          label: "Pending",
          value: analytics?.pendingAppointments ?? 0,
        },
      ]}
    >
      {msg && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-teal-200 bg-teal-50 px-5 py-3 text-sm font-bold text-teal-800">
          {msg}
          <button
            onClick={() => setMsg("")}
            className="ml-4 text-teal-500 hover:text-teal-700"
          >
            ✕
          </button>
        </div>
      )}

      {activeTab === "overview" && (
        <OverviewPanel analytics={analytics} users={users} />
      )}

      {activeTab === "users" && (
        <UserMgmtPanel
          users={users}
          setUsers={setUsers}
          saving={saving}
          setSaving={setSaving}
          load={load}
          setMsg={setMsg}
        />
      )}

      {activeTab === "audit" && (
        <AuditLogsPanel auditLogs={auditLogs} load={load} />
      )}

      {activeTab === "roles" && (
        <RoleMatrixPanel />
      )}

      {activeTab === "schema" && (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-8 text-center shadow-[var(--shadow-md)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]">
            <Database className="h-7 w-7 text-white" />
          </div>

          <h2 className="text-2xl font-black text-[var(--ink)]">
            Database Schema Explorer
          </h2>

          <p className="mt-2 text-[var(--ink-2)]">
            Interactive viewer for all 18 core tables — columns, types, foreign
            keys, RLS policies, indexes and relationships.
          </p>

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {["18 Tables", "Multi-hospital SaaS", "RBAC + RLS", "Audit Trail"].map(
              (tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-black text-[var(--primary)]"
                >
                  {tag}
                </span>
              )
            )}
          </div>

          <Link
            href="/super-admin/dashboard/schema"
            className="btn-primary mt-6 inline-flex items-center gap-2 rounded-2xl px-8 py-4 font-black text-white"
          >
            <Database className="h-5 w-5" />
            Open Schema Explorer
          </Link>
        </div>
      )}

      {activeTab === "analytics" && (
        <AnalyticsPanel analytics={analytics} users={users} />
      )}

      {activeTab === "settings" && (
        <div className="animate-fade-rise">
          <PaymentSettingsPanel />
        </div>
      )}
    </DashboardShell>
  );
}
