/** HttpOnly flag cookie for local demo login when no API is configured. */
export const LOZA_SESSION_COOKIE = "loza_session";

/** HttpOnly JWT access token (set after successful API login). */
export const LOZA_ACCESS_COOKIE = "loza_access_token";

/** HttpOnly refresh token for logout / future refresh flows. */
export const LOZA_REFRESH_COOKIE = "loza_refresh_token";

/** Stable device id for `/auth/login` (required by API). */
export const LOZA_DEVICE_COOKIE = "loza_device_id";

/** Short-lived JWT after registration OTP (httpOnly). */
export const LOZA_REGISTER_TOKEN_COOKIE = "loza_register_token";

/** Short-lived JWT after forgot-password OTP (httpOnly). */
export const LOZA_FORGOT_TOKEN_COOKIE = "loza_forgot_token";

/** Short-lived JWT after /auth/login when the browser must verify via OTP (httpOnly). */
export const LOZA_DEVICE_VERIFY_TOKEN_COOKIE = "loza_device_verify_token";
