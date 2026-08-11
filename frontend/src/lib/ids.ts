export function secureRandomInt(min: number, max: number): number {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error(
      "Cryptographically secure random number generation is unavailable."
    );
  }

  const range = max - min;

  if (
    !Number.isSafeInteger(min) ||
    !Number.isSafeInteger(max) ||
    range <= 0 ||
    range > 0x100000000
  ) {
    throw new RangeError("Invalid secure random integer range.");
  }

  const maxUint32 = 0x100000000;
  const limit = maxUint32 - (maxUint32 % range);
  const array = new Uint32Array(1);

  let value: number;

  do {
    globalThis.crypto.getRandomValues(array);
    value = array[0];
  } while (value >= limit);

  return min + (value % range);
}

export function generatePatientCode() {
  return `PAT-${new Date().getFullYear()}-${secureRandomInt(100000, 1000000)}`;
}

export function generateAppointmentCode() {
  return `APT-${new Date().getFullYear()}-${secureRandomInt(100000, 1000000)}`;
}

export function generateInvoiceCode() {
  return `INV-${new Date().getFullYear()}-${secureRandomInt(100000, 1000000)}`;
}
