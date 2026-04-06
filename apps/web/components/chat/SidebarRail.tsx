"use client";

import { IconChat, IconContacts, IconDiscover, IconGrid } from "@/components/chat/icons";

type RailItem = {
  id: string;
  label: string;
  icon: typeof IconChat;
  active?: boolean;
};

const items: RailItem[] = [
  { id: "chat", label: "Tin nhắn", icon: IconChat, active: true },
  { id: "contacts", label: "Danh bạ", icon: IconContacts },
  { id: "discover", label: "Khám phá", icon: IconDiscover },
  { id: "more", label: "Thêm", icon: IconGrid },
];

export function SidebarRail() {
  return (
    <aside
      className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-white/10 bg-[var(--zalo-blue)] py-3"
      aria-label="Điều hướng chính"
    >
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-sm font-bold text-white">
        Z
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              className={
                item.active
                  ? "flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white"
                  : "flex h-11 w-11 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/10 hover:text-white"
              }
            >
              <Icon className="h-6 w-6" aria-hidden />
              <span className="sr-only">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
