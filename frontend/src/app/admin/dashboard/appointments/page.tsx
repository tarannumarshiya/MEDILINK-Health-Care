import { redirect } from "next/navigation";

// Appointments tab is built into /admin/dashboard — redirect there
export default function AdminAppointmentsRedirectPage() {
  redirect("/admin/dashboard");
}
