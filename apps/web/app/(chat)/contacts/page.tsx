export default function ContactsPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--zalo-chat-bg)] p-6">
      <h1 className="text-lg font-semibold text-[var(--zalo-text)]">Contacts</h1>
      <p className="mt-2 max-w-xl text-sm text-[var(--zalo-text-muted)]">
        Contact list and friend requests will appear here. This route exists for navigation shell
        testing only in Phase W1.
      </p>
    </main>
  );
}
