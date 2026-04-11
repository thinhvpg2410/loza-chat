/** Kiểm tra email đơn giản (có @ và domain; khớp hướng dùng backend khi đăng nhập bằng email). */
export function isLoginEmailFormat(raw: string): boolean {
  const t = raw.trim();
  return t.length >= 5 && t.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}
