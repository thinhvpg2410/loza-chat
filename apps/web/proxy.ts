import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { LOZA_ACCESS_COOKIE, LOZA_SESSION_COOKIE } from "./lib/auth/constants";

function isPublicAuthPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password"
  );
}

function hasSession(request: NextRequest): boolean {
  if (process.env.LOZA_AUTH_BYPASS === "1") {
    return true;
  }
  const mock = request.cookies.get(LOZA_SESSION_COOKIE)?.value;
  const access = request.cookies.get(LOZA_ACCESS_COOKIE)?.value;
  return Boolean(mock) || Boolean(access);
}

export function proxy(request: NextRequest) {
  if (process.env.LOZA_AUTH_BYPASS === "1") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const session = hasSession(request);

  if (isPublicAuthPath(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
