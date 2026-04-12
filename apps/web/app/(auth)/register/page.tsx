import Link from "next/link";
import { getApiBaseUrl } from "@/lib/api/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterWizard } from "@/features/auth/register-wizard";

export default function RegisterPage() {
  if (!getApiBaseUrl()) {
    return (
      <AuthShell title="Đăng ký" subtitle="Cần cấu hình backend" showLoginLink={false}>
        <p className="text-center text-sm leading-relaxed text-[var(--zalo-text-muted)]">
          Thiết lập biến môi trường <span className="font-mono text-[var(--zalo-text)]">LOZA_API_BASE_URL</span> để đăng ký
          tài khoản qua web.
        </p>
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="font-medium text-[var(--zalo-blue)] hover:underline">
            ← Quay lại đăng nhập
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Đăng ký" subtitle="Tạo tài khoản Loza Chat">
      <RegisterWizard />
    </AuthShell>
  );
}
