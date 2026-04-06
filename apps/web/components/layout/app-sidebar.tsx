"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppLogo } from "@/components/common/app-logo";
import { IconChat, IconContacts, IconGrid, IconSettings } from "@/components/chat/icons";
import { SignOutButton } from "@/features/auth/sign-out-button";

type NavItem = {
  href: string;
  label: string;
  icon: typeof IconChat;
  match: (pathname: string) => boolean;
};

const items: NavItem[] = [
  {
    href: "/",
    label: "Chat",
    icon: IconChat,
    match: (p) => p === "/",
  },
  {
    href: "/friends",
    label: "Friends",
    icon: IconContacts,
    match: (p) => p === "/friends" || p.startsWith("/friends/"),
  },
  {
    href: "/groups",
    label: "Groups",
    icon: IconGrid,
    match: (p) => p === "/groups" || p.startsWith("/groups/"),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: IconSettings,
    match: (p) => p === "/settings" || p.startsWith("/settings/"),
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex w-16 shrink-0 flex-col items-center border-r border-white/10 bg-[var(--zalo-blue)] py-3"
      aria-label="Main navigation"
    >
      <div className="mb-3 shrink-0">
        <AppLogo size="sm" variant="onBrand" />
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={
                active
                  ? "flex h-11 w-11 items-center justify-center rounded-md bg-white/20 text-white"
                  : "flex h-11 w-11 items-center justify-center rounded-md text-white/85 transition hover:bg-white/10 hover:text-white"
              }
            >
              <Icon className="h-6 w-6" aria-hidden />
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto shrink-0 pt-2">
        <SignOutButton />
      </div>
    </aside>
  );
}
