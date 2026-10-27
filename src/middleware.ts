import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_COOKIE = "fabribat_auth_token";
const RUTAS_PROTEGIDAS = ["/dashboard", "/workbench", "/cargas", "/actas", "/cuentas", "/admin"];

/** true si la cookie tiene un JWT aún vigente (solo UX: la seguridad real está en la API). */
function tokenVigente(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const sesion = tokenVigente(request.cookies.get(TOKEN_COOKIE)?.value);

  if (pathname === "/login") {
    // Con sesión vigente no tiene sentido ver el login (salvo que venga de una expiración)
    if (sesion && searchParams.get("expired") !== "1") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (RUTAS_PROTEGIDAS.some((r) => pathname === r || pathname.startsWith(`${r}/`)) && !sesion) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(TOKEN_COOKIE);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico|woff2?)$).*)"],
};
