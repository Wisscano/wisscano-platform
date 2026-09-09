import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/session";

/**
 * Edge-level gate for every /admin route except /admin/login. This is a
 * UX convenience (fast redirect, no flash of protected content) — it is
 * NOT the security boundary. Every actual mutation is re-checked
 * server-side via requireAdmin() in lib/auth.ts, per §17: never rely on
 * hiding admin pages from the frontend alone.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.redirect(new URL("/admin/login", req.url));

  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
}

export const config = { matcher: ["/admin/:path*"] };
