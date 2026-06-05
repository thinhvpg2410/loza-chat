"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/common/Avatar";
import { useCall, type ParticipantInfo } from "@/components/call/call-context";

// ── Duration timer ────────────────────────────────────────────────────────────

function useTimer(startedAt: Date | null): string {
  const [s, setS] = useState(0);
  const [prevStartedAt, setPrevStartedAt] = useState(startedAt);

  if (startedAt !== prevStartedAt) {
    setPrevStartedAt(startedAt);
    if (!startedAt) {
      setS(0);
    }
  }

  useEffect(() => {
    if (!startedAt) return;
    const tick = () => setS(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${p(h)}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
}

// ── VideoTile ──────────────────────────────────────────────────────────────────

function VideoTile({
  stream,
  muted = false,
  label,
  isLocal = false,
  avatarName,
  className = "",
}: {
  stream: MediaStream | null;
  muted?: boolean;
  label?: string;
  isLocal?: boolean;
  avatarName?: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream) {
      el.srcObject = stream;
    } else {
      el.srcObject = null;
    }
  }, [stream]);

  const hasVideo = stream && stream.getVideoTracks().some((t) => t.enabled && t.readyState === "live");

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-gray-900 ${className}`}
    >
      {/* Video element always rendered so srcObject assignment works */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`h-full w-full object-cover transition-opacity duration-300 ${hasVideo ? "opacity-100" : "opacity-0"}`}
      />

      {/* Fallback avatar when no video */}
      {!hasVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          {avatarName ? (
            <Avatar name={avatarName} size="lg" className="!h-16 !w-16 !text-2xl opacity-80" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-white/10" />
          )}
        </div>
      )}

      {/* Name label */}
      {label && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
          <p className="text-[12px] font-medium text-white truncate">
            {isLocal ? `${label} (Bạn)` : label}
          </p>
        </div>
      )}
    </div>
  );
}

// ── AudioTile — renders <audio> to play remote stream ─────────────────────────

function AudioTile({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <audio ref={ref} autoPlay playsInline className="sr-only" />;
}

// ── Video grid layout calculation ─────────────────────────────────────────────

/**
 * Returns Tailwind grid-cols class for N tiles.
 * Max 9 participants → 3×3.
 */
function gridCols(n: number): string {
  if (n <= 1) return "grid-cols-1";
  if (n <= 2) return "grid-cols-2";
  if (n <= 4) return "grid-cols-2";
  if (n <= 6) return "grid-cols-3";
  return "grid-cols-3";
}

// ── Control button ─────────────────────────────────────────────────────────────

function Btn({
  on,
  onClass = "bg-white/15 hover:bg-white/25",
  offClass = "bg-white/30 ring-1 ring-white/30",
  danger = false,
  onClick,
  label,
  icon,
}: {
  on: boolean;
  onClass?: string;
  offClass?: string;
  danger?: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={label}
        className={`flex h-14 w-14 items-center justify-center rounded-full transition active:scale-90 ${
          danger ? "bg-red-500 hover:bg-red-600" : on ? onClass : offClass
        }`}
      >
        <span className="h-6 w-6 text-white">{icon}</span>
      </button>
      <span className="text-[11px] text-white/60 select-none">{label}</span>
    </div>
  );
}

// ── Main CallScreen ───────────────────────────────────────────────────────────

export function CallScreen() {
  const {
    callState,
    localStream,
    remoteStreams,
    isMuted,
    isCameraOff,
    endCall,
    leaveCall,
    toggleMute,
    toggleCamera,
  } = useCall();

  const [speakerOn, setSpeakerOn] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ringback tone while waiting for the remote party to answer
  useEffect(() => {
    if (callState.phase !== "outgoing") return;

    let stopped = false;
    let ctx: AudioContext | null = null;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const beep = (freq: number, duration: number, delay: number) => {
      if (stopped || !ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    };

    const playRingback = () => {
      if (stopped || !ctx) return;
      // Two-tone ringback: 440 Hz + 480 Hz, 2 s on / 4 s off
      beep(440, 2.0, 0);
      beep(480, 2.0, 0);
      timerId = setTimeout(playRingback, 6000);
    };

    try {
      ctx = new AudioContext();
      playRingback();
    } catch {
      /* ignore — browser blocked audio */
    }

    return () => {
      stopped = true;
      if (timerId) clearTimeout(timerId);
      void ctx?.close();
    };
  }, [callState.phase]);

  // Auto-hide controls after 4 s of inactivity (video mode)
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    const state = callState;
    if (state.phase === "active" && state.callType === "video") {
      hideTimer.current = setTimeout(() => setShowControls(false), 4000);
    }
  }, [callState]);

  useEffect(() => {
    queueMicrotask(() => resetHideTimer());
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [resetHideTimer]);

  const duration = useTimer(callState.phase === "active" ? callState.startedAt : null);

  if (callState.phase !== "outgoing" && callState.phase !== "active") return null;

  const isVideo = callState.callType === "video";
  const isOutgoing = callState.phase === "outgoing";
  const isGroup = callState.phase === "active" ? callState.isGroup : (callState as { isGroup: boolean }).isGroup ?? false;
  const title = callState.phase === "active" ? callState.conversationTitle : callState.conversationTitle;
  const avatarUrl = callState.phase === "active" ? callState.conversationAvatarUrl : callState.conversationAvatarUrl;
  const participants: ParticipantInfo[] = callState.phase === "active" ? callState.participants : [];

  // Group call: one tile per participant (including self)
  // 1-1: remote full + local PiP
  const totalTiles = remoteStreams.length + 1; // +1 for local

  const getParticipantName = (peerId: string) =>
    participants.find((p) => p.userId === peerId)?.displayName ?? peerId.slice(0, 8);

  // ── Video layout ───────────────────────────────────────────────────────────

  if (isVideo) {
    const is1on1 = !isGroup || remoteStreams.length <= 1;

    return (
      <div
        className="fixed inset-0 z-40 flex flex-col bg-black text-white select-none"
        onMouseMove={resetHideTimer}
        onClick={resetHideTimer}
      >
        {/* Remote audio (voice) */}
        {remoteStreams.map((rs) =>
          speakerOn ? <AudioTile key={rs.peerId} stream={rs.stream} /> : null,
        )}

        {/* ── 1-1 layout: remote full + local PiP ─────────────────────────── */}
        {is1on1 ? (
          <div className="relative flex-1 overflow-hidden">
            <VideoTile
              stream={remoteStreams[0]?.stream ?? null}
              avatarName={remoteStreams[0] ? getParticipantName(remoteStreams[0].peerId) : title}
              label={remoteStreams[0] ? getParticipantName(remoteStreams[0].peerId) : undefined}
              className="absolute inset-0 rounded-none"
            />

            {/* Waiting overlay */}
            {isOutgoing || remoteStreams.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50">
                <Avatar name={title} src={avatarUrl} size="lg" className="!h-24 !w-24 !text-3xl" />
                <p className="text-lg font-semibold">{title}</p>
                <p className="text-sm text-white/60 animate-pulse">
                  {isOutgoing ? "Đang gọi..." : "Đang kết nối..."}
                </p>
              </div>
            ) : null}

            {/* Local PiP */}
            <div className="absolute bottom-28 right-3 w-28 h-40 rounded-2xl overflow-hidden shadow-xl ring-2 ring-white/20">
              <VideoTile
                stream={localStream}
                muted
                avatarName="Bạn"
                label="Bạn"
                isLocal
                className="rounded-none"
              />
            </div>

            {/* Header */}
            <div
              className={`absolute inset-x-0 top-0 flex items-center gap-3 bg-gradient-to-b from-black/70 to-transparent px-4 pt-safe-top pb-8 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base truncate">{title}</p>
                <p className="text-sm text-white/60">{isOutgoing ? "Đang gọi..." : duration}</p>
              </div>
            </div>
          </div>
        ) : (
          /* ── Group layout: equal grid ───────────────────────────────────── */
          <div className="flex-1 overflow-hidden p-1.5">
            <div className={`grid h-full gap-1.5 ${gridCols(totalTiles)}`}>
              {/* Remote tiles */}
              {remoteStreams.map((rs) => (
                <VideoTile
                  key={rs.peerId}
                  stream={rs.stream}
                  avatarName={getParticipantName(rs.peerId)}
                  label={getParticipantName(rs.peerId)}
                />
              ))}
              {/* Local tile */}
              <VideoTile
                stream={localStream}
                muted
                avatarName="Bạn"
                label="Bạn"
                isLocal
              />
            </div>

            {/* Header overlay */}
            <div
              className={`absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-3 pb-6 bg-gradient-to-b from-black/60 to-transparent transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
            >
              <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-white/60">{duration} · {totalTiles} người</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Controls bar ──────────────────────────────────────────────── */}
        <div
          className={`flex items-center justify-center gap-5 px-6 py-4 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <Btn on={isMuted} onClick={toggleMute}
            label={isMuted ? "Bỏ tắt" : "Tắt mic"}
            icon={isMuted ? <MicOffIcon /> : <MicIcon />} />

          <Btn on={isCameraOff} onClick={toggleCamera}
            label={isCameraOff ? "Bật cam" : "Tắt cam"}
            icon={isCameraOff ? <CamOffIcon /> : <CamIcon />} />

          <Btn on={!speakerOn} onClick={() => setSpeakerOn((v) => !v)}
            label={speakerOn ? "Tắt loa" : "Bật loa"}
            icon={speakerOn ? <SpeakerIcon /> : <SpeakerOffIcon />} />

          {isGroup ? (
            <Btn on danger onClick={leaveCall} label="Rời đi" icon={<PhoneDownIcon />} />
          ) : (
            <Btn on danger onClick={endCall} label="Kết thúc" icon={<PhoneDownIcon />} />
          )}
        </div>
      </div>
    );
  }

  // ── Voice layout ────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-gradient-to-b from-[#1a1a2e] to-[#16213e] text-white">
      {/* Remote audio */}
      {remoteStreams.map((rs) =>
        speakerOn ? <AudioTile key={rs.peerId} stream={rs.stream} /> : null,
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6">
        {isGroup && participants.length > 0 ? (
          /* Group voice: avatar cluster */
          <div className="flex flex-wrap justify-center gap-3 max-w-xs">
            {participants.map((p) => (
              <div key={p.userId} className="flex flex-col items-center gap-1">
                <Avatar
                  name={p.displayName}
                  src={p.avatarUrl ?? undefined}
                  size="md"
                  online={remoteStreams.some((r) => r.peerId === p.userId)}
                />
                <p className="text-[11px] text-white/70 max-w-[56px] truncate text-center">
                  {p.displayName}
                </p>
              </div>
            ))}
            {/* Self */}
            <div className="flex flex-col items-center gap-1">
              <Avatar name="Bạn" size="md" />
              <p className="text-[11px] text-white/70">Bạn</p>
            </div>
          </div>
        ) : (
          /* 1-1 voice */
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar name={title} src={avatarUrl} size="lg" className="!h-28 !w-28 !text-4xl" />
              {!isOutgoing && remoteStreams.length > 0 && (
                <span className="absolute inset-0 rounded-full animate-ping bg-green-400/20" />
              )}
            </div>
            <p className="text-2xl font-bold">{title}</p>
          </div>
        )}

        <p className="text-base text-white/60 font-medium">
          {isOutgoing
            ? "Đang gọi..."
            : remoteStreams.length === 0
              ? "Đang kết nối..."
              : duration}
        </p>

        {/* Audio wave animation */}
        {!isOutgoing && remoteStreams.length > 0 && (
          <div className="flex items-end gap-1 h-10">
            {[4, 7, 5, 9, 6, 8, 4, 7, 5].map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-indigo-400/70 animate-pulse"
                style={{ height: `${h * 4}px`, animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 px-8 py-8">
        <Btn on={isMuted} onClick={toggleMute}
          label={isMuted ? "Bỏ tắt" : "Tắt mic"}
          icon={isMuted ? <MicOffIcon /> : <MicIcon />} />

        <Btn on={!speakerOn} onClick={() => setSpeakerOn((v) => !v)}
          label={speakerOn ? "Tắt loa" : "Bật loa"}
          icon={speakerOn ? <SpeakerIcon /> : <SpeakerOffIcon />} />

        {isGroup ? (
          <Btn on danger onClick={leaveCall} label="Rời đi" icon={<PhoneDownIcon />} />
        ) : (
          <Btn on danger onClick={endCall} label="Kết thúc" icon={<PhoneDownIcon />} />
        )}
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function MicIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
  </svg>;
}

function MicOffIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
    <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
  </svg>;
}

function CamIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
  </svg>;
}

function CamOffIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
    <path d="M21 6.5l-4-4-9.86 9.86L21 6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2zM15 17H5V7.27l1.84 1.84L15 18v-1z"/>
  </svg>;
}

function SpeakerIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
  </svg>;
}

function SpeakerOffIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
  </svg>;
}

function PhoneDownIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.51-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
  </svg>;
}
