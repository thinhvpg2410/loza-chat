import { getApiBaseUrl } from "@/lib/api/server";
import { LoginCenterLayout } from "@/components/auth/login-center-layout";

export default function LoginPage() {
  return <LoginCenterLayout apiEnabled={Boolean(getApiBaseUrl())} />;
}
