import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: no session cookie means straight to the login page.
// The real check (is the session valid and the user active?) runs in
// requireUser() on every page and server action.

const SESSION_COOKIE = "mcs_session";
const PUBLIC_PATHS = ["/login", "/setup", "/register"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();

  if (!request.cookies.has(SESSION_COOKIE)) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Skip Next.js internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
