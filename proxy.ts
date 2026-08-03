import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hasSession = Boolean(getSessionCookie(request));
  const protectedPath = request.nextUrl.pathname.startsWith("/studio") || request.nextUrl.pathname.startsWith("/settings");
  if (protectedPath && !hasSession) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("returnTo", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(signIn);
  }
  if (hasSession && request.nextUrl.pathname === "/sign-in") return NextResponse.redirect(new URL("/studio", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/studio/:path*", "/settings/:path*", "/sign-in"] };
