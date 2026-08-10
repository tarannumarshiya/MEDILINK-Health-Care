function getSecureRandom6Digit(): number {
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return 100000 + (array[0] % 900000);
  }
  return 100000 + (Date.now() % 900000);
}

export function generatePatientCode(): string {
  return `PAT-${new Date().getFullYear()}-${getSecureRandom6Digit()}`;
}

export function generateAppointmentCode(): string {
  return `APT-${new Date().getFullYear()}-${getSecureRandom6Digit()}`;
}

export function generateInvoiceCode(): string {
  return `INV-${new Date().getFullYear()}-${getSecureRandom6Digit()}`;
}