"use client";

import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createQrLoginSessionAction,
  pollQrLoginStatusAction,
} from "@/features/auth/qr-login-actions";
import { buildWebQrLoginPayload } from "@/lib/auth/qr-login-payload";

const POLL_MS = 2500;

function formatCountdownSeconds(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function QrLoginPanel() {
  const router = useRouter();
  const stoppedRef = useRef(false);
  const pollInFlightRef = useRef(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [expiresAtIso, setExpiresAtIso] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [qrExpired, setQrExpired] = useState(false);
  const [pollPhase, setPollPhase] = useState<"pending" | "scanned">("pending");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [creating, setCreating] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deadReason, setDeadReason] = useState<"rejected" | "not_found" | null>(null);
  const [staleDelivered, setStaleDelivered] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const bootstrap = useCallback(async () => {
    stoppedRef.current = false;
    setCreating(true);
    setCreateError(null);
    setDeadReason(null);
    setQrExpired(false);
    setSecondsLeft(null);
    setStaleDelivered(false);
    setLoggingIn(false);
    setSessionToken(null);
    setExpiresAtIso(null);
    setPollPhase("pending");
    setQrDataUrl(null);
    const r = await createQrLoginSessionAction();
    if (stoppedRef.current) return;
    setCreating(false);
    if (!r.ok) {
      setCreateError(r.error);
      return;
    }
    setSessionToken(r.sessionToken);
    setExpiresAtIso(r.expiresAtIso);
  }, []);

  useEffect(() => {
    void bootstrap();
    return () => {
      stoppedRef.current = true;
    };
  }, [bootstrap]);

  useEffect(() => {
    if (!sessionToken) return;
    let cancelled = false;
    const payload = buildWebQrLoginPayload(sessionToken);
    void QRCode.toDataURL(payload, { margin: 2, width: 220, errorCorrectionLevel: "M" }).then(
      (url) => {
        if (!cancelled) setQrDataUrl(url);
      },
      () => {
        if (!cancelled) setCreateError("Không tạo được hình mã QR.");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [sessionToken]);

  useEffect(() => {
    if (!expiresAtIso || qrExpired || !sessionToken) return;
    const expMs = new Date(expiresAtIso).getTime();
    if (Number.isNaN(expMs)) return;

    const tick = () => {
      const left = Math.max(0, Math.ceil((expMs - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        stoppedRef.current = true;
        setQrExpired(true);
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAtIso, sessionToken, qrExpired]);

  useEffect(() => {
    if (!sessionToken || deadReason || staleDelivered || loggingIn || qrExpired) return;

    const tick = async () => {
      if (stoppedRef.current || pollInFlightRef.current) return;
      pollInFlightRef.current = true;
      try {
        const r = await pollQrLoginStatusAction(sessionToken);
        if (stoppedRef.current) return;
        if (r.kind === "network") return;
        if (r.kind === "active") {
          setPollPhase(r.phase);
          setExpiresAtIso(r.expiresAtIso);
          return;
        }
        if (r.kind === "stop") {
          stoppedRef.current = true;
          if (r.reason === "expired") {
            setQrExpired(true);
            return;
          }
          setDeadReason(r.reason);
          return;
        }
        if (r.kind === "already_delivered") {
          stoppedRef.current = true;
          setStaleDelivered(true);
          return;
        }
        if (r.kind === "logged_in") {
          stoppedRef.current = true;
          setLoggingIn(true);
          router.refresh();
          router.push("/");
        }
      } finally {
        pollInFlightRef.current = false;
      }
    };

    void tick();
    const id = setInterval(() => void tick(), POLL_MS);
    return () => clearInterval(id);
  }, [sessionToken, deadReason, staleDelivered, loggingIn, qrExpired, router]);

  if (creating) {
    return (
      <div className="flex flex-col items-center">
        <h2 className="mb-6 text-center text-base font-semibold text-[var(--zalo-text)]">
          Đăng nhập qua mã QR
        </h2>
        <div
          className="flex h-56 w-56 items-center justify-center rounded-lg border border-[var(--zalo-border-soft)] bg-white sm:h-60 sm:w-60"
          aria-busy
        >
          <p className="text-sm text-[var(--zalo-text-muted)]">Đang tạo mã…</p>
        </div>
        <p className="mt-6 max-w-xs text-center text-xs leading-relaxed text-[var(--zalo-text-muted)]">
          Mở ứng dụng Loza Chat trên điện thoại và quét mã để đăng nhập trên web.
        </p>
      </div>
    );
  }

  if (createError) {
    return (
      <div className="flex flex-col items-center">
        <h2 className="mb-6 text-center text-base font-semibold text-[var(--zalo-text)]">
          Đăng nhập qua mã QR
        </h2>
        <p className="mb-4 max-w-xs text-center text-sm text-red-600">{createError}</p>
        <button
          type="button"
          onClick={() => void bootstrap()}
          className="rounded-lg bg-[var(--zalo-blue)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Thử lại
        </button>
        <p className="mt-6 max-w-xs text-center text-xs text-[var(--zalo-text-muted)]">
          Chỉ dùng để đăng nhập Loza Chat trên máy tính.
        </p>
      </div>
    );
  }

  if (staleDelivered) {
    return (
      <div className="flex flex-col items-center">
        <h2 className="mb-6 text-center text-base font-semibold text-[var(--zalo-text)]">
          Đăng nhập qua mã QR
        </h2>
        <p className="mb-4 max-w-xs text-center text-sm text-[var(--zalo-text-muted)]">
          Phiên này đã được xử lý. Nếu trình duyệt chưa đăng nhập, hãy tạo mã mới hoặc vào trang chủ.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => void bootstrap()}
            className="rounded-lg bg-[var(--zalo-blue)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Tạo mã mới
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-lg border border-[var(--zalo-border-soft)] px-4 py-2 text-sm font-medium text-[var(--zalo-text)] transition hover:bg-[var(--zalo-surface)]"
          >
            Trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (deadReason) {
    const msg =
      deadReason === "rejected"
        ? "Đăng nhập đã bị từ chối trên điện thoại."
        : "Phiên không còn hiệu lực.";
    return (
      <div className="flex flex-col items-center">
        <h2 className="mb-6 text-center text-base font-semibold text-[var(--zalo-text)]">
          Đăng nhập qua mã QR
        </h2>
        <p className="mb-4 max-w-xs text-center text-sm text-[var(--zalo-text-muted)]">{msg}</p>
        <button
          type="button"
          onClick={() => void bootstrap()}
          className="rounded-lg bg-[var(--zalo-blue)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Tạo mã mới
        </button>
        <p className="mt-6 max-w-xs text-center text-xs text-[var(--zalo-text-muted)]">
          Chỉ dùng để đăng nhập Loza Chat trên máy tính.
        </p>
      </div>
    );
  }

  if (loggingIn) {
    return (
      <div className="flex flex-col items-center">
        <h2 className="mb-6 text-center text-base font-semibold text-[var(--zalo-text)]">
          Đăng nhập qua mã QR
        </h2>
        <p className="text-sm text-[var(--zalo-text-muted)]">Đang đăng nhập…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <h2 className="mb-6 text-center text-base font-semibold text-[var(--zalo-text)]">
        Đăng nhập qua mã QR
      </h2>
      <div className="relative flex h-56 w-56 items-center justify-center overflow-hidden rounded-lg border border-[var(--zalo-border-soft)] bg-white p-2 sm:h-60 sm:w-60">
        {qrDataUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL from qrcode */}
            <img
              src={qrDataUrl}
              alt="Mã QR đăng nhập web"
              className={`h-full w-full object-contain transition-[filter,opacity] duration-200 ${qrExpired ? "pointer-events-none blur-sm opacity-45" : ""}`}
            />
            {qrExpired ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/55 px-3 backdrop-blur-[2px]">
                <p className="text-center text-sm font-medium text-[var(--zalo-text)]">Mã QR đã hết hạn</p>
                <button
                  type="button"
                  onClick={() => void bootstrap()}
                  className="rounded-lg bg-[var(--zalo-blue)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
                >
                  Làm mới mã QR
                </button>
              </div>
            ) : null}
          </>
        ) : qrExpired ? (
          <div className="flex flex-col items-center justify-center gap-3 px-3 text-center">
            <p className="text-sm font-medium text-[var(--zalo-text)]">Mã QR đã hết hạn</p>
            <button
              type="button"
              onClick={() => void bootstrap()}
              className="rounded-lg bg-[var(--zalo-blue)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
            >
              Làm mới mã QR
            </button>
          </div>
        ) : (
          <p className="text-sm text-[var(--zalo-text-muted)]">Đang tạo mã…</p>
        )}
      </div>
      {!qrExpired ? (
        <>
          <p className="mt-4 max-w-xs text-center text-sm text-[var(--zalo-text)]">
            {pollPhase === "scanned"
              ? "Đã quét. Xác nhận đăng nhập trên điện thoại."
              : "Quét mã bằng ứng dụng Loza Chat trên điện thoại."}
          </p>
          {secondsLeft !== null && secondsLeft > 0 ? (
            <p className="mt-2 text-center text-sm tabular-nums text-[var(--zalo-text)]">
              Hết hạn sau <span className="font-semibold">{formatCountdownSeconds(secondsLeft)}</span>
            </p>
          ) : expiresAtIso ? (
            <p className="mt-2 text-center text-sm text-[var(--zalo-text-muted)]">Đang đồng bộ thời gian…</p>
          ) : null}
          <p className="mt-2 text-center text-[11px] text-[var(--zalo-text-subtle)]">
            Không chia sẻ mã cho người khác.
          </p>
        </>
      ) : (
        <p className="mt-4 max-w-xs text-center text-xs text-[var(--zalo-text-muted)]">
          Tạo mã mới để tiếp tục đăng nhập.
        </p>
      )}
      <p className="mt-4 max-w-xs text-center text-xs leading-relaxed text-[var(--zalo-text-muted)]">
        Mở ứng dụng Loza Chat → quét mã QR này để đăng nhập trên web.
      </p>
      <p className="mt-3 text-center text-[11px] text-[var(--zalo-text-subtle)]">
        Chỉ dùng để đăng nhập Loza Chat trên máy tính.
      </p>
    </div>
  );
}
