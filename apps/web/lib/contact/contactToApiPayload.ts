/**
 * Build API body for `ContactOtpDto`: exactly one of `email` or `phoneNumber` (E.164).
 */
export function contactToApiPayload(input: string): { email?: string; phoneNumber?: string } | null {
  const s = input.trim();
  if (!s) {
    return null;
  }
  if (s.includes("@")) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
      return null;
    }
    return { email: s.toLowerCase() };
  }
  const digits = s.replace(/\D/g, "");
  if (digits.length < 9) {
    return null;
  }
  if (digits.startsWith("84")) {
    return { phoneNumber: `+${digits}` };
  }
  if (digits.startsWith("0")) {
    return { phoneNumber: `+84${digits.slice(1)}` };
  }
  if (s.startsWith("+")) {
    return { phoneNumber: `+${digits}` };
  }
  return null;
}

/**
 * Chuẩn hóa `identifier` đăng nhập: email → chữ thường; số điện thoại VN (09…, 84…) → E.164 (+84…).
 * Khớp với `parseLoginIdentifier` phía API.
 */
export function normalizeLoginIdentifierForApi(input: string): string {
  const s = input.trim();
  if (!s) {
    return s;
  }
  if (s.includes("@")) {
    return s.toLowerCase();
  }
  const payload = contactToApiPayload(s);
  if (payload?.phoneNumber) {
    return payload.phoneNumber;
  }
  if (payload?.email) {
    return payload.email;
  }
  return s;
}
