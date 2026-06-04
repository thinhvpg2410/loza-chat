"use client";

import { useEffect } from "react";
import { Avatar } from "@/components/common/Avatar";
import { useCall } from "@/components/call/call-context";

export function IncomingCallModal() {
  const { callState, answerCall } = useCall();
  const isIncoming = callState.phase === "incoming";

  // Web-Audio ringtone (no file dependency)
  useEffect(() => {
    if (!isIncoming) return;

    let stopped = false;
    let ctx: AudioContext | null = null;

    const beep = () => {
      if (stopped || !ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 520;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    };

    try {
      ctx = new AudioContext();
      beep();
      const id = setInterval(beep, 2500);
      return () => {
        stopped = true;
        clearInterval(id);
        void ctx?.close();
      };
    } catch {
      return () => { stopped = true; };
    }
  }, [isIncoming]);

  if (!isIncoming) return null;

  const { callerName, callerAvatarUrl, callType, isGroup, totalInvited } = callState;

  const callLabel =
    callType === "video"
      ? isGroup
        ? "Cuộc gọi video nhóm"
        : "Cuộc gọi video đến"
      : isGroup
        ? "Cuộc gọi thoại nhóm"
        : "Cuộc gọi thoại đến";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm rounded-t-3xl sm:rounded-2xl bg-[#1c1c2e] px-8 py-8 shadow-2xl text-white animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-250">
        {/* Call type label */}
        <p className="text-center text-sm font-medium text-indigo-300 tracking-wide mb-5">
          {callLabel}
          {isGroup && totalInvited > 1 && (
            <span className="ml-1 text-white/50">· {totalInvited} người được mời</span>
          )}
        </p>

        {/* Caller avatar */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="relative">
            <Avatar name={callerName} src={callerAvatarUrl ?? undefined} size="lg"
              className="!h-20 !w-20 !text-3xl ring-4 ring-indigo-500/40" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full animate-ping bg-indigo-500/20" />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{callerName}</p>
            {isGroup && (
              <p className="text-sm text-white/50 mt-0.5">đang bắt đầu cuộc gọi nhóm</p>
            )}
          </div>
        </div>

        {/* Ripple dots */}
        <div className="flex justify-center gap-1.5 mb-7">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-white/30 animate-bounce"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => void answerCall(false)}
            className="flex flex-1 flex-col items-center gap-2 rounded-2xl bg-red-500/20 py-4 text-red-400 transition hover:bg-red-500/30 active:scale-95"
            aria-label="Từ chối"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500">
              <PhoneXIcon className="h-6 w-6 text-white" />
            </span>
            <span className="text-sm font-medium">Từ chối</span>
          </button>

          <button
            type="button"
            onClick={() => void answerCall(true)}
            className="flex flex-1 flex-col items-center gap-2 rounded-2xl bg-green-500/20 py-4 text-green-400 transition hover:bg-green-500/30 active:scale-95"
            aria-label="Chấp nhận"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
              {callType === "video" ? (
                <VideoIcon className="h-6 w-6 text-white" />
              ) : (
                <PhoneIcon className="h-6 w-6 text-white" />
              )}
            </span>
            <span className="text-sm font-medium">Chấp nhận</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.28-.28.7-.36 1.06-.22 1.16.4 2.42.62 3.74.62.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.32.22 2.58.62 3.74.14.36.06.78-.22 1.06L6.6 10.8z"/>
    </svg>
  );
}

function PhoneXIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.71 16.67C20.66 13.78 16.54 12 12 12 7.46 12 3.34 13.78.29 16.67c-.18.18-.29.43-.29.68 0 .26.11.51.29.68l2.48 2.48c.18.18.43.29.69.29.28 0 .54-.12.71-.33.57-.75 1.23-1.42 1.96-1.99.26-.2.41-.51.41-.83V15.1c1.33-.49 2.76-.75 4.26-.75 1.5 0 2.93.26 4.26.75v2.55c0 .32.15.63.41.83.73.57 1.39 1.24 1.96 1.99.17.21.43.33.71.33.26 0 .51-.11.69-.29l2.48-2.48c.18-.18.29-.43.29-.69 0-.25-.1-.5-.28-.67z"/>
      <path d="M15.5 5.5L14.09 4.09 12 6.17 9.91 4.09 8.5 5.5 10.58 7.58 8.5 9.66l1.41 1.41L12 9.0l2.09 2.07L15.5 9.66 13.42 7.58z"/>
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
    </svg>
  );
}
