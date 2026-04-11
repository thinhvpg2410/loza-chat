import { loadProfileForSettings } from "@/lib/profile/load-profile";
import { ProfileSettingsForm } from "@/features/profile/profile-settings-form";

export default async function SettingsPage() {
  let load;
  try {
    load = await loadProfileForSettings();
  } catch {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--zalo-chat-bg)] p-6">
        <h1 className="text-lg font-semibold text-[var(--zalo-text)]">Cài đặt</h1>
        <p className="mt-2 text-sm text-red-600/90" role="alert">
          Không tải được hồ sơ. Kiểm tra phiên đăng nhập hoặc kết nối API.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--zalo-chat-bg)] p-6">
      <h1 className="text-lg font-semibold text-[var(--zalo-text)]">Cài đặt</h1>
      <div className="mt-6">
        <ProfileSettingsForm load={load} />
      </div>
    </main>
  );
}
