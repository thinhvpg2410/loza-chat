import { isAxiosError } from "axios";

function messageFromResponseShape(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("response" in error)) return null;
  const data = (error as { response?: { data?: { message?: string } } }).response?.data;
  return typeof data?.message === "string" ? data.message : null;
}

export function getErrorMessage(error: unknown, fallback = "Đã có lỗi xảy ra"): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (error.message) return error.message;
  }
  const mockMsg = messageFromResponseShape(error);
  if (mockMsg) return mockMsg;
  if (error instanceof Error) return error.message;
  return fallback;
}
