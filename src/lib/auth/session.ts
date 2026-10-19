// Manejo centralizado de la sesión en el navegador.
// El token vive en localStorage (para el header Authorization) y en una cookie
// que solo usa el middleware de Next para decidir si redirige al login.
import type { AuthUser } from "@/lib/api/auth";

export const TOKEN_KEY = "fabribat_auth_token";
export const USER_KEY = "fabribat_auth_user";

const esNavegador = () => typeof window !== "undefined";

function escribirCookie(valor: string, maxAgeSeg: number) {
  const secure = esNavegador() && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TOKEN_KEY}=${valor}; path=/; max-age=${maxAgeSeg}; SameSite=Lax${secure}`;
}

/** Segundos que le quedan al JWT (0 si ya expiró o no se puede leer). */
export function segundosRestantes(token: string | null): number {
  if (!token) return 0;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return Math.max(0, Math.floor(payload.exp - Date.now() / 1000));
  } catch {
    return 0;
  }
}

export function guardarSesion(token: string, user: AuthUser) {
  if (!esNavegador()) return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  escribirCookie(token, segundosRestantes(token) || 60);
}

export function actualizarUsuario(user: AuthUser) {
  if (esNavegador()) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function leerSesion(): { token: string | null; user: AuthUser | null } {
  if (!esNavegador()) return { token: null, user: null };
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || segundosRestantes(token) === 0) {
    limpiarSesion();
    return { token: null, user: null };
  }
  try {
    return { token, user: JSON.parse(localStorage.getItem(USER_KEY) || "null") };
  } catch {
    return { token, user: null };
  }
}

/** Borra TODO rastro de la sesión (localStorage y cookie). */
export function limpiarSesion() {
  if (!esNavegador()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  escribirCookie("", 0);
}

/** Solo permite volver a rutas internas (evita redirecciones a otros sitios o javascript:). */
export function redireccionSegura(destino: string | null | undefined, porDefecto = "/workbench"): string {
  if (!destino || !destino.startsWith("/") || destino.startsWith("//") || destino.startsWith("/\\")) {
    return porDefecto;
  }
  return destino;
}
