type TelemetryModule = "chat" | "upload" | "realtime" | "auth" | "unknown";

type TelemetryPayload = {
  module: TelemetryModule;
  action: string;
  message: string;
  meta?: Record<string, unknown>;
  at: string;
};

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

export function trackClientError(
  module: TelemetryModule,
  action: string,
  error: unknown,
  meta?: Record<string, unknown>,
) {
  const payload: TelemetryPayload = {
    module,
    action,
    message: toMessage(error),
    meta,
    at: new Date().toISOString(),
  };
  console.error("[telemetry:error]", payload);
}
