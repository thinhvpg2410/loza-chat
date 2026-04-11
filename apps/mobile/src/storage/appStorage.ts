import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * AsyncStorage có thể lỗi "Native module is null" trên Expo Go / bản iOS lệch SDK.
 * Fallback bộ nhớ trong session để app không crash; session không giữ sau khi tắt app.
 */
const memory = new Map<string, string>();
let preferMemory = false;
let nativeChecked = false;

async function detectNative(): Promise<void> {
  if (preferMemory || nativeChecked) return;
  try {
    await AsyncStorage.setItem("__loza_storage_ping__", "1");
    await AsyncStorage.removeItem("__loza_storage_ping__");
    nativeChecked = true;
  } catch {
    preferMemory = true;
    nativeChecked = true;
  }
}

export const appStorage = {
  async getItem(key: string): Promise<string | null> {
    await detectNative();
    if (preferMemory) return memory.get(key) ?? null;
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      preferMemory = true;
      return memory.get(key) ?? null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    await detectNative();
    if (preferMemory) {
      memory.set(key, value);
      return;
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      preferMemory = true;
      memory.set(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    memory.delete(key);
    if (!preferMemory) {
      try {
        await AsyncStorage.removeItem(key);
      } catch {
        preferMemory = true;
      }
    }
  },
};
