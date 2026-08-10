import crypto from "crypto";

export function generatePatientCode(): string {
  const num = crypto.randomInt(100000, 1000000);
  return `PAT-${new Date().getFullYear()}-${num}`;
}

export function generateAppointmentCode(): string {
  const num = crypto.randomInt(100000, 1000000);
  return `APT-${new Date().getFullYear()}-${num}`;
}

export function generateInvoiceCode(): string {
  const num = crypto.randomInt(100000, 1000000);
  return `INV-${new Date().getFullYear()}-${num}`;
}
