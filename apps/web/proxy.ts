import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { LOZA_SESSION_COOKIE } from "./lib/auth/constants";

const PROTECTED_PREFIXES = ["/contacts", "/settings"];

function isProtectedPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function proxy(request: NextRequest) {
  if (process.env.LOZA_AUTH_BYPASS === "1") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(LOZA_SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    if (hasSession) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (isProtectedPath(pathname) && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/contacts/:path*", "/settings/:path*"],
};
