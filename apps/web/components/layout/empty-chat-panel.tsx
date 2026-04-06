type EmptyChatPanelProps = {
  title?: string;
  description?: string;
};

export function EmptyChatPanel({
  title = "Select a conversation",
  description = "Choose a chat from the list to start messaging. The conversation view will appear here in a later phase.",
}: EmptyChatPanelProps) {
  return (
    <section
      className="flex min-w-0 flex-1 flex-col bg-[var(--zalo-chat-bg)]"
      aria-label="Conversation"
    >
      <header className="flex h-12 shrink-0 items-center border-b border-[var(--zalo-border)] bg-white px-4">
        <span className="text-sm font-medium text-[var(--zalo-text-muted)]">Messages</span>
      </header>
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-10">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-md border border-[var(--zalo-border)] bg-white text-2xl text-[var(--zalo-text-muted)]">
            💬
          </div>
          <h2 className="text-base font-semibold text-[var(--zalo-text)]">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--zalo-text-muted)]">{description}</p>
        </div>
      </div>
    </section>
  );
}
