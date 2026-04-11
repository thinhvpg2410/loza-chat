/**
 * Deep link / payload encoded in the web login QR for the mobile app.
 * Override with NEXT_PUBLIC_QR_LOGIN_URL_PREFIX (must end with the token delimiter, e.g. `?session=`).
 */
export function buildWebQrLoginPayload(sessionToken: string): string {
  const prefix =
    process.env.NEXT_PUBLIC_QR_LOGIN_URL_PREFIX?.trim() || "mobile://qr-login?session=";
  return `${prefix}${sessionToken}`;
}
