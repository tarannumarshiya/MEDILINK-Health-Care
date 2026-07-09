export function generatePatientCode() {
  return `PAT-${new Date().getFullYear()}-${Math.floor(
    100000 + Math.random() * 900000
  )}`;
}

export function generateAppointmentCode() {
  return `APT-${new Date().getFullYear()}-${Math.floor(
    100000 + Math.random() * 900000
  )}`;
}

export function generateInvoiceCode() {
  return `INV-${new Date().getFullYear()}-${Math.floor(
    100000 + Math.random() * 900000
  )}`;
}