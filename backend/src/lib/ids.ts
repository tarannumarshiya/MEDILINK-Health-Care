import { randomInt } from "node:crypto";

export function generatePatientCode(): string {
  return `PAT-${new Date().getFullYear()}-${randomInt(100000, 1000000)}`;
}

export function generateAppointmentCode(): string {
  return `APT-${new Date().getFullYear()}-${randomInt(100000, 1000000)}`;
}

export function generateInvoiceCode(): string {
  return `INV-${new Date().getFullYear()}-${randomInt(100000, 1000000)}`;
}
