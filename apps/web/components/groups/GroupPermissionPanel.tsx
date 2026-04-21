"use client";

import type { ApiGroupDetail } from "@/lib/chat/api-dtos";
import type { GroupPermissionFlags } from "@/lib/types/groups";

type GroupPermissionPanelProps = {
  detail: ApiGroupDetail;
  permissions: GroupPermissionFlags;
  busy: boolean;
  error: string | null;
  onPatchSettings: (patch: Partial<ApiGroupDetail["settings"]>) => void;
};

const row =
  "flex items-center justify-between gap-3 rounded-md border border-[var(--zalo-border)]/70 bg-white px-2.5 py-2 text-[12px]";

export function GroupPermissionPanel({
  detail,
  permissions,
  busy,
  error,
  onPatchSettings,
}: GroupPermissionPanelProps) {
  const s = detail.settings;
  if (!permissions.canChangeSettings) {
    return (
      <section className="mt-2 space-y-1.5 rounded-md border border-[var(--zalo-border)]/70 bg-[var(--zalo-surface)] px-2.5 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--zalo-text-muted)]">
          Quyền nhóm
        </p>
        <ul className="space-y-1 text-[12px] text-[var(--zalo-text-muted)]">
          <li>• Chỉ trưởng/phó chat: {s.onlyAdminsCanPost ? "Bật" : "Tắt"}</li>
          <li>• Duyệt vào nhóm: {s.joinApprovalRequired ? "Bật" : "Tắt"}</li>
          <li>• Phó/Trưởng thu hồi tin người khác: {s.moderatorsCanRecallMessages ? "Bật" : "Tắt"}</li>
        </ul>
      </section>
    );
  }

  return (
    <section className="mt-2 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--zalo-text-muted)]">
        Cấu hình quyền (trưởng nhóm)
      </p>
      {error ? (
        <p className="rounded-md bg-red-50 px-2 py-1.5 text-[12px] text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <label className={row}>
        <span className="text-[var(--zalo-text)]">Chỉ trưởng nhóm / phó được gửi tin</span>
        <input
          type="checkbox"
          className="h-4 w-4 accent-[var(--zalo-blue)]"
          checked={s.onlyAdminsCanPost}
          disabled={busy}
          onChange={(e) => onPatchSettings({ onlyAdminsCanPost: e.target.checked })}
        />
      </label>
      <label className={row}>
        <span className="text-[var(--zalo-text)]">Cần duyệt khi vào nhóm</span>
        <input
          type="checkbox"
          className="h-4 w-4 accent-[var(--zalo-blue)]"
          checked={s.joinApprovalRequired}
          disabled={busy}
          onChange={(e) => onPatchSettings({ joinApprovalRequired: e.target.checked })}
        />
      </label>
      <label className={row}>
        <span className="text-[var(--zalo-text)]">Trưởng/phó được thu hồi tin của TV</span>
        <input
          type="checkbox"
          className="h-4 w-4 accent-[var(--zalo-blue)]"
          checked={Boolean(s.moderatorsCanRecallMessages)}
          disabled={busy}
          onChange={(e) => onPatchSettings({ moderatorsCanRecallMessages: e.target.checked })}
        />
      </label>
      <label className={row}>
        <span className="text-[var(--zalo-text)]">Chỉ trưởng/phó thêm thành viên</span>
        <input
          type="checkbox"
          className="h-4 w-4 accent-[var(--zalo-blue)]"
          checked={s.onlyAdminsCanAddMembers}
          disabled={busy}
          onChange={(e) => onPatchSettings({ onlyAdminsCanAddMembers: e.target.checked })}
        />
      </label>
      <label className={row}>
        <span className="text-[var(--zalo-text)]">Chỉ trưởng/phó xóa thành viên</span>
        <input
          type="checkbox"
          className="h-4 w-4 accent-[var(--zalo-blue)]"
          checked={s.onlyAdminsCanRemoveMembers}
          disabled={busy}
          onChange={(e) => onPatchSettings({ onlyAdminsCanRemoveMembers: e.target.checked })}
        />
      </label>
    </section>
  );
}
