/**
 * Validates Bangladeshi mobile numbers.
 * Accepts all common formats:
 *   01XXXXXXXXX          (11 digits, trunk prefix)
 *   +8801XXXXXXXXX       (ITU format with +)
 *   8801XXXXXXXXX        (ITU format without +)
 *   +880 01XXX XXXXXX    (spaced, with redundant trunk prefix)
 *   +880 1XXX XXXXXX     (spaced, without trunk prefix)
 * Valid operator prefixes: 013–019 (Grameenphone, Robi, Banglalink, Teletalk, Airtel)
 */
export function validateBDPhone(phone: string): boolean {
  let raw = phone.trim().replace(/[\s\-()]/g, "");

  if (raw.startsWith("+880")) {
    const after = raw.slice(4);
    raw = after.startsWith("0") ? after : "0" + after;
  } else if (raw.startsWith("880") && raw.length >= 13) {
    const after = raw.slice(3);
    raw = after.startsWith("0") ? after : "0" + after;
  }

  const digits = raw.replace(/\D/g, "");
  return digits.length === 11 && /^01[3-9]\d{8}$/.test(digits);
}

export function validateAppointmentForm(form: {
  full_name: string; phone: string; age: string;
  department: string; preferred_date: string;
}): string {
  if (!form.full_name.trim() || form.full_name.trim().length < 2)
    return "Full name must be at least 2 characters.";
  if (!validateBDPhone(form.phone))
    return "Enter a valid Bangladeshi number (e.g. 01XXXXXXXXX or +8801XXXXXXXXX).";
  const age = Number(form.age);
  if (!form.age || isNaN(age) || age < 1 || age > 120)
    return "Enter a valid age (1–120).";
  if (!form.department) return "Please select a department.";
  if (!form.preferred_date) return "Please select a preferred date.";
  const selected = new Date(form.preferred_date);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (selected < today) return "Preferred date cannot be in the past.";
  return "";
}

export function validateContactForm(form: {
  full_name: string; email: string; phone: string; subject: string; message: string;
}): string {
  if (!form.full_name.trim() || form.full_name.trim().length < 2)
    return "Full name must be at least 2 characters.";
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(form.email.trim()))
    return "Enter a valid email address.";
  if (form.phone && !validateBDPhone(form.phone))
    return "Enter a valid Bangladeshi phone number (e.g. 01XXXXXXXXX) or leave it empty.";
  if (!form.subject.trim() || form.subject.trim().length < 3)
    return "Subject must be at least 3 characters.";
  if (!form.message.trim() || form.message.trim().length < 10)
    return "Message must be at least 10 characters.";
  return "";
}

export function validateLoginForm(email: string, password: string): string {
  if (!email.trim()) return "Email is required.";
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email.trim())) return "Enter a valid lowercase email address.";
  if (!password) return "Password is required.";
  if (password.length < 6) return "Password must be at least 6 characters.";
  return "";
}

export function validateRegisterForm(form: {
  full_name: string; email: string; phone: string;
  age: string; password: string; gender: string;
}): string {
  const name = form.full_name.trim();
  if (!name || name.length < 2) return "Full name must be at least 2 characters.";
  if (!/^[A-Za-z\s.'-]+$/.test(name)) return "Full name must contain only letters.";
  if (name.length > 50) return "Full name must not exceed 50 characters.";
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email.trim()))
    return "Enter a valid email address.";
  if (!validateBDPhone(form.phone))
    return "Enter a valid Bangladeshi number (e.g. 01XXXXXXXXX or +8801XXXXXXXXX).";
  const age = Number(form.age);
  if (!form.age || isNaN(age) || age < 1 || age > 120)
    return "Enter a valid age (1–120).";
  if (!form.gender) return "Please select a gender.";
  if (form.password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password))
    return "Password must contain letters and at least one number.";
  return "";
}
