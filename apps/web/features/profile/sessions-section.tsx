"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { revokeSessionAction, logoutAllDevicesAction } from "@/features/profile/session-actions";
import type { SessionsSettingsLoad } from "@/lib/profile/load-sessions";
import type { WebUserSession } from "@/lib/types/session";

const headingClass =
  "text-[11px] font-semibold uppercase tracking-wide text-[var(--zalo-text-muted)]";

function platformLabel(platform: string): string {
  const p = platform.toLowerCase();
  if (p === "web") return "Web";
  if (p === "ios") return "iOS";
  if (p === "android") return "Android";
  return platform;
}

function formatLastSeen(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(d);
  } catch {
    return iso;
  }
}

function sessionTitle(s: WebUserSession): string {
  const name = s.deviceName?.trim();
  if (name) return name;
  return `${platformLabel(s.platform)} · v${s.appVersion}`;
}

function SessionRow({
  session,
  onRevoke,
  pending,
  disabled,
}: {
  session: WebUserSession;
  onRevoke: (id: string, isCurrent: boolean) => void;
  pending: boolean;
  disabled: boolean;
}) {
  return (
    <li className="rounded-lg border border-[var(--zalo-border-soft)] bg-white px-3.5 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-[var(--zalo-text)]">{sessionTitle(session)}</p>
            {session.isCurrent ? (
              <span className="shrink-0 rounded bg-[var(--zalo-blue)]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--zalo-blue)]">
                Thiết bị này
              </span>
            ) : null}
            {session.isTrusted ? (
              <span className="shrink-0 rounded bg-[var(--zalo-surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--zalo-text-muted)]">
                Đã tin cậy
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-[var(--zalo-text-muted)]">
            {platformLabel(session.platform)} · v{session.appVersion} · Hoạt động {formatLastSeen(session.lastSeenAt)}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={disabled || pending}
          className="shrink-0 border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50"
          onClick={() => onRevoke(session.id, session.isCurrent)}
        >
          {pending ? "Đang thu hồi…" : "Thu hồi"}
        </Button>
      </div>
    </li>
  );
}

type SessionsSectionProps = {
  load: SessionsSettingsLoad;
};

export function SessionsSection({ load }: SessionsSectionProps) {
  const router = useRouter();
  const [revokePendingId, setRevokePendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [allPending, startLogoutAll] = useTransition();

  if (load.kind === "mock") {
    return (
      <div>
        <h2 className={headingClass}>Phiên đăng nhập</h2>
        <p className="mt-3 text-sm text-[var(--zalo-text-muted)]">
          Đăng nhập qua API để xem và quản lý thiết bị đăng nhập tại đây.
        </p>
      </div>
    );
  }

  if (load.kind === "error") {
    return (
      <div>
        <h2 className={headingClass}>Phiên đăng nhập</h2>
        <p className="mt-3 text-sm text-red-600/90" role="alert">
          {load.message}
        </p>
      </div>
    );
  }

  const sessions = load.sessions;

  const handleRevoke = async (sessionId: string, isCurrent: boolean) => {
    const message = isCurrent
      ? "Thu hồi phiên trên thiết bị này? Bạn sẽ đăng xuất khỏi trình duyệt này."
      : "Thu hồi phiên đăng nhập trên thiết bị này?";
    if (!window.confirm(message)) return;

    setActionError(null);
    setRevokePendingId(sessionId);
    try {
      const r = await revokeSessionAction(sessionId, isCurrent);
      if (r.error) {
        setActionError(r.error);
      } else if (!isCurrent) {
        router.refresh();
      }
    } finally {
      setRevokePendingId(null);
    }
  };

  const handleLogoutAll = () => {
    if (
      !window.confirm(
        "Đăng xuất tất cả thiết bị và phiên trên trình duyệt này? Bạn cần đăng nhập lại ở mọi nơi, kể cả điện thoại.",
      )
    ) {
      return;
    }
    setActionError(null);
    startLogoutAll(() => {
      void logoutAllDevicesAction();
    });
  };

  return (
    <div>
      <h2 className={headingClass}>Phiên đăng nhập</h2>
      <p className="mt-2 text-xs text-[var(--zalo-text-subtle)]">
        Mỗi dòng là một thiết bị đang đăng nhập. Thu hồi sẽ hủy làm mới phiên trên thiết bị đó; mã truy cập có thể còn hiệu lực trong thời gian ngắn.
      </p>

      {actionError ? (
        <p className="mt-3 text-sm text-red-600/90" role="alert">
          {actionError}
        </p>
      ) : null}

      {sessions.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--zalo-text-muted)]">Không có phiên đăng nhập đang hoạt động.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {sessions.map((s) => (
            <SessionRow
              key={s.id}
              session={s}
              pending={revokePendingId === s.id}
              disabled={revokePendingId !== null && revokePendingId !== s.id}
              onRevoke={handleRevoke}
            />
          ))}
        </ul>
      )}

      <div className="mt-5">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={allPending || revokePendingId !== null}
          className="border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50"
          onClick={handleLogoutAll}
        >
          {allPending ? "Đang xử lý…" : "Đăng xuất tất cả thiết bị"}
        </Button>
      </div>
    </div>
  );
}
