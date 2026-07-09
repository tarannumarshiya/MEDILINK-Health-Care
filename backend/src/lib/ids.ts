export function generatePatientCode(): string {
  return `PAT-${new Date().getFullYear()}-${Math.floor(
    100000 + Math.random() * 900000
  )}`;
}

export function generateAppointmentCode(): string {
  return `APT-${new Date().getFullYear()}-${Math.floor(
    100000 + Math.random() * 900000
  )}`;
}

export function generateInvoiceCode(): string {
  return `INV-${new Date().getFullYear()}-${Math.floor(
    100000 + Math.random() * 900000
  )}`;
}
