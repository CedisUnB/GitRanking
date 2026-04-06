import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/auth"];

export async function middleware(req: NextRequest) {

  if (req.nextUrl.pathname.startsWith("/api/webhook")) {
    return;
  }

  const { pathname } = req.nextUrl;

  // Let NextAuth API routes and static assets through unconditionally
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Authenticated user visiting /login → redirect to profile
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/profile", req.url));
  }

  // Unauthenticated user visiting a protected route → redirect to login
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (!token && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brands/).*)" ],
};

