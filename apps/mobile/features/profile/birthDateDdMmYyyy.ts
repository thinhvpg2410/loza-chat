/**
 * Sinh nhật hiển thị/nhập: dd-mm-yyyy; API: yyyy-mm-dd (ISO date).
 */

/** Gõ số, tự chèn dấu gạch (dd-mm-yyyy). */
export function formatBirthDigitsInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

/** Chuỗi dd-mm-yyyy (có hoặc không có gạch) → yyyy-mm-dd hoặc null. */
export function ddMmYyyyToIso(formatted: string): string | null {
  const t = formatted.replace(/\D/g, "");
  if (t.length !== 8) return null;
  const day = parseInt(t.slice(0, 2), 10);
  const month = parseInt(t.slice(2, 4), 10);
  const year = parseInt(t.slice(4, 8), 10);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) return null;
  const dt = new Date(year, month - 1, day);
  if (Number.isNaN(dt.getTime())) return null;
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null;
  const y = dt.getFullYear();
  const m = dt.getMonth() + 1;
  const d = dt.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** yyyy-mm-dd → dd-mm-yyyy */
export function isoToDdMmYyyy(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/i.exec(iso.trim());
  if (!m) return "";
  const [, y, mo, d] = m;
  return `${d}-${mo}-${y}`;
}

/** Date (local) từ picker → yyyy-mm-dd */
export function localDateToIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** yyyy-mm-dd → Date local noon (tránh lệch timezone khi mở picker) */
export function isoDateToLocalDate(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/i.exec(iso.trim());
  if (!m) return new Date();
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10) - 1;
  const d = parseInt(m[3], 10);
  return new Date(y, mo, d, 12, 0, 0, 0);
}
