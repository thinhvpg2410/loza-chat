import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RTCView } from "react-native-webrtc";

import { AppAvatar } from "@ui/AppAvatar";
import { AppText } from "@ui/AppText";
import { useCall } from "@/features/call/call-context";
import { CallControls } from "./CallControls";

function useCallDuration(startedAt: Date | null): string {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const start = startedAt.getTime();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const s = (elapsed % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function CallScreen() {
  const {
    callState,
    localStream,
    remoteStreams,
    isMuted,
    isCameraOff,
    isSpeaker,
    endCall,
    leaveCall,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
  } = useCall();

  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const visible = callState.phase === "active" || callState.phase === "outgoing";

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

  const isActive = callState.phase === "active";
  const startedAt = isActive ? callState.startedAt : null;
  const duration = useCallDuration(startedAt);

  if (!visible) return null;

  const isGroup = callState.isGroup;
  const callType = callState.callType;
  const title = isActive ? callState.conversationTitle : callState.conversationTitle;
  const avatarUrl = isActive ? callState.conversationAvatarUrl : callState.conversationAvatarUrl;
  const participants = isActive ? callState.participants : [];

  const hasRemoteVideo = remoteStreams.length > 0 && callType === "video";
  const hasLocalVideo = callType === "video" && !!localStream && !isCameraOff;

  const primaryStream = remoteStreams[0]?.stream;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => (isGroup ? leaveCall() : endCall())}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Background: remote video or gradient */}
        {hasRemoteVideo && primaryStream ? (
          <RTCView
            streamURL={primaryStream.toURL()}
            style={StyleSheet.absoluteFill}
            objectFit="cover"
            mirror={false}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.voiceBg]} />
        )}

        {/* Dimming overlay for voice calls */}
        {!hasRemoteVideo ? <View style={[StyleSheet.absoluteFill, styles.overlay]} /> : null}

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <AppText variant="headline" style={styles.headerTitle} numberOfLines={1}>
            {title}
          </AppText>
          <AppText variant="subhead" style={styles.headerStatus}>
            {!isActive
              ? "Đang gọi..."
              : duration}
          </AppText>
        </View>

        {/* Voice call: show avatar in center */}
        {!hasRemoteVideo ? (
          <View style={styles.voiceCenter}>
            <AppAvatar uri={avatarUrl} name={title} size="xl" />
            {isActive && participants.length > 0 ? (
              <AppText variant="subhead" style={styles.participantNames}>
                {participants.map((p) => p.displayName).join(", ")}
              </AppText>
            ) : null}
          </View>
        ) : null}

        {/* Group: small remote tiles (grid) */}
        {isGroup && isActive && remoteStreams.length > 1 ? (
          <View style={styles.tileGrid}>
            {remoteStreams.slice(1).map((r) => (
              <RTCView
                key={r.peerId}
                streamURL={r.stream.toURL()}
                style={styles.tileItem}
                objectFit="cover"
              />
            ))}
          </View>
        ) : null}

        {/* Local video PiP */}
        {hasLocalVideo && localStream ? (
          <View style={[styles.pip, { bottom: 120 + insets.bottom }]}>
            <RTCView
              streamURL={localStream.toURL()}
              style={StyleSheet.absoluteFill}
              objectFit="cover"
              mirror
            />
          </View>
        ) : null}

        {/* Controls */}
        <View style={[styles.controls, { paddingBottom: insets.bottom }]}>
          <CallControls
            callType={callType}
            isMuted={isMuted}
            isCameraOff={isCameraOff}
            isSpeaker={isSpeaker}
            isGroup={isGroup}
            onToggleMute={toggleMute}
            onToggleCamera={toggleCamera}
            onToggleSpeaker={() => void toggleSpeaker()}
            onEnd={endCall}
            onLeave={leaveCall}
          />
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  voiceBg: {
    backgroundColor: "#16213e",
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  headerStatus: {
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
    fontSize: 14,
  },
  voiceCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  participantNames: {
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 4,
    gap: 4,
  },
  tileItem: {
    width: "48%",
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  pip: {
    position: "absolute",
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    zIndex: 20,
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
