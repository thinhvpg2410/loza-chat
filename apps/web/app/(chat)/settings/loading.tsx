export default function SettingsLoading() {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--zalo-chat-bg)] p-6">
      <h1 className="text-lg font-semibold text-[var(--zalo-text)]">Cài đặt</h1>
      <p className="mt-6 text-sm text-[var(--zalo-text-muted)]" aria-busy>
        Đang tải hồ sơ…
      </p>
    </main>
  );
}
