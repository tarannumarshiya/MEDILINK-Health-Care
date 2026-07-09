export function getDashboardRoute(role: string): string {
  const r = role.toUpperCase();
  if (["SUPER_ADMIN"].includes(r))                                          return "/super-admin/dashboard";
  if (["HOSPITAL_ADMIN","ADMIN","DEPARTMENT_ADMIN"].includes(r))            return "/admin/dashboard";
  if (["DOCTOR"].includes(r))                                               return "/doctor/queue";
  if (["LAB_ADMIN","LAB_TECHNICIAN","TESTER"].includes(r))                  return "/lab/queue";
  if (["PHARMACY_ADMIN","PHARMACIST"].includes(r))                          return "/pharmacy/queue";
  if (["RECEPTIONIST","RECEPTION","NURSE","SUPPORT_EXECUTIVE"].includes(r)) return "/reception/dashboard";
  if (["BILLING"].includes(r))                                              return "/billing/dashboard";
  if (["INSURANCE_ADMIN","INSURANCE"].includes(r))                          return "/insurance/dashboard";
  if (["EMERGENCY"].includes(r))                                            return "/emergency/dashboard";
  if (["TELEMEDICINE"].includes(r))                                         return "/telemedicine/dashboard";
  if (["PATIENT"].includes(r))                                              return "/patient/dashboard";
  return "/login";
}
