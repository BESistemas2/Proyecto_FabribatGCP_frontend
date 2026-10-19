import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("fabribat_auth_token")?.value;

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const isProtectedPath =
    pathname.startsWith("/workbench") ||
    pathname.startsWith("/cargas") ||
    pathname.startsWith("/actas") ||
    pathname.startsWith("/cuentas") ||
    pathname.startsWith("/admin/usuarios");
  const isLoginPath = pathname === "/login";

  if (isLoginPath) {
    if (token) {
      const dashboardUrl = new URL("/workbench", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
    return NextResponse.next();
  }

  if (isProtectedPath && !isPublicPath) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$|.*\\.woff$|.*\\.woff2$).*)",
  ],
};
