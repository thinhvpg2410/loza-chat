export const CORRELATION_HEADER = "X-Correlation-Id";

export function createCorrelationId(prefix = "web"): string {
  const random = Math.random().toString(16).slice(2, 10);
  return `${prefix}-${Date.now()}-${random}`;
}
