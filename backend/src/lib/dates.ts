/**
 * Strict YYYY-MM-DD calendar-date validation.
 *
 * `new Date("2026-02-31")` silently rolls over to March 3 in V8, so an
 * isNaN check alone is not enough. Re-parse the components and confirm the
 * round-trip survives, rejecting overflow dates such as 2026-02-31 or
 * 2023-02-29 that Postgres would otherwise reject at insert time.
 */
export function isValidYmdDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}