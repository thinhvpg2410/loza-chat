/**
 * Call sound & vibration utilities.
 *
 * Ringtone files cần đặt tại:
 *   apps/mobile/assets/sounds/ringtone.mp3  — chuông cho callee (incoming)
 *   apps/mobile/assets/sounds/ringback.mp3  — tone chờ cho caller (outgoing)
 *
 * Nếu file chưa có, vibration vẫn chạy (silent fallback).
 */

import { Audio } from "expo-av";
import { Vibration, Platform } from "react-native";

// Vibration pattern: [delay, vibrate, pause, vibrate, pause...]
const INCOMING_PATTERN = [0, 800, 400, 800, 1200];
const OUTGOING_PATTERN = [0, 300, 700];

let ringtoneSound: Audio.Sound | null = null;
let ringbackSound: Audio.Sound | null = null;

async function loadAndPlay(
  soundRef: { current: Audio.Sound | null },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  asset: any,
  loop: boolean,
): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    const { sound } = await Audio.Sound.createAsync(asset, {
      isLooping: loop,
      volume: 1.0,
      shouldPlay: true,
    });
    soundRef.current = sound;
  } catch {
    // File not found or playback failed — vibration-only fallback
  }
}

async function stopSound(soundRef: { current: Audio.Sound | null }): Promise<void> {
  if (!soundRef.current) return;
  try {
    await soundRef.current.stopAsync();
    await soundRef.current.unloadAsync();
  } catch {
    /* ignore */
  }
  soundRef.current = null;
}

const ringSoundRef = { current: ringtoneSound };
const ringbackSoundRef = { current: ringbackSound };

export async function startIncomingRingtone(): Promise<void> {
  Vibration.vibrate(INCOMING_PATTERN, true);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const asset = require("../../assets/sounds/ringtone.mp3");
    await loadAndPlay(ringSoundRef, asset, true);
  } catch {
    // asset missing — vibration only
  }
}

export async function stopIncomingRingtone(): Promise<void> {
  Vibration.cancel();
  await stopSound(ringSoundRef);
}

export async function startOutgoingRingback(): Promise<void> {
  if (Platform.OS === "android") {
    // Subtle pulse vibration on Android for ringback
    Vibration.vibrate(OUTGOING_PATTERN, true);
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const asset = require("../../assets/sounds/ringback.mp3");
    await loadAndPlay(ringbackSoundRef, asset, true);
  } catch {
    // asset missing — no sound
  }
}

export async function stopOutgoingRingback(): Promise<void> {
  if (Platform.OS === "android") {
    Vibration.cancel();
  }
  await stopSound(ringbackSoundRef);
}

export async function stopAllCallSounds(): Promise<void> {
  Vibration.cancel();
  await Promise.all([stopSound(ringSoundRef), stopSound(ringbackSoundRef)]);
}
