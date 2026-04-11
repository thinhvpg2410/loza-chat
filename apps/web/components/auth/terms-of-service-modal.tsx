"use client";

import { useEffect, useId } from "react";
import { IconClose } from "@/components/chat/icons";

type TermsOfServiceModalProps = {
  open: boolean;
  onClose: () => void;
};

export function TermsOfServiceModal({ open, onClose }: TermsOfServiceModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Đóng"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] flex max-h-[min(85dvh,520px)] w-full max-w-[420px] flex-col overflow-hidden rounded-xl border border-[var(--zalo-border)] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--zalo-border)] px-4 py-3">
          <h2 id={titleId} className="text-[15px] font-semibold text-[var(--zalo-text)]">
            Điều khoản và dịch vụ
          </h2>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--zalo-text-muted)] transition hover:bg-black/[0.06]"
            onClick={onClose}
            title="Đóng"
          >
            <IconClose className="h-[18px] w-[18px]" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-sm leading-relaxed text-[var(--zalo-text)]">
          <p className="mb-3 text-[var(--zalo-text-muted)]">
            Cập nhật gần nhất: tháng 4/2026. Vui lòng đọc kỹ trước khi sử dụng Loza Chat.
          </p>
          <section className="mb-4">
            <h3 className="mb-1.5 font-semibold text-[var(--zalo-text)]">1. Chấp nhận điều khoản</h3>
            <p className="text-[var(--zalo-text)]/90">
              Khi tạo tài khoản và sử dụng dịch vụ, bạn đồng ý tuân thủ các điều khoản này và các chính sách liên
              quan (bao gồm quyền riêng tư) do Loza Chat ban hành.
            </p>
          </section>
          <section className="mb-4">
            <h3 className="mb-1.5 font-semibold text-[var(--zalo-text)]">2. Tài khoản và bảo mật</h3>
            <p className="text-[var(--zalo-text)]/90">
              Bạn chịu trách nhiệm bảo mật thông tin đăng nhập. Thông báo ngay cho chúng tôi nếu nghi ngờ tài khoản bị
              truy cập trái phép. Bạn cam kết cung cấp thông tin chính xác khi đăng ký.
            </p>
          </section>
          <section className="mb-4">
            <h3 className="mb-1.5 font-semibold text-[var(--zalo-text)]">3. Hành vi được phép</h3>
            <p className="text-[var(--zalo-text)]/90">
              Không sử dụng dịch vụ cho mục đích vi phạm pháp luật, quấy rối, phát tán nội dung có hại, spam hoặc xâm
              phạm quyền của người khác. Chúng tôi có quyền giới hạn hoặc chấm dứt quyền sử dụng nếu vi phạm.
            </p>
          </section>
          <section className="mb-4">
            <h3 className="mb-1.5 font-semibold text-[var(--zalo-text)]">4. Nội dung và dịch vụ</h3>
            <p className="text-[var(--zalo-text)]/90">
              Dịch vụ được cung cấp theo khả năng sẵn có. Chúng tôi có thể cập nhật, tạm ngưng hoặc thay đổi tính năng
              để cải thiện trải nghiệm và bảo đảm an toàn hệ thống.
            </p>
          </section>
          <section>
            <h3 className="mb-1.5 font-semibold text-[var(--zalo-text)]">5. Liên hệ</h3>
            <p className="text-[var(--zalo-text)]/90">
              Mọi thắc mắc về điều khoản, vui lòng liên hệ bộ phận hỗ trợ qua kênh chính thức của ứng dụng.
            </p>
          </section>
        </div>
        <div className="shrink-0 border-t border-[var(--zalo-border)] bg-[var(--zalo-surface)] px-4 py-3">
          <button
            type="button"
            className="h-10 w-full rounded-lg bg-[var(--zalo-blue)] text-sm font-semibold text-white transition hover:bg-[#0056d6]"
            onClick={onClose}
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
