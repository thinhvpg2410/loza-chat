"use client";

import { useMemo, useState } from "react";
import { IconAdd } from "@/components/chat/icons";
import { SearchInput } from "@/components/common/SearchInput";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import { GroupInfoPanel } from "@/components/groups/GroupInfoPanel";
import { GroupListRow } from "@/components/groups/GroupListRow";
import {
  mockGroupMembersByGroupId,
  mockGroups,
  mockSelectableMembersForGroup,
} from "@/lib/mock-social";
import type { GroupMember, GroupSummary } from "@/lib/types/social";

export function GroupsWorkspace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(mockGroups[0]?.id ?? null);
  const [groups, setGroups] = useState<GroupSummary[]>(() => [...mockGroups]);
  const [membersByGroup, setMembersByGroup] = useState<Record<string, GroupMember[]>>(
    () => ({ ...mockGroupMembersByGroupId }),
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [createGroupKey, setCreateGroupKey] = useState(0);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, searchQuery]);

  const selected = selectedId ? groups.find((g) => g.id === selectedId) ?? null : null;
  const members = selectedId ? membersByGroup[selectedId] ?? [] : [];

  const toggleMute = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, muted: !g.muted } : g)),
    );
  };

  return (
    <>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <section
          className="flex w-[min(100%,var(--zalo-conversation-width))] min-w-[280px] max-w-[360px] shrink-0 flex-col border-r border-[var(--zalo-border)] bg-[var(--zalo-surface)]"
          aria-label="Danh sách nhóm"
        >
          <header className="shrink-0 border-b border-[var(--zalo-border)] bg-white px-2.5 pb-2 pt-2.5">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <h1 className="text-[15px] font-semibold text-[var(--zalo-text)]">Nhóm</h1>
                <p className="text-[11px] text-[var(--zalo-text-muted)]">Nhóm chat của bạn</p>
              </div>
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--zalo-text-muted)] transition hover:bg-black/[0.06] hover:text-[var(--zalo-text)]"
                title="Tạo nhóm"
                onClick={() => {
                  setCreateGroupKey((k) => k + 1);
                  setCreateOpen(true);
                }}
              >
                <IconAdd className="h-[18px] w-[18px]" />
              </button>
            </div>
            <div className="mt-2">
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nhóm"
              />
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5">
            {filtered.length === 0 ? (
              <p className="px-2 py-10 text-center text-[13px] text-[var(--zalo-text-muted)]">
                Không có nhóm phù hợp
              </p>
            ) : (
              <div className="flex flex-col gap-px">
                {filtered.map((g) => (
                  <GroupListRow
                    key={g.id}
                    group={g}
                    isActive={selectedId === g.id}
                    onSelect={setSelectedId}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section
          className="flex min-w-0 flex-1 flex-col bg-[var(--zalo-chat-bg)]"
          aria-label="Nội dung nhóm"
        >
          {selected ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
              <p className="max-w-md text-center text-[14px] font-semibold text-[var(--zalo-text)]">
                {selected.name}
              </p>
              <p className="mt-2 max-w-md text-center text-[13px] text-[var(--zalo-text-muted)]">
                Khung chat nhóm sẽ nối vào Phase chat thread sau. Hiện tại xem thông tin nhóm ở cột
                bên phải.
              </p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
              <p className="text-center text-[13px] text-[var(--zalo-text-muted)]">
                Chọn một nhóm để xem thông tin.
              </p>
            </div>
          )}
        </section>

        {selected ? (
          <GroupInfoPanel
            group={selected}
            members={members}
            onMuteToggle={() => selectedId && toggleMute(selectedId)}
            onSearchMessages={() => {}}
            onManageMembers={() => {}}
            onAddMember={() => {}}
            onLeave={() => {
              if (!selectedId) return;
              setGroups((g) => g.filter((x) => x.id !== selectedId));
              setMembersByGroup((m) => {
                const next = { ...m };
                delete next[selectedId];
                return next;
              });
              setSelectedId(null);
            }}
            onPromoteMember={() => {}}
            onDemoteMember={() => {}}
            onRemoveMember={() => {}}
          />
        ) : null}
      </div>

      <CreateGroupModal
        key={createGroupKey}
        open={createOpen}
        selectableMembers={mockSelectableMembersForGroup}
        onClose={() => setCreateOpen(false)}
        onCreate={({ name, memberIds }) => {
          const id = `g-${Date.now()}`;
          const nextGroup: GroupSummary = {
            id,
            name,
            memberCount: memberIds.length + 1,
            lastMessagePreview: "Nhóm mới được tạo",
            lastMessageAt: "Vừa xong",
            muted: false,
          };
          setGroups((g) => [nextGroup, ...g]);
          setMembersByGroup((prev) => ({
            ...prev,
            [id]: [
              {
                id: "gm-new",
                userId: "me",
                displayName: "Bạn",
                username: "ban",
                role: "owner",
                online: true,
              },
              ...memberIds.map((mid, i) => ({
                id: `gm-${i}-${mid}`,
                userId: mid,
                displayName: mockSelectableMembersForGroup.find((f) => f.id === mid)?.displayName ?? "Thành viên",
                username: mockSelectableMembersForGroup.find((f) => f.id === mid)?.username ?? "member",
                role: "member" as const,
                online: !!mockSelectableMembersForGroup.find((f) => f.id === mid)?.isOnline,
              })),
            ],
          }));
          setSelectedId(id);
        }}
      />
    </>
  );
}
