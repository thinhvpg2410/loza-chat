import Link from "next/link";
import { getApiBaseUrl } from "@/lib/api/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordWizard } from "@/features/auth/forgot-password-wizard";

export default function ForgotPasswordPage() {
  if (!getApiBaseUrl()) {
    return (
      <AuthShell title="Quên mật khẩu" subtitle="Cần backend" showLoginLink={false}>
        
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="font-medium text-[var(--zalo-blue)] hover:underline">
            ← Quay lại đăng nhập
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Quên mật khẩu" subtitle="Đặt lại mật khẩu bằng OTP">
      <ForgotPasswordWizard />
    </AuthShell>
  );
}
